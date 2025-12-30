# SOUBI (装備) // TACTICAL ASSET MANAGEMENT

![Version](https://img.shields.io/badge/VERSION-0.1.0-cyan?style=for-the-badge)
![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-success?style=for-the-badge)
![Security](https://img.shields.io/badge/SECURITY-MAXIMUM-red?style=for-the-badge)

> **"Equip yourself for the future."**

SOUBI is a high-fidelity, standalone **Tactical Asset Management System** designed for tracking hardware, software, and physical assets in a secure, local environment. Built with **Electron, React, and Vite**, it combines professional-grade inventory control with a strictly "Cyberpunk" aesthetic.

---

## COMMAND CENTER

The system launches directly into a **HUD** (Heads-Up Display) dashboard providing immediate situational awareness:

- **Readiness Gauge**: Real-time visualization of fleet health (% Pristine).
- **Flight Recorder**: Live scrolling log of all asset activity (deployments, returns, modifications).
- **Operational Stats**: Instant counters for `Active`, `Compromised`, and `Deployed` units.

---

## CORE FEATURES

### 1. The Armory

- **Visual Inventory**: Drag-and-drop tactical cards for every asset.
- **Smart Filtering**: Sort by `Pristine`, `Compromised`, or `Deployed` status.
- **Asset Inspection**: Attach files, images, and notes to any item.
- **The Locker**: A secure file container for each asset (manuals, receipts, binaries).

### 2. Loadout System

- **Mission Planning**: Create named "Loadouts" (e.g., "Red Team Kit", "Field Ops A").
- **Drag & Drop**: Drag assets from the Armory directly into Loadouts.
- **Deploy & Return**:
  - **Deploy**: Marks items as `IN FIELD`. Checks for conflicting assignments.
  - **Return**: Debrief process to mark items as `Compromised` (if used) or `Clean`.

### 3. Data Port

- **Local Database**: All data stored locally in a rigorous JSON schema.
- **Import/Export**: Full backup and migration capabilities via `.json` snapshots.
- **Factory Reset**: "Nuclear Option" to wipe the database and start fresh.

---

## INSTALLATION

### Prerequisites

- Windows 10/11
- Node.js (for development)

### Development

```bash
# Install Dependencies
pnpm install

# Run in Development Mode (with Hot Reload)
pnpm dev
# In a second terminal:
pnpm electron:dev
```

### Production Build

To generate the standalone **SOUBI Setup.exe**:

```bash
# Build & Package
pnpm build:win
```

_Build artifacts will be located in the `release/` directory._

---

## AESTHETICS & UX

- **Theme**: `Dark Void` background with `Cyan Neon` accents and `Red Glitch` warnings.
- **Window Management**: Custom frameless window with native resize/snap support.
- **Smart Sizing**: Auto-scales to 85% of screen real-estate on launch.

---

## SECURITY PROTOCOLS

- **Local Only**: No cloud connections. Your data stays on your machine.
- **Sandboxed**: Renderer process is isolated with `contextBridge`.
- **Content Security**: Custom `soubi-asset://` protocol for secure image loading.

---
