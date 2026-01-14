# SOUBI (装備) // TACTICAL ASSET MANAGEMENT

![Version](https://img.shields.io/badge/VERSION-0.2.0-cyan?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-success?style=for-the-badge)
![Security](https://img.shields.io/badge/SECURITY-MAXIMUM-red?style=for-the-badge)
![License](https://img.shields.io/badge/LICENSE-GPL%20v3-purple?style=for-the-badge)

> **"If you aren't tracking your gear, you aren't ready for the mission."**

SOUBI is a professional-grade, standalone **Tactical Asset Management System** designed for security researchers, hardware hackers, and field operatives. It provides a secure, local-first environment to track hardware status, deployment history, and technical documentation with a zero-trust architecture.

**v0.2.0 UPDATE: "Field Commander"**
Now equipped with the **Smart Layer**—transforming SOUBI from a logger into an active field tool:
- **Radio (Sub-GHz)**: Protocol fingerprinting and visualization.
- **Hijacker (2.4GHz)**: WiFi/Bluetooth target profiling, persistent history, and Natural Language Payload Generation.
- **Access**: Unified NFC/RFID cloning interface.

## 📥 [DOWNLOAD LATEST RELEASE](https://github.com/zoecyber001/soubi/releases/latest)

**Two versions available:**

- **SOUBI Setup 0.2.0.exe** - Standard installer with desktop shortcut
- **SOUBI 0.2.0.exe** - Portable version. No installation required, run from USB.

---

## FIRST LAUNCH

New operators are greeted with an onboarding sequence that covers:

- **The Armory** - Your digital gear locker
- **Mission Mode** - Pack, deploy, debrief workflow
- **The Locker** - Per-asset documentation storage
- **Zero Cloud Policy** - Local-only data philosophy

The sequence ends with a dramatic boot animation. Replay anytime via **Settings → Replay Onboarding Tour**.

---

## THE INTERFACE

### The Command Center (HUD)

The landing page for every session, providing immediate situational awareness.

- **Operational Readiness**: A high-impact circular gauge visualizing the health of your entire fleet.
- **Live Intel Feed**: A global "Flight Recorder" pulling recent logs from every asset.
- **Snapshot Metrics**: Instant visibility into `Operational`, `Compromised`, and `In Field` counts.

### The Armory (Inventory)

- **Tactical Grid**: Drag-and-drop cards with custom "Cyber-Cut" corners.
- **The Inspector**: Slide-over panel revealing the full lifecycle of an asset.
- **The Locker**: Asset-specific storage for firmware, manuals, and scripts.

### Mission Control (Loadouts)

- **Tactical Kits**: Bundle assets into mission-specific loadouts (e.g., "WiFi Audit", "Physical Breach").
- **Deployment Status**: One-click "[EQUIP]" moves items to `DEPLOYED` status.
- **Debrief Protocol**: Flag specific items as `COMPROMISED` during return, ensuring contaminated gear is isolated.

### Spectrum (Radio Intelligence)

*Hardware Required: CC1101 Module*

- **Signal Waterfall**: Real-time visualization of Sub-GHz traffic (433MHz, 868MHz, etc.).
- **Protocol Fingerprinting**: Automatic identification of known signals (car fobs, weather stations) via `ProtocolDB`.
- **Live Logging**: Capture and analyze raw packets in real-time.

### Hijacker (Wireless & Payloads)

*Hardware Required: NRF24 / ESP32 Module*

- **Target Profiling**: Detailed profiling of 2.4GHz targets (WiFi, Bluetooth).
- **Vendor Lookup**: Real-time MAC address analysis to identify hardware manufacturers.
- **Payload Generator**: AI-lite engine converting natural language (e.g., "open cmd and ping google") into keystroke injection payloads.

### Access (Physical Security)

*Hardware Required: PN532 / RDM6300 Module*

- **Unified Cloning**: Single interface for reading and writing NFC and RFID credentials.
- **Dump Storage**: Organize dumped badge data for later analysis or cloning.

### The Vault (Intel Storage)

- **Secure Database**: Offline encrypted storage for all captured "Intel" (signals, handshakes, dumps).
- **Replay & Emulate**: Load captured signals back onto the Ghost Node for replay attacks.
- **Zero-Trust**: Data stays local; nothing leaves the machine.

---

## UNDER THE HOOD

For advanced operators and contributors, here is how SOUBI functions internally:

### 1. The Hardware Bridge (`electron/SerialHandler.cjs`)
SOUBI communicates with the "Ghost Node" (ESP32/CC1101/NRF24) via a custom serial protocol.
- **Packet Router**: Inbound data is analyzed by the `PacketRouter`, which fingerprints signals and dispatches them to the React frontend.
- **Protocol DB**: A static database of known OUI vendors (for WiFi) and Sub-GHz signatures (Came, Nice, etc.) allows for instant signal identification.

### 2. Data Persistence (`electron/db.cjs`)
Data is stored locally in `soubi_db.json` using **LowDB**.
- **Schemas**: Strict definitions for `Assets`, `Loadouts`, `Intel`, and `Targets`.
- **Flight Recorder**: Every action (deploy, compromise, return) generates an immutable log entry in the asset's history.

### 3. Payload Engine (`electron/PayloadGen.cjs`)
Included is an "AI-lite" regex-based engine that converts natural language commands (e.g., *"open powershell and echo hello"*) into standard **DuckyScript** for immediate injection via the Hijacker module.

---



## MISSION WORKFLOW

1. **ACQUIRE**: Use `[NEW ASSET]` or `Ctrl+N` to add gear. Attach photos via the secure file-handler.
2. **PREPARE**: Group assets into **Loadouts** (e.g., "WiFi Audit", "Physical Breach").
3. **DEPLOY**: Use Mission Mode (`Ctrl+M`) to drag assets into a kit and `[EQUIP]`.
4. **DEBRIEF**: Upon return, use the Return to Base flow to mark items as **COMPROMISED** if they captured sensitive data or were exposed.

---

## DATA PORT & OPSEC

- **Zero-Cloud**: SOUBI never connects to the internet. Your data stays on your local machine.
- **The Data Port**: Found in Settings. Export your entire armory to a `.json` backup or import a team-shared asset list.
- **Hardware Isolation**: Images and files are hashed and stored in a dedicated secure directory within AppData.
- **Nuclear Option**: Use **Factory Reset** to securely wipe the local database and image cache instantly.

---

## TECHNICAL SPECIFICATIONS

SOUBI is built on a modern, high-performance stack designed for security and maintainability.

| Component    | Technology                | Description                                                      |
| ------------ | ------------------------- | ---------------------------------------------------------------- |
| **Core**     | Electron 28               | Chromium-based runtime with strict sandbox enforcement.          |
| **Frontend** | React 19 + Vite           | High-performance UI rendering with instant state updates.        |
| **Styling**  | Tailwind CSS              | Utility-first styling with custom "Cyberpunk" design tokens.     |
| **Storage**  | LowDB (JSON)              | Local-first, flat-file database schema. No external DB required. |
| **Security** | Context Isolation         | Renderer process is fully isolated from Node.js integration.     |
| **Protocol** | Custom (`soubi-asset://`) | Secure local resource loading preventing path traversal.         |

---

## BUILDING FROM SOURCE

For developers and auditors who wish to verify the build integrity.

```bash
# 1. Clone Repository
git clone https://github.com/zoecyber001/soubi.git

# 2. Install Dependencies
pnpm install

# 3. Development Mode
pnpm dev
pnpm electron:dev

# 4. Production Build
pnpm build:win
```

> **Browser Mode Note:** Running `pnpm dev` alone opens SOUBI in a browser for UI development. In this mode, the backend (Electron) is not connected, so loadouts and assets will not persist. For full functionality, run both `pnpm dev` and `pnpm electron:dev` concurrently.

---

## CONTRIBUTING

SOUBI is open-source and welcomes contributions from the community.

### How to Contribute

1. **Feature Requests & Ideas** - [Open an Issue](https://github.com/zoecyber001/soubi/issues/new?template=feature_request.md) with the `enhancement` label.
2. **Bug Reports** - [Open an Issue](https://github.com/zoecyber001/soubi/issues/new?template=bug_report.md) with the `bug` label.
3. **Code Contributions** - Fork the repo, create a branch, and submit a Pull Request.

### Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and future development phases.

### License

This project is dual-licensed under **GPL v3** (open source) and **Proprietary** (commercial). See [LICENSE](./LICENSE) for details. For commercial inquiries, contact the author.

---

_UNIT 734 // SECTOR 9 // SYSTEM READY_
