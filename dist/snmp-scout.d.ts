/// <reference types="node" />
import { Readable } from 'node:stream';
import { Rule, Host } from './interfaces';
/**
 * Discovers hosts on a network using SNMP and a set of rules.
 * The function returns a Readable stream of discovered hosts.
 *
 * @param rules - An array of rules to process for host discovery.
 * @param concurrency - The maximum number of concurrent SNMP requests allowed.
 * @returns A Readable stream of discovered hosts.
 */
declare function discoverHosts(rules: Rule[], concurrency?: number, streamOutput?: boolean): Readable | Promise<Host[]>;
export { discoverHosts };
