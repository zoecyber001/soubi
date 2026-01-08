const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('events');

class SerialHandler extends EventEmitter {
    constructor() {
        super();
        this.port = null;
        this.parser = null;
        this.isConnected = false;
    }

    /**
     * List available serial ports
     */
    async listPorts() {
        try {
            const ports = await SerialPort.list();
            return ports;
        } catch (err) {
            console.error('Error listing ports:', err);
            return [];
        }
    }

    /**
     * Connect to a specific serial port
     * @param {string} path - The COM port path (e.g., "COM3")
     * @param {number} baudRate - The baud rate (default: 115200)
     */
    connect(path, baudRate = 115200) {
        if (this.isConnected) {
            this.disconnect();
        }

        try {
            this.port = new SerialPort({ path, baudRate });
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

            this.port.on('open', () => {
                this.isConnected = true;
                this.emit('connected', { path, baudRate });
                console.log(`Serial Port connected: ${path}`);
            });

            this.port.on('error', (err) => {
                console.error('Serial Port error:', err.message);
                this.emit('error', err.message);
                this.disconnect();
            });

            this.port.on('close', () => {
                this.isConnected = false;
                this.emit('disconnected');
                console.log('Serial Port disconnected');
            });

            this.parser.on('data', (data) => {
                try {
                    const jsonData = JSON.parse(data);
                    // Emit 'data' for legacy/debug, but ideally we route it
                    this.emit('data', jsonData);
                } catch (e) {
                    console.log('Raw Serial Data:', data);
                }
            });

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Send data to the connected device
     * @param {object|string} data 
     */
    send(data) {
        if (!this.port || !this.isConnected) {
            return { success: false, error: 'Not connected' };
        }

        const payload = typeof data === 'object' ? JSON.stringify(data) : data;

        this.port.write(payload + '\n', (err) => {
            if (err) {
                return console.error('Error on write:', err.message);
            }
            console.log('Message sent:', payload);
        });

        return { success: true };
    }

    /**
     * Disconnect the current port
     */
    disconnect() {
        if (this.port && this.port.isOpen) {
            this.port.close();
        }
        this.port = null;
        this.parser = null;
        this.isConnected = false;
    }
}

module.exports = new SerialHandler();
