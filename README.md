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
