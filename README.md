# SNMP-Scout

SNMP-Scout is a Node.js-based host discovery tool that uses SNMP to find hosts on a given subnet specified with a CIDR-formatted string.

## Features

- Discover hosts using SNMP
- Streamed host discoveries
- Customizable discovery rules
- Support for multiple community strings
- Support for matching multiple OIDs
- CLI and Module

## Installation

Install SNMP-Scout globally using npm:

```sh
npm install -g snmp-scout
```

Or install as a Node module using npm:

```sh
npm install --save snmp-scout
```

The example rules module (snmp-scout-rules.example.js) requires the net-snmp module for constants.
The net-snmp module must be installed in the working directory for the module to be loaded.
This is also needed for other modules that are imported/required by the rules module.

```javascript
// snmp-scout-rules.js
const snmp = require('net-snmp')
```

This will create/update the package.json file and node_modules folder in the current working directory.

```sh
npm install net-snmp
```

## Usage

### CLI

Run SNMP-Scout from the command line:

```sh
snmp-scout --rules path/to/rules/file
```

Available options:

- `-r, --rules <path-to-rules-file>`: Specify a path to the discovery rules file - default: ./snmp-scout-rules.js -- see format below
- `-c, --concurrency <number>`: The maximum number of SNMP/UDP connections to make concurrently, default: 50
- `-s, --stream`: Output hosts as they are discovered
- `-j, --json`: Output to STDOUT in JSON format instead of a table
- `-h, --help`: Show help message and exit

### As a module

You can also use SNMP-Scout as a module in your Node.js project:

```javascript
const { discoverHosts } = require('snmp-scout');

const rules = [
  // Define your discovery rules here - see format below
];

// default concurrency
discoverHosts(rules).then(discoveredHosts => {
  // Process the discovered hosts
});

// specify concurrency
discoverHosts(rules, 100).then(discoveredHosts => {
  // Process the discovered hosts
});
```

discoverHosts() can also return a Readable stream:

```javascript
var stream = discoverHosts(rules, options.concurrency, true);

stream.pipe(transformHost)
    .pipe(process.stdout)
    .on('error', (err) => {
      // ...
    });

// - or -

stream.on('data', (host) => { //... });

stream.on('end', () => { //... })
```

##### Host objects in discoveredHosts

```javascript
var discoveredHosts = [{
  "ip": "192.168.1.10",
  "community": "public",
  "varbinds": [
    {
      "oid": "1.3.6.1.2.1.1.1.0",
      "type": 4,
      "value": "Linux server 5.10.0-8-amd64 #1 SMP Debian 5.10.46-4 (2021-08-03) x86_64"
    }
  ],
  "rule": { // rules[i] - a direct reference of the rule in the rules Array
    "name": "Linux Host",
    "community": ["public"],
    "oids": ["1.3.6.1.2.1.1.1.0"],
    "matchFunction": (ip, varbinds) => { ... }
  }
}]
```

## Discovery Rules

When used as CLI, the rules file (default: ./snmp-scout-rules.js) should be a CommonJS module and export
the rules in an Array like so:

```javascript
module.exports = [
  {
    name: 'Rule Name',
    subnet: "192.168.0.0/24"
    community: ['public', 'private'],
    oids: ['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.5.0'],
    matchFunction: (ip, varbinds) => {
      // Your matching logic here
      // Return true|false
    },
  },
  // ...
];
```

When imported as a module, the rules are passed to the discoverHosts(rules) function.


## Contributing

Feel free to open issues or submit pull requests on the [GitHub repository](https://github.com/jwalkerlusd/snmp-scout).

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC)
