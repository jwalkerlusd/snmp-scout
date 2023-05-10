"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverHosts = void 0;
// snmp-scout.ts
const netSnmp = __importStar(require("net-snmp"));
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
/**
 * Fetches SNMP varbinds for a specific IP address and community.
 *
 * @param ip - The IP address of the target device.
 * @param oids - The OIDs to fetch from the device.
 * @param community - The SNMP community string.
 * @param options - The SNMP session options.
 * @returns An array of SNMP varbinds.
 */
async function getSNMPVarbinds(ip, oids, community, options) {
    const session = netSnmp.createSession(ip, community, options);
    const varbinds = await new Promise((resolve, reject) => {
        session.get(oids, (error, varbinds) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(varbinds);
            }
            session.close();
        });
    });
    // Filter out varbinds with errors
    const validVarbinds = varbinds.filter((varbind) => !netSnmp.isVarbindError(varbind));
    return validVarbinds;
}
/**
 * Processes a discovery rule and attempts to discover hosts within the specified subnet.
 *
 * @param rule - The discovery rule to process.
 * @returns An array of discovered hosts.
 */
async function processRule(rule) {
    const [subnet, mask] = rule.subnet.split('/');
    const subnetInt = ipToInt(subnet);
    const maskInt = ~(2 ** (32 - parseInt(mask)) - 1);
    const firstHostInt = (subnetInt & maskInt) + 1;
    const lastHostInt = (subnetInt | ~maskInt) - 1;
    const fetchVarbindsPromises = [];
    for (let currentHostInt = firstHostInt; currentHostInt <= lastHostInt; currentHostInt++) {
        const currentHostIp = intToIp(currentHostInt);
        for (const community of rule.communities) {
            fetchVarbindsPromises.push(getSNMPVarbinds(currentHostIp, rule.oids, community, rule.options).then((varbinds) => {
                if (rule.matchFunction(currentHostIp, varbinds)) {
                    return {
                        ip: currentHostIp,
                        community,
                        varbinds,
                        rule,
                    };
                }
                else {
                    return null;
                }
            })
                .catch(() => {
                return null;
            }));
        }
    }
    const validDiscoveredHosts = (await Promise.all(fetchVarbindsPromises)).filter((host) => host !== null);
    return validDiscoveredHosts;
}
/**
 * Discovers SNMP hosts in a subnet according to the provided set of rules.
 *
 * @param rules - An array of discovery rules.
 * @returns An array of discovered hosts.
 */
async function discoverHosts(rules = []) {
    const allDiscoveredHosts = [];
    for (const rule of rules) {
        try {
            const hosts = await processRule(rule);
            allDiscoveredHosts.push(...hosts);
        }
        catch (err) {
            console.error("Error processing rule:", err);
        }
    }
    return allDiscoveredHosts;
}
exports.discoverHosts = discoverHosts;
