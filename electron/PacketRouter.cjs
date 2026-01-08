const { EventEmitter } = require('events');
const ProtocolDB = require('./ProtocolDB.cjs');
const db = require('./db.cjs');

class PacketRouter extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Route incoming data packet
     * @param {object} packet - JSON packet from SerialHandler
     * Expected format: { source: "ID", data: "...", meta: {...} }
     */
    route(packet) {
        // Basic validation
        if (!packet || !packet.source) {
            console.warn('[ROUTER] Invalid packet structure:', packet);
            return;
        }

        // Enrich packet with timestamp
        const enrichedPacket = {
            ...packet,
            timestamp: Date.now()
        };

        // Dispatch based on Source Module
        switch (packet.source.toUpperCase()) {
            case 'CC1101': // Sub-GHz Radio
                this.handleRadioPacket(enrichedPacket);
                break;

            case 'NRF24': // 2.4GHz / Mousejacking
            case 'ESP32_WIFI': // WiFi Sniffer
            case 'ESP32_BT':   // Bluetooth
                this.handleWirelessPacket(enrichedPacket);
                break;

            case 'PN532':   // NFC
            case 'RDM6300': // RFID
                this.handleAccessPacket(enrichedPacket);
                break;

            case 'SYSTEM': // Device Status/Battery
                this.emit('system:status', enrichedPacket.data);
                break;

            default:
                console.log(`[ROUTER] Unhandled source: ${packet.source}`);
                this.emit('raw:data', enrichedPacket);
        }
    }

    handleRadioPacket(packet) {
        // Hex data is often in packet.data
        const { data, meta } = packet;
        const freq = meta?.freq || 433.92;

        // Use ProtocolDB to fingerprint
        const fingerprint = ProtocolDB.identifyRadio(data, freq);

        const processedPacket = {
            ...packet,
            analysis: fingerprint
        };

        console.log(`[ROUTER] Radio Identified: ${fingerprint.name} (${fingerprint.protocol})`);

        // Emit specific event for frontend (Spectrum Tab)
        this.emit('radio:traffic', processedPacket);
    }

    handleWirelessPacket(packet) {
        const { data, meta } = packet;
        // data might be MAC address or SSID info
        // Example: data: "00:11:22:33:44:55", meta: { rssi: -50, ssid: "MyWiFi" }

        // Attempt to lookup vendor if data looks like MAC
        // Simple MAC regex
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        let vendor = null;

        if (macRegex.test(data)) {
            vendor = ProtocolDB.getVendor(data);
        } else if (meta?.mac) {
            vendor = ProtocolDB.getVendor(meta.mac); // If MAC is in meta
        }

        const processedPacket = {
            ...packet,
            analysis: {
                vendor: vendor,
                knownTarget: false // Placeholder for Target Profiling logic
            }
        };

        // Auto-save to Persistent DB
        // We do this async without awaiting to not block the flow
        db.upsertTarget(processedPacket).then(target => {
            if (target) {
                // Could emit 'target:update' here if we wanted real-time DB sync
            }
        }).catch(err => console.error('[ROUTER] DB Save Error:', err));

        this.emit('wireless:traffic', processedPacket);
    }

    handleAccessPacket(packet) {
        // NFC/RFID usually is just UID
        // We could add lookup for known UIDs here if we had a persistent DB
        this.emit('access:read', packet);
    }
}

module.exports = new PacketRouter();
