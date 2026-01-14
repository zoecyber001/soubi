/*
 * CryptoAdapter.cjs
 * 
 * Handles encrypted storage for the database. Uses AES-256-GCM because
 * it's the gold standard for authenticated encryption - fast and secure.
 * 
 * The password never sticks around in memory longer than it needs to.
 * Once we derive the key, we wipe it. Paranoid? Maybe. But this is
 * security tooling, and someone WILL try to dump your memory.
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

// crypto constants - don't touch these unless you know what you're doing
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// scrypt params - N=16384 is a good balance between security and speed
// higher N = more memory + CPU, but also more resistant to brute force
const SCRYPT_OPTIONS = { N: 2 ** 14, r: 8, p: 1 };

class CryptoAdapter {
    constructor(filePath, password) {
        this.filePath = filePath;
        this.saltPath = filePath + '.salt';
        this._tempPassword = password; // gets nuked after init()
        this.key = null;
    }

    // helper to derive key - extracted so we can reuse it for password changes
    async _deriveKey(password, salt) {
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey);
            });
        });
    }

    // call this before doing anything else
    // sets up the encryption key and wipes the password from memory
    async init() {
        let salt;

        if (await fs.pathExists(this.saltPath)) {
            salt = await fs.readFile(this.saltPath);
        } else {
            // first time setup - generate a fresh salt
            salt = crypto.randomBytes(SALT_LENGTH);
            await fs.writeFile(this.saltPath, salt);
        }

        // derive the key and immediately forget the password
        this.key = await this._deriveKey(this._tempPassword, salt);
        this._tempPassword = null; // bye bye

        return this;
    }

    // change the master password
    // this is a scary operation - we decrypt everything, generate new salt,
    // re-encrypt with the new key. if power goes out mid-way... well, backups exist right?
    async changePassword(oldPassword, newPassword) {
        try {
            const salt = await fs.readFile(this.saltPath);

            // verify the old password is correct
            const oldKey = await this._deriveKey(oldPassword, salt);
            if (!crypto.timingSafeEqual(oldKey, this.key)) {
                return { success: false, error: 'Wrong password mate' };
            }

            // grab all the data before we mess with anything
            const currentData = await this.read();
            if (currentData === null) {
                return { success: false, error: 'Nothing to re-encrypt' };
            }

            // new salt, new key, new everything
            const newSalt = crypto.randomBytes(SALT_LENGTH);
            const newKey = await this._deriveKey(newPassword, newSalt);

            this.key = newKey;
            await fs.writeFile(this.saltPath, newSalt);
            await this.write(currentData);

            console.log('[CryptoAdapter] Password changed successfully');
            return { success: true };
        } catch (err) {
            console.error('[CryptoAdapter] Password change failed:', err);
            return { success: false, error: err.message };
        }
    }

    // pack data: IV (16 bytes) + AuthTag (16 bytes) + ciphertext
    encrypt(plaintext) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        let encrypted = cipher.update(plaintext, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]);
    }

    // unpack and decrypt - throws if tampered or wrong key
    decrypt(packed) {
        const iv = packed.subarray(0, IV_LENGTH);
        const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }

    // lowdb adapter interface
    async read() {
        if (!(await fs.pathExists(this.filePath))) {
            return null;
        }

        const packed = await fs.readFile(this.filePath);
        if (packed.length === 0) {
            return null;
        }

        try {
            const jsonString = this.decrypt(packed);
            return JSON.parse(jsonString);
        } catch (err) {
            console.error('[CryptoAdapter] Decryption failed - wrong password or corrupted file');
            throw new Error('DECRYPTION_FAILED');
        }
    }

    async write(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const packed = this.encrypt(jsonString);
        await fs.writeFile(this.filePath, packed);
    }
}

module.exports = CryptoAdapter;
