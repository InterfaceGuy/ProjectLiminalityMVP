const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';
const GITFOX_PATH = '/Applications/GitFox.app';
const KEYNOTE_PATH = '/Applications/Keynote.app';

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

ipcMain.on('create-dreamnode', (event, { name, clone, repoUrl, type }) => {
    const dreamnodePath = path.join(VAULT_PATH, name);

    if (fs.existsSync(dreamnodePath)) {
        event.reply('dreamnode-created', false);
        return;
    }

    fs.mkdirSync(dreamnodePath);

    // Create .pl file
    const plContent = `type: ${type || 'idea'}`;
    fs.writeFileSync(path.join(dreamnodePath, '.pl'), plContent);

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

ipcMain.on('open-in-gitfox', (event, repoName) => {
    const repoPath = path.join(VAULT_PATH, repoName);
    console.log(`Attempting to open GitFox for: ${repoPath}`);
    exec(`open -a "${GITFOX_PATH}" "${repoPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error opening GitFox: ${error}`);
            event.reply('gitfox-opened', { success: false, error: error.message });
        } else if (stderr) {
            console.error(`GitFox stderr: ${stderr}`);
            event.reply('gitfox-opened', { success: false, error: stderr });
        } else {
            console.log(`Successfully opened GitFox for ${repoName}`);
            event.reply('gitfox-opened', { success: true });
        }
    });
});


ipcMain.on('open-in-keynote', (event, repoName) => {
    const repoPath = path.join(VAULT_PATH, repoName);
    const keynoteFiles = fs.readdirSync(repoPath).filter(file => file.endsWith('.key'));
    
    let keynoteFile;
    if (keynoteFiles.length > 0) {
        // Prefer the file with the same name as the repository
        keynoteFile = keynoteFiles.find(file => file === `${repoName}.key`) || keynoteFiles[0];
    }

    if (keynoteFile) {
        const keynoteFilePath = path.join(repoPath, keynoteFile);
        exec(`open -a "${KEYNOTE_PATH}" "${keynoteFilePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error opening Keynote: ${error}`);
                event.reply('keynote-opened', { success: false, error: error.message });
            } else if (stderr) {
                console.error(`Keynote stderr: ${stderr}`);
                event.reply('keynote-opened', { success: false, error: stderr });
            } else {
                console.log(`Successfully opened Keynote for ${repoName}`);
                event.reply('keynote-opened', { success: true });
            }
        });
    } else {
        console.error(`No Keynote file found in: ${repoPath}`);
        event.reply('keynote-opened', { success: false, error: 'No Keynote file found' });
    }
});
