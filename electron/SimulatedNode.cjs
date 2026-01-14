/*
 * SimulatedNode.cjs
 * 
 * Fake hardware emulator for when you don't have the Ghost Node plugged in.
 * Spits out random radio signals, WiFi beacons, and NFC reads so you can
 * test the UI without needing the actual dongles.
 * 
 * Only runs in dev mode - production builds won't touch this.
 */

const { EventEmitter } = require('events');

// some fun WiFi names I've seen in the wild
const SSID_POOL = [
    'HomeNetwork', 'CoffeeShop_5G', 'FBI_Surveillance_Van', 'Pretty_Fly_for_a_WiFi',
    'TellMyWifiLoveHer', 'WuTangLAN', 'GetOffMyLawn', 'ItHurtsWhenIP',
    'SkyNet_Global_Defense', 'Area_51_Guest', 'NotTheNSA', 'HideYoKidsHideYoWiFi'
];

// vendor OUI prefixes for realistic-looking MACs
const VENDOR_MACS = {
    'Apple': ['AC:CF:5C', 'BC:92:6B', 'F0:18:98'],
    'Samsung': ['00:15:99', '78:D6:F0', 'A4:7B:85'],
    'Google': ['F4:F5:D8', '00:1A:11', '94:EB:2C'],
    'Raspberry Pi': ['B8:27:EB', 'DC:A6:32', 'E4:5F:01'],
    'Espressif': ['24:0A:C4', '30:AE:A4', 'CC:50:E3'],
};

// common garage door and sensor protocols
const RADIO_PROTOCOLS = [
    { name: 'CAME Top-432', freq: 433.92, pattern: '0xA5B3C1' },
    { name: 'Nice Flo', freq: 433.92, pattern: '0x4D2F8A91C3' },
    { name: 'PT2262 Weather', freq: 433.92, pattern: '0x1234' },
    { name: 'Unknown Signal', freq: 315.00, pattern: '0xDEADBEEF' },
    { name: 'Z-Wave EU', freq: 868.35, pattern: '0x55AA' },
    { name: 'LoRa Packet', freq: 915.00, pattern: '0x7E010203' },
];

// fake badge UIDs
const NFC_UIDS = [
    '04:A1:B2:C3:D4:E5:F6',
    '04:DE:AD:BE:EF:12:34',
    '04:CA:FE:BA:BE:56:78',
    '04:BA:AD:F0:0D:9A:BC',
];

class SimulatedNode extends EventEmitter {
    constructor() {
        super();
        this.running = false;
        this.intervals = []; // legacy, kept for backwards compat
        this.activeTimeouts = {}; // per-type storage to avoid memory leaks
    }

    // slap a random suffix on a known vendor prefix
    randomMAC() {
        const vendors = Object.keys(VENDOR_MACS);
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const prefix = VENDOR_MACS[vendor][Math.floor(Math.random() * VENDOR_MACS[vendor].length)];
        const suffix = Array.from({ length: 3 }, () =>
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
        ).join(':');
        return `${prefix}:${suffix}`;
    }

    // typical RSSI range you'd see in the real world
    randomRSSI() {
        return Math.floor(Math.random() * 60) - 90; // -90 to -30 dBm
    }

    start() {
        if (this.running) return;
        this.running = true;
        console.log('[SimulatedNode] Started - pumping fake data');

        // schedules a callback with random delay, stores the timeout by type
        // so we only ever have one active timeout per emitter (no memory leak)
        const scheduleNext = (type, emitFn, minMs, maxMs) => {
            if (!this.running) return;

            const delay = minMs + Math.random() * (maxMs - minMs);

            // clear any existing timeout for this type
            if (this.activeTimeouts[type]) {
                clearTimeout(this.activeTimeouts[type]);
            }

            this.activeTimeouts[type] = setTimeout(() => {
                if (!this.running) return;
                emitFn();
                scheduleNext(type, emitFn, minMs, maxMs); // reschedule
            }, delay);
        };

        // sub-ghz radio noise every 2-8 seconds
        scheduleNext('radio', () => {
            const protocol = RADIO_PROTOCOLS[Math.floor(Math.random() * RADIO_PROTOCOLS.length)];
            this.emit('data', {
                source: 'CC1101',
                data: protocol.pattern,
                meta: { freq: protocol.freq, rssi: this.randomRSSI() },
                timestamp: Date.now(),
            });
        }, 2000, 8000);

        // wifi beacon spam every 1-4 seconds
        scheduleNext('wifi', () => {
            const ssid = SSID_POOL[Math.floor(Math.random() * SSID_POOL.length)];
            this.emit('data', {
                source: 'ESP32_WIFI',
                data: this.randomMAC(),
                meta: { ssid, rssi: this.randomRSSI(), channel: Math.floor(Math.random() * 11) + 1 },
                timestamp: Date.now(),
            });
        }, 1000, 4000);

        // nfc reads are less frequent - every 10-30 seconds
        scheduleNext('nfc', () => {
            const uid = NFC_UIDS[Math.floor(Math.random() * NFC_UIDS.length)];
            this.emit('data', {
                source: 'PN532',
                data: uid,
                meta: { protocol: Math.random() > 0.5 ? 'MIFARE Classic 1K' : 'NTAG215' },
                timestamp: Date.now(),
            });
        }, 10000, 30000);

        // system health check every 30 seconds (fixed interval is fine here)
        this.activeTimeouts['system'] = setInterval(() => {
            if (!this.running) return;
            this.emit('data', {
                source: 'SYSTEM',
                data: {
                    battery: Math.floor(Math.random() * 30) + 70, // 70-100%
                    temperature: Math.floor(Math.random() * 10) + 35, // 35-45°C
                    uptime: Date.now(),
                },
                timestamp: Date.now(),
            });
        }, 30000);
    }

    stop() {
        if (!this.running) return;
        this.running = false;

        // kill all the active timeouts/intervals
        Object.values(this.activeTimeouts).forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.activeTimeouts = {};

        // legacy cleanup
        this.intervals.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.intervals = [];

        console.log('[SimulatedNode] Stopped');
    }
}

module.exports = new SimulatedNode();
