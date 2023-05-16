"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncConcurrentTaskQueue = exports.intToIp = exports.ipToInt = void 0;
/**
 * Converts an IP address string to an integer.
 *
 * @param ip - The IP address string.
 * @returns The integer representation of the IP address.
 */
function ipToInt(ip) {
    const bytes = ip.split('.').map((byte) => parseInt(byte, 10));
    return ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
}
exports.ipToInt = ipToInt;
/**
 * Converts an integer to an IP address string.
 *
 * @param integer - The integer representation of the IP address.
 * @returns The IP address string.
 */
function intToIp(integer) {
    const byte1 = (integer >> 24) & 0xff;
    const byte2 = (integer >> 16) & 0xff;
    const byte3 = (integer >> 8) & 0xff;
    const byte4 = integer & 0xff;
    return `${byte1}.${byte2}.${byte3}.${byte4}`;
}
exports.intToIp = intToIp;
/**
 * AsyncConcurrentTaskQueue manages a queue of tasks with concurrency control.
 */
class AsyncConcurrentTaskQueue {
    constructor(concurrency) {
        this.resolveInternalPromise = () => { };
        this.rejectInternalPromise = () => { };
        this.concurrency = concurrency;
        this.tasks = [];
        this.active = 0;
        this.errors = [];
        this.internalPromise = new Promise((resolve, reject) => {
            this.resolveInternalPromise = resolve;
            this.rejectInternalPromise = reject;
        });
    }
    async run(task) {
        this.active++;
        try {
            await task();
        }
        catch (error) {
            this.errors.push(error instanceof Error ? error : new Error(String(error)));
        }
        this.active--;
        this.next();
    }
    next() {
        if (this.tasks.length === 0) {
            if (this.active === 0) {
                if (this.errors.length > 0) {
                    this.rejectInternalPromise(this.errors);
                }
                else {
                    this.resolveInternalPromise();
                }
            }
            return;
        }
        if (this.active >= this.concurrency)
            return;
        const task = this.tasks.shift();
        this.run(task);
    }
    add(task) {
        this.tasks.push(task);
        this.next();
    }
    onFinished(callback) {
        this.internalPromise.finally(() => {
            callback(this.errors.length > 0 ? this.errors : null);
        });
    }
}
exports.AsyncConcurrentTaskQueue = AsyncConcurrentTaskQueue;
