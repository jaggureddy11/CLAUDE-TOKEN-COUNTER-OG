const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

// Automatically install dependencies if they are missing
function ensureDependencies() {
    try {
        require.resolve('@electron/asar');
    } catch (e) {
        console.log(`[+] Missing dependencies (@electron/asar). Installing automatically...`);
        try {
            cp.execSync('npm install --no-audit --no-fund', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
            console.log(`[+] Dependencies installed successfully.\n`);
        } catch (installErr) {
            console.error(`[-] Failed to install dependencies automatically:`, installErr.message);
            console.log(`[!] Please try running "npm install" manually in the project root.`);
            process.exit(1);
        }
    }
}

// Run dependency check
ensureDependencies();

const asar = require('@electron/asar');

// Define platforms
const PLATFORMS = {
    darwin: '/Applications/Claude.app/Contents/Resources/app.asar',
    win32: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude-desktop', 'resources', 'app.asar')
};

// Check if Claude Desktop is running and warn the user
function checkRunningProcesses() {
    const platform = process.platform;
    try {
        if (platform === 'darwin') {
            const stdout = cp.execSync('pgrep -x "Claude" || pgrep -f "Claude.app"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            if (stdout.trim()) {
                console.log(`[!] WARNING: Claude Desktop is currently running.`);
                console.log(`[!] Please close Claude Desktop to ensure changes apply correctly and avoid file locks.\n`);
            }
        } else if (platform === 'win32') {
            const stdout = cp.execSync('tasklist /FI "IMAGENAME eq Claude.exe"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            if (stdout.toLowerCase().includes('claude.exe')) {
                console.log(`[!] WARNING: Claude Desktop is currently running.`);
                console.log(`[!] Please close Claude Desktop to ensure changes apply correctly and avoid file locks.\n`);
            }
        }
    } catch (e) {
        // Ignored: pgrep exits with 1 if process not found (which is clean/ideal)
    }
}

// Verify write permissions to Claude resources
function verifyWriteAccess(asarPath) {
    try {
        fs.accessSync(asarPath, fs.constants.W_OK);
        fs.accessSync(path.dirname(asarPath), fs.constants.W_OK);
    } catch (err) {
        console.error(`[-] Error: Permission denied. Cannot write to Claude Desktop files.`);
        if (process.platform === 'darwin') {
            console.log(`[!] On macOS, you likely need administrator privileges to patch applications.`);
            console.log(`[!] Please run the patch script using sudo:`);
            console.log(`    sudo node scripts/patch-desktop.js`);
        } else {
            console.log(`[!] Please run this command prompt / terminal as an Administrator.`);
        }
        process.exit(1);
    }
}

async function patch() {
    const platform = process.platform;
    const asarPath = PLATFORMS[platform];

    if (!asarPath) {
        console.error(`[-] Unsupported platform: ${platform}`);
        process.exit(1);
    }

    if (!fs.existsSync(asarPath)) {
        console.error(`[-] Claude Desktop app.asar not found at: ${asarPath}`);
        console.log(`[!] Please ensure Claude Desktop is installed.`);
        process.exit(1);
    }

    // Run safety and permission checks
    checkRunningProcesses();
    verifyWriteAccess(asarPath);

    console.log(`[+] Found Claude Desktop app.asar at: ${asarPath}`);

    const backupPath = `${asarPath}.bak`;
    if (!fs.existsSync(backupPath)) {
        console.log(`[+] Creating backup of original app.asar to: ${backupPath}`);
        fs.copyFileSync(asarPath, backupPath);
    } else {
        console.log(`[+] Backup already exists at: ${backupPath}`);
    }

    const tmpExtractDir = path.join(__dirname, '..', 'tmp_patch_extract');
    if (fs.existsSync(tmpExtractDir)) {
        fs.rmSync(tmpExtractDir, { recursive: true, force: true });
    }

    console.log(`[+] Extracting app.asar...`);
    asar.extractAll(asarPath, tmpExtractDir);

    const userscriptSource = path.join(__dirname, '..', 'userscript', 'claude-counter.user.js');
    const userscriptDest = path.join(tmpExtractDir, '.vite', 'build', 'claude-counter.user.js');
    const tokenizerSource = path.join(__dirname, '..', 'src', 'vendor', 'o200k_base.js');
    const tokenizerDest = path.join(tmpExtractDir, '.vite', 'build', 'o200k_base.js');

    if (!fs.existsSync(userscriptSource)) {
        console.error(`[-] Userscript not found at: ${userscriptSource}`);
        process.exit(1);
    }
    if (!fs.existsSync(tokenizerSource)) {
        console.error(`[-] Tokenizer vendor file not found at: ${tokenizerSource}`);
        process.exit(1);
    }

    console.log(`[+] Copying userscript and tokenizer to build folder...`);
    fs.mkdirSync(path.dirname(userscriptDest), { recursive: true });
    fs.copyFileSync(userscriptSource, userscriptDest);
    fs.copyFileSync(tokenizerSource, tokenizerDest);

    const entryPoint = path.join(tmpExtractDir, '.vite', 'build', 'index.pre.js');
    if (!fs.existsSync(entryPoint)) {
        console.error(`[-] Main process entry point not found: ${entryPoint}`);
        process.exit(1);
    }

    console.log(`[+] Injecting injection logic into entry point...`);
    let content = fs.readFileSync(entryPoint, 'utf8');

    const injectionCode = `
// CLAUDE COUNTER PATCH START
try {
    const fs = require('fs');
    const path = require('path');
    const electron = require('electron');
    const tokenizerPath = path.join(__dirname, 'o200k_base.js');
    const scriptPath = path.join(__dirname, 'claude-counter.user.js');
    if (fs.existsSync(tokenizerPath) && fs.existsSync(scriptPath)) {
        const tokenizerCode = fs.readFileSync(tokenizerPath, 'utf8');
        const scriptCode = fs.readFileSync(scriptPath, 'utf8');
        const code = tokenizerCode + '\\n' + scriptCode;
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
`;

    if (content.includes('CLAUDE COUNTER PATCH START')) {
        console.log(`[!] Entry point is already patched. Overwriting existing patch...`);
        content = content.replace(/\/\/ CLAUDE COUNTER PATCH START[\s\S]*?\/\/ CLAUDE COUNTER PATCH END/, '');
    }

    fs.writeFileSync(entryPoint, content + injectionCode, 'utf8');

    console.log(`[+] Repacking app.asar...`);
    await asar.createPackage(tmpExtractDir, asarPath);

    // Calculate SHA256 of the new app.asar and update Info.plist on macOS
    const plistPath = path.join(path.dirname(asarPath), '..', 'Info.plist');
    if (fs.existsSync(plistPath)) {
        console.log(`[+] Found Info.plist at: ${plistPath}. Updating ASAR integrity hash...`);
        const rawHeader = asar.getRawHeader(asarPath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(rawHeader.headerString);
        const newHash = hashSum.digest('hex');
        console.log(`[+] New SHA256: ${newHash}`);

        let plistContent = fs.readFileSync(plistPath, 'utf8');
        const regex = /(<key>Resources\/app\.asar<\/key>\s*<dict>\s*<key>algorithm<\/key>\s*<string>SHA256<\/string>\s*<key>hash<\/key>\s*<string>)([a-fA-F0-9]{64})(<\/string>)/;
        if (regex.test(plistContent)) {
            plistContent = plistContent.replace(regex, `$1${newHash}$3`);
            fs.writeFileSync(plistPath, plistContent, 'utf8');
            console.log(`[+] Successfully updated Info.plist with new hash.`);
        } else {
            console.warn(`[!] Could not find the ASAR integrity hash block in Info.plist to update.`);
        }

        // Auto-run codesign on macOS
        try {
            console.log(`[+] Re-signing Claude.app bundle (this might take a few seconds)...`);
            const appPath = '/Applications/Claude.app';
            if (fs.existsSync(appPath)) {
                cp.execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
                console.log(`[+] Successfully signed Claude.app.`);
            } else {
                console.warn(`[!] Claude.app not found at ${appPath}, skipping automatic signing.`);
            }
        } catch (signErr) {
            console.error(`[-] Failed to automatically sign Claude.app:`, signErr.message);
            console.log(`[!] You may need to run the codesign command manually:`);
            console.log(`    codesign --force --deep --sign - /Applications/Claude.app`);
        }
    }

    console.log(`[+] Cleaning up temporary files...`);
    fs.rmSync(tmpExtractDir, { recursive: true, force: true });

    console.log(`[+] Success! Claude Counter is now injected into your Claude Desktop application.`);
    console.log(`[+] Please restart Claude Desktop to see the changes.`);
}

patch().catch(err => {
    console.error(`[-] Unhandled error during patch:`, err);
    process.exit(1);
});
