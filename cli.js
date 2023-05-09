// cli.js
const fs = require('fs');
const path = require('path');
const { discoverHosts } = require('./dist/snmp-scout');

const defaultRulesPath = path.join(process.cwd(), 'snmp-scout-rules.js');

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-r' || args[i] === '--rules') {
            options.rules = args[++i];
        } else if (args[i] === '-h' || args[i] === '--help') {
            options.help = true;
        }
    }

    return options;
}

function printUsage() {
    console.log('Usage: snmp-scout [-r|--rules <path-to-rules-file>] [-h|--help]');
    console.log('Options:');
    console.log('  -r, --rules <path-to-rules-file>   Specify a path to the discovery rules file');
    console.log('  -h, --help                          Show this help message and exit');
}

async function main() {
    const options = parseArgs();

    if (options.help) {
        printUsage();
        process.exit(0);
    }

    let rules = [];

    const rulesPath = options.rules ? path.resolve(options.rules) : defaultRulesPath;

    if (!fs.existsSync(rulesPath)) {
        console.error(`Error: Rules file not found at ${rulesPath}`);
        printUsage();
        process.exit(1);
    }

    try {
        rules = require(rulesPath);
    } catch (err) {
        console.error(`Error: Failed to load rules from ${rulesPath}`);
        console.error(err.message);
        process.exit(1);
    }

    const discoveredHosts = await discoverHosts(rules);

    for (const host of discoveredHosts) {
        console.log(`${host.rule.name}: ${host.ip}`);
    }
}

main();
