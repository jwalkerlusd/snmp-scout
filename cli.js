// cli.js
const fs = require('fs');
const path = require('path');
const { discoverHosts } = require('./dist/snmp-scout');

function parseArgs() {
    let args = process.argv.slice(2);
    let rulesPath = path.join(process.cwd(), 'snmp-scout-rules.js');
    let help = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--rules" || args[i] === "-r") {
            if (i + 1 > args.length || (/^-/.test(args[i + 1])))
                throw new Error("--rules|-r specified without a path");
            rulesPath = args[++i];
        } else if (args[i] === "--help" || args[i] === "-h") {
            help = true;
        }
    }

    return { rulesPath, help };
}

function printUsage() {
    console.log(`
  Usage: snmp-scout [OPTIONS]
  
  OPTIONS:
    -r, --rules PATH    The path to a CommonJS module that exports discovery rules
                          (default: "./snmp-scout-rules.js")
    -h, --help          Show this help message and exit
  `);
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

    const discoveredHosts = await discoverHosts(rules);

    for (const host of discoveredHosts) {
        console.log(...host);
    }
}

main();
