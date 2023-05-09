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

- `-r, --rules <path-to-rules-file>`: Specify a path to the discovery rules file
- `-h, --help`: Show help message and exit

### As a module

You can also use SNMP-Scout as a module in your Node.js project:

```javascript
const { discoverHosts } = require('snmp-scout');

const rules = [
  // Define your discovery rules here
];

discoverHosts(rules).then(discoveredHosts => {
  // Process the discovered hosts
});
```

## Discovery Rules

SNMP-Scout uses a separate file to define custom discovery rules. A sample `snmp-scout-rules.js` file should be provided in the working directory:

```javascript
module.exports = [
  {
    name: 'Rule Name',
    community: ['public', 'private'],
    oids: ['1.3.6.1.2.1.1.1.0', '1.3.6.1.2.1.1.5.0'],
    matchFunction: (ip, varbinds) => {
      // Your matching logic here
    },
  },
];
```

## License

This project is licensed under the ISC License.
