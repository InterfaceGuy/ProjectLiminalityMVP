const { ipcRenderer, clipboard } = require('electron');
const fs = require('fs-extra');
const path = require('path');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';

let allDreamnodes = [];
let currentSearchTerm = '';

function getDreamnodes() {
    const dreamnodes = [];
    const files = fs.readdirSync(VAULT_PATH);

    files.forEach(file => {
        const fullPath = path.join(VAULT_PATH, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const gitPath = path.join(fullPath, '.git');
            if (fs.existsSync(gitPath)) {
                dreamnodes.push(file);
            }
        }
    });

    return dreamnodes;
}

function getMediaFile(dreamnodeName) {
    const dreamnodePath = path.join(VAULT_PATH, dreamnodeName);
    const mediaFormats = ['gif', 'mp4', 'png', 'jpeg', 'jpg', 'webp', 'svg'];
    
    for (const format of mediaFormats) {
        const mediaPath = path.join(dreamnodePath, `${dreamnodeName}.${format}`);
        if (fs.existsSync(mediaPath)) {
            return { path: mediaPath, format };
        }
    }
    
    return null;
}

function displayDreamnodes(dreamnodes) {
    const dreamnodeList = document.getElementById('dreamnodeList');
    dreamnodeList.innerHTML = ''; // Clear existing list

    dreamnodes.forEach(dreamnode => {
        const listItem = document.createElement('div');
        listItem.className = 'dreamnode-item';
        listItem.setAttribute('data-dreamnode', dreamnode);
        
        const mediaFile = getMediaFile(dreamnode);
        if (mediaFile) {
            if (mediaFile.format === 'mp4') {
                const video = document.createElement('video');
                video.src = mediaFile.path;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                listItem.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = mediaFile.path;
                listItem.appendChild(img);
            }
        }
        
        const label = document.createElement('span');
        label.textContent = dreamnode;
        listItem.appendChild(label);
        
        listItem.addEventListener('click', () => {
            centerDreamnode(dreamnode);
        });

        listItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, dreamnode);
        });

        dreamnodeList.appendChild(listItem);
    });
}

function centerDreamnode(dreamnode) {
    const dreamnodes = document.querySelectorAll('.dreamnode-item');
    dreamnodes.forEach(node => {
        if (node.getAttribute('data-dreamnode') === dreamnode) {
            node.classList.add('centered');
            node.addEventListener('click', exitFullScreen);
        } else {
            node.classList.add('hidden');
        }
    });
}

function exitFullScreen() {
    const dreamnodes = document.querySelectorAll('.dreamnode-item');
    dreamnodes.forEach(node => {
        node.classList.remove('centered', 'hidden');
        node.removeEventListener('click', exitFullScreen);
    });
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        exitFullScreen();
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

function centerDreamnode(dreamnode) {
    const dreamnodes = document.querySelectorAll('.dreamnode-item');
    dreamnodes.forEach(node => {
        if (node.getAttribute('data-dreamnode') === dreamnode) {
            node.classList.add('centered');
            node.addEventListener('click', exitFullScreen);
        } else {
            node.classList.add('hidden');
        }
    });
    document.addEventListener('keydown', handleEscapeKey);
}

function showContextMenu(e, dreamnode) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;

    const openFinderOption = document.getElementById('openFinder');
    const openGitFoxOption = document.getElementById('openGitFox');
    const copyDreamTalkOption = document.getElementById('copyDreamTalk');
    const openKeynodeOption = document.getElementById('openKeynode');

    openFinderOption.onclick = () => {
        ipcRenderer.send('open-in-finder', dreamnode);
        contextMenu.style.display = 'none';
    };

    openGitFoxOption.onclick = () => {
        ipcRenderer.send('open-in-gitfox', dreamnode);
        contextMenu.style.display = 'none';
    };

    copyDreamTalkOption.onclick = () => {
        const dreamTalk = generateDreamTalk(dreamnode);
        clipboard.writeText(dreamTalk);
        contextMenu.style.display = 'none';
    };

    openKeynodeOption.onclick = () => {
        ipcRenderer.send('open-keynode', dreamnode);
        contextMenu.style.display = 'none';
    };

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    }, { once: true });
}

function generateDreamTalk(dreamnode) {
    // Implement the logic to generate DreamTalk here
    return `DreamTalk for ${dreamnode}`;
}

function filterDreamnodes(searchTerm) {
    return allDreamnodes.filter(dreamnode => 
        dreamnode.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const aStartsWith = a.toLowerCase().startsWith(searchTerm.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(searchTerm.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
    });
}

// New DreamNode dialog functionality
const newDreamnodeBtn = document.getElementById('newDreamnodeBtn');
const newDreamnodeDialog = document.getElementById('newDreamnodeDialog');
const dreamnodeNameInput = document.getElementById('dreamnodeName');
const cloneCheckbox = document.getElementById('cloneCheckbox');
const repoUrlInput = document.getElementById('repoUrl');
const createDreamnodeBtn = document.getElementById('createDreamnodeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchBar = document.getElementById('searchBar');
const searchDialog = document.getElementById('searchDialog');

newDreamnodeBtn.addEventListener('click', () => {
    newDreamnodeDialog.style.display = 'block';
});

cloneCheckbox.addEventListener('change', () => {
    repoUrlInput.style.display = cloneCheckbox.checked ? 'block' : 'none';
});

cancelBtn.addEventListener('click', () => {
    newDreamnodeDialog.style.display = 'none';
    dreamnodeNameInput.value = '';
    cloneCheckbox.checked = false;
    repoUrlInput.value = '';
    repoUrlInput.style.display = 'none';
});

createDreamnodeBtn.addEventListener('click', () => {
    const name = dreamnodeNameInput.value.trim();
    const clone = cloneCheckbox.checked;
    const repoUrl = repoUrlInput.value.trim();

    if (!name) {
        alert('Please enter a name for the DreamNode.');
        return;
    }

    if (clone && !repoUrl) {
        alert('Please enter a repository URL to clone.');
        return;
    }

    ipcRenderer.send('create-dreamnode', { name, clone, repoUrl });
    newDreamnodeDialog.style.display = 'none';
    dreamnodeNameInput.value = '';
    cloneCheckbox.checked = false;
    repoUrlInput.value = '';
    repoUrlInput.style.display = 'none';
});

ipcRenderer.on('dreamnode-created', (event, success) => {
    if (success) {
        allDreamnodes = getDreamnodes();
        displayDreamnodes(filterDreamnodes(currentSearchTerm));
    } else {
        alert('Failed to create DreamNode. Please try again.');
    }
});

searchBar.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    displayDreamnodes(filterDreamnodes(currentSearchTerm));
});

searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchDialog.style.display = 'none';
        searchBar.value = '';
        currentSearchTerm = '';
        displayDreamnodes(allDreamnodes);
    } else if (e.key === 'Enter') {
        searchDialog.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.key === 'o') {
        e.preventDefault();
        searchDialog.style.display = 'block';
        searchBar.focus();
        searchBar.value = currentSearchTerm;
    } else if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        newDreamnodeDialog.style.display = 'block';
        dreamnodeNameInput.focus();
    }
});

// Initialize
allDreamnodes = getDreamnodes();
displayDreamnodes(allDreamnodes);
