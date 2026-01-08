/**
 * ProtocolDB.js
 * Static database for signal identification, MAC OUI lookups, and frequency maps.
 */

const ProtocolDB = {
    // Common Sub-GHz Frequencies & Protocols
    frequencies: {
        '433.92': ['CAME', 'Nice', 'PT2262', 'Keeloq'],
        '315.00': ['Car Keyfobs (Legacy)', 'Garage Doors (US)'],
        '868.35': ['Z-Wave', 'Security Systems (EU)'],
        '915.00': ['LoRaWAN (US)', 'Z-Wave (US)']
    },

    // Partial OUI Database (First 3 bytes of MAC : Vendor)
    // In a real app, this might be a large JSON file or SQLite db
    vendors: {
        '00:15:83': 'Miele',
        'B8:27:EB': 'Raspberry Pi Foundation',
        'DC:A6:32': 'Raspberry Pi Trading',
        'E4:5F:01': 'Raspberry Pi Trading',
        '00:50:F2': 'Microsoft',
        '48:2C:6A': 'Microsoft (Surface)',
        '00:09:DD': 'Mellanox',
        '00:14:22': 'Dell',
        '00:16:3E': 'Xensource',
        '00:1C:14': 'VMware',
        '00:50:56': 'VMware',
        '00:0C:29': 'VMware',
        '00:1A:11': 'Google',
        'F4:F5:D8': 'Google',
        'AC:CF:5C': 'Apple',
        'BC:92:6B': 'Apple',
        'F0:18:98': 'Apple'
    },

    // Known Hex Patterns / Signatures (Simplistic for demo)
    signatures: [
        { name: 'CAME Top-432', pattern: /^0x[0-9A-F]{6}$/i, protocol: 'Fixed Code', freq: 433.92 },
        { name: 'Nice Flo', pattern: /^0x[0-9A-F]{10}$/i, protocol: 'Rolling Code', freq: 433.92 }
    ],

    /**
     * Identify a Radio Signal
     * @param {string} dataHex - Raw data string (e.g., "0xAABBCC")
     * @param {number} freq - Frequency in MHz
     */
    identifyRadio(dataHex, freq) {
        const numericFreq = parseFloat(freq);

        // 1. Check Signatures
        for (const sig of this.signatures) {
            if (sig.pattern.test(dataHex)) {
                return { ...sig, matchType: 'signature' };
            }
        }

        // 2. Check Frequency Hints
        // Find closest freq key
        const freqKey = Object.keys(this.frequencies).find(f => Math.abs(parseFloat(f) - numericFreq) < 0.5);
        if (freqKey) {
            return {
                name: 'Unknown Device',
                protocol: `Possible: ${this.frequencies[freqKey].join(', ')}`,
                matchType: 'frequency_hint'
            };
        }

        return { name: 'Unknown Signal', protocol: 'Unknown', matchType: 'none' };
    },

    /**
     * Lookup MAC Vendor
     * @param {string} mac - MAC Address (e.g., "00:15:83:E1:CA:55")
     */
    getVendor(mac) {
        if (!mac || mac.length < 8) return 'Unknown Vendor';
        const oui = mac.substring(0, 8).toUpperCase().replace(/-/g, ':'); // Ensure colon format
        return this.vendors[oui] || 'Unknown Vendor';
    }
};

module.exports = ProtocolDB;
