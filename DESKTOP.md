# 🖥️ Claude Counter for Claude Desktop

Since the official Claude Desktop application is built on Electron, it runs a Chromium web view loaded with `https://claude.ai`. This means we can patch the application's packaged assets (`app.asar`) to inject the Claude Counter userscript directly into the desktop app context.

This guide provides both an automated patch script and manual instructions to enable Claude Counter inside the Claude Desktop application.

---

## 🛠️ Method 1: Automatic Patching (Recommended)

We have provided simple, automated helper scripts to easily patch your Claude Desktop application without needing to install packages manually.

### Step 1: Download and Extract
1. [Download the project ZIP](https://github.com/jaggureddy11/CLAUDE-TOKEN-COUNTER/archive/refs/heads/main.zip) and extract it to a folder on your computer.

### Step 2: Run the Patch Script
*   ** macOS:** Open terminal in the extracted directory and run:
    ```bash
    ./patch-mac.sh
    ```
    *(The script will automatically check for Node.js, install necessary builders, patch the application, and re-sign the app bundle).*
*   **🪟 Windows:** Double-click the `patch-windows.bat` file in the extracted directory.
    *(This opens a command prompt to verify Node.js, install dependencies, and patch your desktop files automatically).*

### Step 3: Restart Claude Desktop
Once the patch completes successfully, close and restart your Claude Desktop application. The token counts, cache timer, and usage progress bars will now render directly inside your desktop window.

---

## ✍️ Method 2: Manual Patching

If you prefer to perform the injection manually, follow these steps:

### Step 1: Locate the Application Resources
Find the folder where Claude Desktop stores its packaged code (`app.asar`):
- **macOS:** `/Applications/Claude.app/Contents/Resources/`
- **Windows:** `%LocalAppData%\Programs\claude-desktop\resources\`

### Step 2: Extract the Package
Use the Electron `asar` tool to extract the archive to a temporary directory:

```bash
npx @electron/asar extract /path/to/resources/app.asar ./tmp_extract
```

### Step 3: Copy the Userscript
Copy the userscript file from this repository into the extracted folder structure:

```bash
cp userscript/claude-counter.user.js ./tmp_extract/.vite/build/claude-counter.user.js
```

### Step 4: Inject the Loader Hook
Open `./tmp_extract/.vite/build/index.pre.js` in a text editor. Scroll to the very end of the file and append the following JavaScript code to load our script:

```javascript
// CLAUDE COUNTER PATCH START
try {
    const fs = require('fs');
    const path = require('path');
    const electron = require('electron');
    const scriptPath = path.join(__dirname, 'claude-counter.user.js');
    if (fs.existsSync(scriptPath)) {
        const code = fs.readFileSync(scriptPath, 'utf8');
        electron.app.on('web-contents-created', (event, webContents) => {
            webContents.on('did-finish-load', () => {
                const url = webContents.getURL();
                if (url.includes('claude.ai') || url.includes('claude.com')) {
                    webContents.executeJavaScript(code)
                        .then(() => console.log('[Claude Counter] Injected successfully.'))
                        .catch(err => console.error('[Claude Counter] Injection error:', err));
                }
            });
        });
    }
} catch (e) {
    console.error('[Claude Counter] Injection setup failed:', e);
}
// CLAUDE COUNTER PATCH END
```

### Step 5: Repack the Archive
Recompile the files back into the original `app.asar` file:

```bash
npx @electron/asar create ./tmp_extract /path/to/resources/app.asar
```

---

## 🔄 How to Restore / Uninstall

If Claude Desktop fails to launch or you want to remove the patch:

1. Close Claude Desktop.
2. Delete the modified `app.asar` file from the resources folder.
3. Rename the backup file `app.asar.bak` back to `app.asar`.
4. Relaunch the application.
