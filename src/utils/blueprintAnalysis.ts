/**
 * Two questions about the call graph that a picture answers at a glance: which routines nobody calls, and which ones call each other in
 * a loop. Pure.
 */
export interface AnalysisEdge { from: string; to: string }

export interface Analysis {
    /** Routines with no caller in the file that are not known entry points (event handlers…). */
    unused: string[];
    /** Groups of routines that reach each other (A calls B calls A), each group with more than one routine. */
    cycles: string[][];
}

/** Strongly connected components (Tarjan), without the recursion that would overflow on a very long chain. */
export function components(ids: string[], edges: AnalysisEdge[]): string[][] {
    const out = new Map<string, string[]>(ids.map(i => [i, []]));
    for (const e of edges) { if (out.has(e.from) && out.has(e.to) && e.from !== e.to) { out.get(e.from)!.push(e.to); } }
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const result: string[][] = [];
    let counter = 0;
    for (const root of ids) {
        if (index.has(root)) { continue; }
        const work: { id: string; next: number }[] = [{ id: root, next: 0 }];
        index.set(root, counter); low.set(root, counter); counter++;
        stack.push(root); onStack.add(root);
        while (work.length) {
            const top = work[work.length - 1];
            const targets = out.get(top.id)!;
            if (top.next < targets.length) {
                const t = targets[top.next++];
                if (!index.has(t)) {
                    index.set(t, counter); low.set(t, counter); counter++;
                    stack.push(t); onStack.add(t);
                    work.push({ id: t, next: 0 });
                } else if (onStack.has(t)) {
                    low.set(top.id, Math.min(low.get(top.id)!, index.get(t)!));
                }
                continue;
            }
            work.pop();
            if (work.length) { const parent = work[work.length - 1].id; low.set(parent, Math.min(low.get(parent)!, low.get(top.id)!)); }
            if (low.get(top.id) === index.get(top.id)) {
                const comp: string[] = [];
                let w: string;
                do { w = stack.pop()!; onStack.delete(w); comp.push(w); } while (w !== top.id);
                result.push(comp.reverse());
            }
        }
    }
    return result;
}

export function analyze(ids: string[], edges: AnalysisEdge[], entryPoints: Iterable<string> = [], withBody: (id: string) => boolean = () => true): Analysis {
    const called = new Set(edges.filter(e => e.from !== e.to).map(e => e.to));
    const entry = new Set(entryPoints);
    const unused = ids.filter(id => !called.has(id) && !entry.has(id) && withBody(id));
    const cycles = components(ids, edges).filter(c => c.length > 1);
    return { unused, cycles };
}
