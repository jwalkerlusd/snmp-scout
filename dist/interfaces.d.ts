/**
 * Represents an SNMP varbind.
 */
export interface Varbind {
    oid: string;
    type: number;
    value: any;
}
/**
 * Represents a discovered host with its IP, and the community string, varbinds, and associated rule that was used to discover it.
 */
export interface Host {
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
export interface Rule {
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
