const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

// Define platforms
const PLATFORMS = {
    darwin: '/Applications/Claude.app/Contents/Resources/app.asar',
    win32: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'claude-desktop', 'resources', 'app.asar')
};

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

    if (!fs.existsSync(userscriptSource)) {
        console.error(`[-] Userscript not found at: ${userscriptSource}`);
        process.exit(1);
    }

    console.log(`[+] Copying userscript to build folder...`);
    fs.mkdirSync(path.dirname(userscriptDest), { recursive: true });
    fs.copyFileSync(userscriptSource, userscriptDest);

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
`;

    if (content.includes('CLAUDE COUNTER PATCH START')) {
        console.log(`[!] Entry point is already patched. Overwriting existing patch...`);
        content = content.replace(/\/\/ CLAUDE COUNTER PATCH START[\s\S]*?\/\/ CLAUDE COUNTER PATCH END/, '');
    }

    fs.writeFileSync(entryPoint, content + injectionCode, 'utf8');

    console.log(`[+] Repacking app.asar...`);
    await asar.createPackage(tmpExtractDir, asarPath);

    console.log(`[+] Cleaning up temporary files...`);
    fs.rmSync(tmpExtractDir, { recursive: true, force: true });

    console.log(`[+] Success! Claude Counter is now injected into your Claude Desktop application.`);
    console.log(`[+] Please restart Claude Desktop to see the changes.`);
}

patch().catch(err => {
    console.error(`[-] Unhandled error during patch:`, err);
    process.exit(1);
});
