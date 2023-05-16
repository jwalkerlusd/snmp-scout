#!/usr/bin/env node

// cli.js
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { discoverHosts } = require('./dist/snmp-scout');

function parseArgs() {
    let args = process.argv.slice(2);
    let rulesPath = path.join(process.cwd(), 'snmp-scout-rules.js');
    let concurrency = 50;
    let streamOutput = false;
    let outputJson = false;
    let help = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--rules" || args[i] === "-r") {
            if (i + 1 > args.length || (/^-/.test(args[i + 1])))
                throw new Error("--rules|-r specified without a path");
            rulesPath = args[++i];
        } else if (args[i] === "--concurrency" || args[i] === "-c") {
            if (i + 1 > args.length || (/^-/.test(args[i + 1])))
                throw new Error("--concurrency|-c specified without a value");
            concurrency = args[++i];
        } else if (args[i] === "--stream" || args[i] === "-s") {
            streamOutput = true;
        } else if (args[i] === "--json" || args[i] === "-j") {
            outputJson = true;
        } else if (args[i] === "--help" || args[i] === "-h") {
            help = true;
        }
    }

    return { rulesPath, concurrency, streamOutput, outputJson, help };
}

function printUsage() {
    console.log(`
  Usage: snmp-scout [OPTIONS]
  
  OPTIONS:
    -r, --rules PATH            The path to a CommonJS module that exports discovery rules
                                (default: "./snmp-scout-rules.js")
    -c, --concurrency number    Limit SNMP/UDP connections to this number (default: 50)
    -s, --stream                Print each Host to the console as they are discovered
    -j, --json                  Output discovered hosts in JSON format
    -h, --help                  Show this help message and exit
  `);
}

function printTableHeader() {
    console.log("Rule Name\tHost IP\tCommunity");
}

function formatTableRow(host) {
    return `${host.rule.name}\t${host.ip}\t${host.community}\n`;
}

function printTableRow(host) {
    process.stdout.write(formatTableRow(host));
}

async function main() {

    let options = {};
    try {
        options = parseArgs();
    } catch (err) {
        console.error("Error: Failed to parse options");
        console.error(err.message);
        process.exit(1);
    }

    if (options.help) {
        printUsage();
        process.exit(0);
    }

    let rules = [];

    if (!fs.existsSync(options.rulesPath)) {
        console.error(`Error: Rules file not found at ${options.rulesPath}`);
        printUsage();
        process.exit(1);
    }

    try {
        rules = require(options.rulesPath);
    } catch (err) {
        console.error(`Error: Failed to load rules from ${options.rulesPath}`);
        console.error(err.message);
        process.exit(1);
    }

    if (!options.outputJson)
        printTableHeader();

    if (options.streamOutput) {
        const transformHost = new Transform({
            objectMode: true,
            transform(host, _, callback) {
                // if --json is specified then...
                const output = options.outputJson
                    ? JSON.stringify(host) + '\n' // JSON stringify each host in-place
                    : formatTableRow(host); // otherwise print details spaced with tabs
                this.push(output);
                callback();
            },
        });

        discoverHosts(rules, options.concurrency, true)
            .pipe(transformHost)
            .pipe(process.stdout)
            .on('error', (err) => {
                console.error("Error: There was an error during discovery");
                console.error(err.message);
                process.exit(1);
            });
    }
    else {
        const discoveredHosts = await discoverHosts(rules);

        if (options.outputJson) {
            console.log(JSON.stringify(discoveredHosts));
        } else {
            discoveredHosts.forEach(printTableRow);

        }
    }
}
main();
