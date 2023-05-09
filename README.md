# SNMP-Scout

SNMP-Scout is a Node.js-based host discovery tool that uses SNMP to find hosts on a given subnet specified with a CIDR-formatted string.

## Features

- Discover hosts on a specified subnet using SNMP
- Support for multiple community strings
- Customizable discovery rules using a separate file
- CLI for easy execution

## Installation

Install SNMP-Scout globally using npm:

```sh
npm install -g snmp-scout
```

## Usage

### CLI

Run SNMP-Scout from the command line:

```sh
snmp-scout --rules path/to/rules/file
```

Available options:

- `-r, --rules <path-to-rules-file>`: Specify a path to the discovery rules file - default: ./snmp-scout-rules.js -- see format below
- `-h, --help`: Show help message and exit

### As a module

You can also use SNMP-Scout as a module in your Node.js project:

```javascript
const { discoverHosts } = require('snmp-scout');

const rules = [
  // Define your discovery rules here - see format below
];

discoverHosts(rules).then(discoveredHosts => {
  // Process the discovered hosts
});
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

When used as CLI, the rules file (default: ./snmp-scout-rules.js) should be Javascript and export
the rules in an Array:

```javascript
module.exports = [
  {
    name: 'Rule Name',
    community: ['public', 'private'],
    oids: ['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.5.0'],
    matchFunction: (ip, varbinds) => {
      // Your matching logic here
      // Return true|false
    },
  },
];
```

When imported as a module, the rules are passed to the discoverHosts(rules) function.

## License

This project is licensed under the ISC License.
