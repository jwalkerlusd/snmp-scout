const snmp = require("net-snmp"); // require net-snmp for constants

module.exports = [
    {
        name: "Cisco Switches",
        subnet: '192.168.0.0/24',
        communities: ['public', 'private'], // Add more community strings if needed
        options: {
            timeout: 1000,
            version: snmp.Version2c,
        },
        oids: [
            '1.3.6.1.2.1.1.1.0', // sysDescr.0 (system description)
        ],
        matchFunction: (ip, varbinds) => {
            let sysDescrVarbind = varbinds.find((v) => v.oid === '1.3.6.1.2.1.1.1.0');
            sysDescr = sysDescrVarbind ? sysDescrVarbind.value.toString() : "";
            return /Cisco IOS Software|Cisco NX-OS/.test(sysDescr);
        },
    },
    // Add more SNMP rules as needed
];
