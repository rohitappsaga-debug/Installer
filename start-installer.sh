#!/bin/bash

# ============================================
# RMS Installer Bootstrap Launcher
# ============================================

set -e

echo "============================================"
echo "RMS Installer Bootstrap Launcher"
echo "============================================"

# STEP 1 - Check Administrator / Root Permissions
echo "[1/6] Checking system permissions..."
if [[ $EUID -ne 0 ]]; then
   echo "[!] Root privileges required. Requesting sudo access..."
   exec sudo "$0" "$@"
fi
echo "[OK] Running with root privileges."

# STEP 2 - Detect the Operating System
echo "[2/6] Detecting operating system..."
OS_NAME=$(uname -s)
if [ "$OS_NAME" == "Darwin" ]; then
    OS="macOS"
elif [ "$OS_NAME" == "Linux" ]; then
    OS="Linux"
else
    echo "[ERROR] Unsupported operating system: $OS_NAME"
    exit 1
fi
echo "[OK] Operating System: $OS"

# STEP 3 - Check Node.js Installation
echo "[3/6] Checking Node.js installation..."
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "[OK] Node.js is already installed ($NODE_VER)."
else
    echo "[!] Node.js not found. Installing..."
    
    # STEP 4 - Install Node.js Automatically if Missing
    if [ "$OS" == "macOS" ]; then
        echo "Detected macOS. Checking for Homebrew..."
        if ! command -v brew >/dev/null 2>&1; then
            echo "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            # Add brew to path for the current session
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
        echo "Installing Node.js via Homebrew..."
        brew install node
    elif [ "$OS" == "Linux" ]; then
        echo "Detected Linux. Installing Node.js via apt..."
        # Update package list and install
        apt-get update
        apt-get install -y nodejs npm
    fi
fi

# STEP 5 - Install Project Dependencies
echo "[4/6] Installing project dependencies..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/installer"

if [ ! -f "package.json" ]; then
    echo "[ERROR] Could not find 'installer/package.json'."
    exit 1
fi

npm install
echo "[OK] Dependencies installed."

# STEP 6 - Start the Installer
echo "[5/6] Starting installer..."
npm run installer

echo "[6/6] Done."
