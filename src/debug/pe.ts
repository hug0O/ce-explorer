/**
 * What the debugger needs of a Windows executable: whether it is 32 or 64 bits, where it asks to be loaded, and where its sections are, so
 * that an address of the map file (a segment and an offset) becomes an address in the running program.
 *
 * Pure: a buffer in, the facts out.
 */
export interface PeSection { name: string; virtualAddress: number; virtualSize: number }

export interface PeInfo {
    is64: boolean;
    imageBase: number;
    entryRva: number;
    sections: PeSection[];
}

/** The header of an executable (`.exe`, `.dll`), or undefined when the buffer is not one. */
export function readPe(buf: Buffer): PeInfo | undefined {
    if (buf.length < 0x40 || buf.readUInt16LE(0) !== 0x5a4d) { return undefined; }
    const pe = buf.readUInt32LE(0x3c);
    if (pe + 24 > buf.length || buf.readUInt32LE(pe) !== 0x00004550) { return undefined; }
    const sectionCount = buf.readUInt16LE(pe + 6);
    const optionalSize = buf.readUInt16LE(pe + 20);
    const opt = pe + 24;
    const magic = buf.readUInt16LE(opt);
    if (magic !== 0x10b && magic !== 0x20b) { return undefined; }
    const is64 = magic === 0x20b;
    const entryRva = buf.readUInt32LE(opt + 16);
    const imageBase = is64 ? Number(buf.readBigUInt64LE(opt + 24)) : buf.readUInt32LE(opt + 28);
    const sections: PeSection[] = [];
    let at = opt + optionalSize;
    for (let i = 0; i < sectionCount && at + 40 <= buf.length; i++, at += 40) {
        sections.push({
            name: buf.toString('latin1', at, at + 8).replace(/\0+$/, ''),
            virtualSize: buf.readUInt32LE(at + 8),
            virtualAddress: buf.readUInt32LE(at + 12),
        });
    }
    return { is64, imageBase, entryRva, sections };
}
