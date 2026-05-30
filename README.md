<p align="center">
  <img src="./icons/title-v3.svg" alt="  CLAUDE TOKEN COUNTER" width="600">
</p>

<h1 align="center">Claude Token Counter &amp; Desktop Tracker</h1>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/jaggureddy11/CLAUDE-TOKEN-COUNTER-OG?style=for-the-badge&color=2c84db&label=Version" alt="Release Version">
  <img src="https://img.shields.io/github/license/jaggureddy11/CLAUDE-TOKEN-COUNTER-OG?style=for-the-badge&color=5aa6ff&label=License" alt="License">
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Desktop-orange?style=for-the-badge" alt="Platform compatibility">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-success?style=for-the-badge" alt="Privacy policy">
</p>

---

<p align="center">
  <b>A sleek, lightweight, and modern browser extension/userscript to show real-time Claude token count, cache countdowns, and exact rolling usage analytics directly in your Claude.ai interface (Chrome, Brave, and Claude Desktop app).</b>
</p>

<p align="center">
  <img src="./screenshot.png" alt="Claude Counter Screenshot" width="800" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);">
</p>

---

## ✨ Key Features

### 🪙 Real-Time Token Counter
* **Precise Offline Approximations:** Uses a local `o200k_base` tiktoken tokenizer (the native tokenizer for Claude 3 & 3.5 models) to estimate prompt size instantly.
* **Visual Context Gauge:** A mini progress bar displays your active usage against Claude's **200,000-token** context window.
* **Compaction Indicators:** Automatically adapts styling when Claude performs background context window compaction.

### ⏱️ Prompt Cache Countdown
* **Save up to 90%:** Anthropic caches active prompt contexts for up to **5 minutes**.
* **Live Expiration Timer:** Displays a live countdown timer showing when your cache expires. Send your next message before it hits `0:00` to continue from the cached state.

### 📊 Exact Rolling Usage Analytics
* **SSE Interception:** Hooks directly into Claude's native Server-Sent Events (SSE) `message_limit` stream to extract precise, raw usage fractions.
* **Session & Weekly Trackers:** Beautiful progress bars visualize your 5-hour rolling session window and 7-day weekly usage.
* **Reset Timers:** Live countdowns show exactly when your usage quotas will renew.

<p align="center">
  <img src="./screenshot-limit.jpg" alt="Claude Counter Limit Screenshot" width="800" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);">
</p>

---

## 🛠️ How It Works

Claude Counter runs **100% locally and privately**. It intercepts data streams and calculates metrics directly in your client session without any external network overhead.

```mermaid
graph TD
    %% Colors and Styling
    classDef browser fill:#1e1e24,stroke:#3b82f6,stroke-width:2px,color:#f3f4f6;
    classDef process fill:#27272a,stroke:#60a5fa,stroke-width:1px,color:#f3f4f6;
    classDef inject fill:#1c1d21,stroke:#10b981,stroke-width:2px,color:#f3f4f6;
    
    User([User interacts with Claude]) -->|Sends Message| API[Claude API]
    
    subgraph Browser_Environment ["Local Sandboxed Environment"]
        Page[Claude Interface]:::browser
        Bridge[injected/bridge.js]:::process
        Content[content/main.js]:::process
        Tokenizer[vendor/o200k_base.js]:::process
        UI[Counter UI]:::inject
    end
    
    Bridge -.->|Hooks window.fetch & SSE| Page
    Bridge -->|Dispatches Events| Content
    Content -->|Computes Tokens| Tokenizer
    Content -->|Updates State| UI
    UI -.->|Injects Elements| Page
```

---

## 📦 Simple Installation Guide

Choose your preferred way to run Claude Counter:

### 🌐 1. Google Chrome (Brave, Edge, Opera)
1. [Download the project ZIP](https://github.com/jaggureddy11/CLAUDE-TOKEN-COUNTER-OG/archive/refs/heads/main.zip) and extract it to a folder on your computer.
2. Open your browser and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** (top-left corner) and select the project folder.

---

### 🖥️ 4. Claude Desktop Application (Claude Counter Desktop)

To track your **Claude token count on the Claude Desktop app**, you can patch the application packaged assets to inject the counter locally. Check out the detailed [Claude Counter Desktop Setup Guide](DESKTOP.md) for full manual instructions.

You can run the token counter inside the official **Claude Desktop** client using our automated scripts:

1. **Download & Extract:** [Download the project ZIP](https://github.com/jaggureddy11/CLAUDE-TOKEN-COUNTER-OG/archive/refs/heads/main.zip) and unzip it on your computer.
2. **Run Patcher:** *(Requires [Node.js](https://nodejs.org/) installed)*
   * **macOS:** Double-click `patch-mac.command`.
     > [!IMPORTANT]
     > **macOS Security Block:** If macOS blocks double-click execution (warning you that Apple cannot verify the developer), you can bypass it with either of these simple options:
     > - **Terminal Method (Recommended):** Open Terminal, navigate to this project directory, and run:
     >   ```bash
     >   node scripts/patch-desktop.js
     >   ```
     > - **Unblock Double-Click:** Run this in Terminal in the project directory to clear the macOS quarantine attribute:
     >   ```bash
     >   xattr -d com.apple.quarantine patch-mac.command
     >   ```
   * **Windows:** Double-click `patch-windows.bat`.
3. **Restart:** Completely close and relaunch **Claude Desktop**.

> [!TIP]
> **To Restore / Uninstall:** Delete the modified `app.asar` inside the application resources folder and rename the automatically created `app.asar.bak` backup file back to `app.asar`.

---

## 🔒 Privacy Guarantee

* **Zero External Traffic:** Token calculation, cookie lookups, and event interception are processed entirely locally. No external APIs, analytic endpoints, or trackers are contacted.
* **Standard Credentials:** Claude Counter uses the standard `lastActiveOrg` cookie to make authenticated calls directly to Claude's native `/usage` endpoint.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
