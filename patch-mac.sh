#!/bin/bash

# Clear screen for readability
clear

echo "==================================================="
echo "  Claude Counter Desktop Patcher for macOS"
echo "==================================================="
echo

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "[-] Error: Node.js is not installed on this system."
    echo "Please download and install Node.js from: https://nodejs.org/"
    echo "After installing Node.js, run this script again."
    exit 1
fi

ASAR_PATH="/Applications/Claude.app/Contents/Resources/app.asar"

# Check if app.asar is writeable. If not, run with sudo.
if [ -f "$ASAR_PATH" ] && [ ! -w "$ASAR_PATH" ]; then
    echo "[!] Claude.app is write-protected. Requesting admin privileges..."
    sudo "$(which node)" "$(dirname "$0")/scripts/patch-desktop.js"
else
    node "$(dirname "$0")/scripts/patch-desktop.js"
fi

echo
echo "==================================================="
