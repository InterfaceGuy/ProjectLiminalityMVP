const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('create-dreamnode', (event, { name, clone, repoUrl }) => {
    const dreamnodePath = path.join(VAULT_PATH, name);

    if (fs.existsSync(dreamnodePath)) {
        event.reply('dreamnode-created', false);
        return;
    }

    fs.mkdirSync(dreamnodePath);

    if (clone) {
        exec(`git clone ${repoUrl} "${dreamnodePath}"`, (error) => {
            if (error) {
                console.error(`Error cloning repository: ${error}`);
                event.reply('dreamnode-created', false);
            } else {
                event.reply('dreamnode-created', true);
            }
        });
    } else {
        exec(`git init "${dreamnodePath}"`, (error) => {
            if (error) {
                console.error(`Error initializing repository: ${error}`);
                event.reply('dreamnode-created', false);
            } else {
                event.reply('dreamnode-created', true);
            }
        });
    }
});

ipcMain.on('open-in-finder', (event, repoName) => {
    const repoPath = path.join(VAULT_PATH, repoName);
    shell.openPath(repoPath);
});