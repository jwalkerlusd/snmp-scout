// snmp-scout.ts
import * as netSnmp from 'net-snmp';

/**
 * Represents an SNMP varbind.
 */
interface Varbind {
    oid: string;
    type: number;
    value: any;
}

/**
 * Represents a host discovered during the SNMP scan.
 */
interface Host {
    ip: string;
    community: string;
    varbinds: Varbind[];
    rule: Rule;
}

/**
 * Represents a rule used to discover hosts in a subnet.
 */
interface Rule {
    subnet: string;
    communities: string[];
    oids: string[];
    options: object;
    matchFunction: (ip: string, varbinds: Varbind[]) => boolean;
}

/**
 * Converts an IP address string to an integer.
 *
 * @param ip - The IP address string.
 * @returns The integer representation of the IP address.
 */
function ipToInt(ip: string): number {
    const bytes = ip.split('.').map((byte) => parseInt(byte, 10));
    return ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
}

/**
 * Converts an integer to an IP address string.
 *
 * @param integer - The integer representation of the IP address.
 * @returns The IP address string.
 */
function intToIp(integer: number): string {
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
async function getSNMPVarbinds(
    ip: string,
    oids: string[],
    community: string,
    options: object
  ): Promise<Varbind[]> {
    const session = netSnmp.createSession(ip, community, options);
    const varbinds = await new Promise<Varbind[]>((resolve, reject) => {
        session.get(oids, (error, varbinds) => {
            if (error) {
                reject(error);
            } else {
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
async function processRule(rule: Rule): Promise<Host[]> {
    const [subnetIp, prefixLength] = rule.subnet.split('/');
    const subnetInt = ipToInt(subnetIp);
    const prefixInt = parseInt(prefixLength, 10);

    const numHosts = 2 ** (32 - prefixInt) - 2; // Subtract 2 for network and broadcast addresses
    const discoveredHosts: Host[] = [];

    for (const community of rule.communities) {
        const options = {
            ...rule.options,
            community,
        };

        // Create an array of promises to fetch varbinds for all IPs concurrently
        const fetchVarbindsPromises = Array.from({ length: numHosts }, (_, i) => {
            const ip = intToIp(subnetInt + i + 1); // Add 1 to skip the network address
            return (async () => {
                try {
                    const varbinds = await getSNMPVarbinds(ip, rule.oids, community, options);
                    if (rule.matchFunction(ip, varbinds)) {
                        return {
                            ip,
                            community,
                            varbinds,
                        };
                    }
                } catch (err) {
                    // Ignore errors related to individual hosts
                }
                return null;
            })();
        });

        // Wait for all promises to complete and filter out any null values
        const validHosts: Host[] = (await Promise.all(fetchVarbindsPromises)).filter((host): host is Host => host !== null);
        discoveredHosts.push(...validHosts);
    }

    return discoveredHosts;
}

/**
 * Discovers SNMP hosts in a subnet according to the provided set of rules.
 *
 * @param rules - An array of discovery rules.
 * @returns An array of discovered hosts.
 */
async function discoverHosts(rules: Rule[] = []): Promise<Host[]> {
    const allDiscoveredHosts: Host[] = [];

    for (const rule of rules) {
        try {
            const hosts = await processRule(rule);
            for (const host of hosts) {
                // Check if the host IP already exists in the allDiscoveredHosts array
                const existingHostIndex = allDiscoveredHosts.findIndex(
                    (existingHost) => existingHost.ip === host.ip
                );

                if (existingHostIndex === -1) {
                    // If the host IP does not exist, add the host object with IP, community, varbinds, and rule
                    allDiscoveredHosts.push({
                        ip: host.ip,
                        community: host.community,
                        varbinds: host.varbinds,
                        rule,
                    });
                } else {
                    // If the host IP exists, update the existing host object with the new information
                    allDiscoveredHosts[existingHostIndex] = {
                        ...allDiscoveredHosts[existingHostIndex],
                        community: host.community,
                        varbinds: host.varbinds,
                        rule,
                    };
                }
            }
        } catch (err) {
            console.error("Error processing rule:", err);
        }
    }

    return allDiscoveredHosts;
}

export { discoverHosts };
