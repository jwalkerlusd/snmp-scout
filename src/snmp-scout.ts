// snmp-scout.ts
import { Readable } from 'node:stream';
import * as netSnmp from 'net-snmp';
import { AsyncConcurrentTaskQueue, ipToInt, intToIp } from './utils';
import { Rule, Varbind, Host } from './interfaces';

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
  options?: object
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
 * Processes a single rule, iterating through its subnet and communities, and attempting to discover hosts.
 * Discovered hosts are pushed to the output stream if they match the rule's matchFunction.
 *
 * @param rule - The rule to process.
 * @param output - The Readable stream to push discovered hosts to.
 * @param queue - The PromiseQueue to manage concurrency of SNMP requests.
 */
async function processRule(rule: Rule, output: Readable, queue: AsyncConcurrentTaskQueue): Promise<void> {
  const { subnet, communities, oids, options, matchFunction } = rule;

  const [subnetAddress, cidr] = subnet.split('/');
  const subnetInt = ipToInt(subnetAddress);
  const cidrInt = parseInt(cidr, 10);
  const mask = ~((1 << (32 - cidrInt)) - 1) >>> 0;

  const firstIpInt = (subnetInt & mask) + 1;
  const lastIpInt = (subnetInt | ~mask) - 1;

  for (let ipInt = firstIpInt; ipInt <= lastIpInt; ipInt++) {
    const ipAddress = intToIp(ipInt);

    for (const community of communities) {
      queue.add(async () => {
        try {
          const varbinds = await getSNMPVarbinds(ipAddress, oids, community, options);

          if (matchFunction(ipAddress, varbinds)) {
            const host: Host = {
              ip: ipAddress,
              community,
              varbinds,
              rule
            };
            output.push(host);
          }
        } catch (error) {
          // Ignore errors
        }
      });
    }
  }
}

/**
 * Discovers hosts on a network using SNMP and a set of rules.
 * The function returns a Readable stream of discovered hosts.
 *
 * @param rules - An array of rules to process for host discovery.
 * @param concurrency - The maximum number of concurrent SNMP requests allowed.
 * @returns A Readable stream of discovered hosts.
 */
function discoverHosts(rules: Rule[], concurrency: number = 50, streamOutput: boolean = false): Readable | Promise<Host[]> {
  const output = new Readable({ objectMode: true, read() { } });
  const queue = new AsyncConcurrentTaskQueue(concurrency);

  rules.forEach((rule) => processRule(rule, output, queue));

  queue.onFinished(() => {
    // After all rules have been processed, close the output stream.
    output.push(null);
  });

  // if the caller requested the stream then return it
  if (streamOutput) {
    return output;
  } else { // otherwise return a Promise that resolves with the discovered hosts when the stream is finished
    return new Promise<Host[]>((resolve) => {
      var discoveredHosts: Host[] = [];
      output.on('data', (host: Host) => {
        discoveredHosts.push(host);
      });

      output.on('end', () => {
        resolve(discoveredHosts);
      });
    });
  }
}

export { discoverHosts };
