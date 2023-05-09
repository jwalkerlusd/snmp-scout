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
 * Represents a discovered host with its IP, and the community string, varbinds, and associated rule that was used to discover it.
 */
interface Host {
    /**
     * The IP address of the host.
     */
    ip: string;
  
    /**
     * The SNMP community string used to discover the host.
     */
    community: string;
  
    /**
     * The varbinds returned from the SNMP request to discover the host.
     */
    varbinds: Varbind[];
  
    /**
     * An array of references to the rules that the host was discovered with.
     */
    rule: Rule;
  }
  

/**
 * Represents a rule used to discover hosts in a subnet.
 */
interface Rule {
    /**
     * A user-friendly name for the rule.
     */
    name: string;

    /**
     * The subnet to scan for hosts, in CIDR notation (e.g., '192.168.1.0/24').
     */
    subnet: string;

    /**
     * Array of SNMP community strings to try for each host.
     */
    communities: string[];

    /**
     * Array of OIDs to fetch using SNMP.
     */
    oids: string[];

    /**
     * Options for the net-snmp session.
     */
    options?: object;

    /**
     * A function that determines if a host matches the rule based on the IP and varbinds.
     * @param ip - The IP address of the host.
     * @param varbinds - The varbinds returned from the SNMP request.
     * @returns - A boolean indicating if the host matches the rule.
     */
    matchFunction(ip: string, varbinds: Varbind[]): boolean;
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
    const [subnet, mask] = rule.subnet.split('/');
    const subnetInt = ipToInt(subnet);
    const maskInt = ~(2 ** (32 - parseInt(mask)) - 1);
    const firstHostInt = (subnetInt & maskInt) + 1;
    const lastHostInt = (subnetInt | ~maskInt) - 1;

    const fetchVarbindsPromises: Promise<Host | null>[] = [];

    for (let currentHostInt = firstHostInt; currentHostInt <= lastHostInt; currentHostInt++) {
        const currentHostIp = intToIp(currentHostInt);

        for (const community of rule.communities) {
            fetchVarbindsPromises.push(
                getSNMPVarbinds(currentHostIp, rule.oids, community, rule.options).then((varbinds) => {
                    if (rule.matchFunction(currentHostIp, varbinds)) {
                        return {
                            ip: currentHostIp,
                            community,
                            varbinds,
                            rule,
                        };
                    } else {
                        return null;
                    }
                })
            );
        }
    }

    const validDiscoveredHosts: Host[] = (await Promise.all(fetchVarbindsPromises)).filter((host): host is Host => host !== null);

    return validDiscoveredHosts;
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
            allDiscoveredHosts.push(...hosts);
        } catch (err) {
            console.error("Error processing rule:", err);
        }
    }

    return allDiscoveredHosts;
}

export { discoverHosts };
