/** Runs `fn` over the items with at most `size` of them in flight at once; a failure of one item is left to `fn` to handle. */
export async function pool<T>(items: readonly T[], size: number, fn: (item: T, index: number) => Promise<void>): Promise<void> {
    let next = 0;
    const worker = async (): Promise<void> => {
        while (next < items.length) {
            const i = next++;
            await fn(items[i], i);
        }
    };
    await Promise.all(Array.from({ length: Math.max(1, Math.min(size, items.length)) }, worker));
}
