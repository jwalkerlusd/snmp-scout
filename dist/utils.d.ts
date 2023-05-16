/**
 * Converts an IP address string to an integer.
 *
 * @param ip - The IP address string.
 * @returns The integer representation of the IP address.
 */
export declare function ipToInt(ip: string): number;
/**
 * Converts an integer to an IP address string.
 *
 * @param integer - The integer representation of the IP address.
 * @returns The IP address string.
 */
export declare function intToIp(integer: number): string;
/**
 * AsyncConcurrentTaskQueue manages a queue of tasks with concurrency control.
 */
export declare class AsyncConcurrentTaskQueue {
    private concurrency;
    private tasks;
    private active;
    private errors;
    private internalPromise;
    private resolveInternalPromise;
    private rejectInternalPromise;
    constructor(concurrency: number);
    private run;
    private next;
    add(task: () => Promise<void>): void;
    onFinished(callback: (errors: Error[] | null) => void): void;
}
