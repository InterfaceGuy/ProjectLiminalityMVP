const { ipcRenderer, clipboard } = require('electron');
const fs = require('fs-extra');
const path = require('path');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';

let allDreamnodes = [];
let currentSortMethod = 'alphabetical';
let currentSearchTerm = '';

function getDreamnodes() {
    const dreamnodes = [];
    const files = fs.readdirSync(VAULT_PATH);

    files.forEach(file => {
        const fullPath = path.join(VAULT_PATH, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const gitPath = path.join(fullPath, '.git');
            if (fs.existsSync(gitPath)) {
                const plPath = path.join(fullPath, '.pl');
                let metadata = {};
                if (fs.existsSync(plPath)) {
                    metadata = JSON.parse(fs.readFileSync(plPath, 'utf-8'));
                } else {
                    metadata = createPlFile(file);
                }
                dreamnodes.push({ name: file, ...metadata });
            }
        }
    });

    return dreamnodes;
}

function createPlFile(dreamnodeName) {
    const plPath = path.join(VAULT_PATH, dreamnodeName, '.pl');
    const metadata = {
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        interactions: 0,
        type: 'idea'
    };
    fs.writeFileSync(plPath, JSON.stringify(metadata, null, 2));
    return metadata;
}

function updatePlFile(dreamnodeName) {
    const plPath = path.join(VAULT_PATH, dreamnodeName, '.pl');
    let metadata = {};
    if (fs.existsSync(plPath)) {
        metadata = JSON.parse(fs.readFileSync(plPath, 'utf-8'));
    } else {
        metadata = createPlFile(dreamnodeName);
    }
    metadata.dateModified = new Date().toISOString();
    metadata.interactions += 1;
    fs.writeFileSync(plPath, JSON.stringify(metadata, null, 2));
    return metadata;
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

function getDreamnodeType(dreamnodeName) {
    const plPath = path.join(VAULT_PATH, dreamnodeName, '.pl');
    if (fs.existsSync(plPath)) {
        const content = fs.readFileSync(plPath, 'utf-8');
        const typeMatch = content.match(/type:\s*(\w+)/);
        if (typeMatch && typeMatch[1]) {
            return typeMatch[1].toLowerCase();
        }
    }
    return 'idea'; // Default to 'idea' if no .pl file or type not specified
}

function displayDreamnodes(dreamnodes) {
    console.log('Displaying dreamnodes:', dreamnodes);
    const dreamnodeList = document.getElementById('dreamnodeList');
    if (!dreamnodeList) {
        console.error('dreamnodeList element not found');
        return;
    }
    dreamnodeList.innerHTML = ''; // Clear existing list

    dreamnodes.forEach(dreamnode => {
        console.log('Creating element for dreamnode:', dreamnode);
        const listItem = document.createElement('div');
        listItem.className = 'dreamnode-item';
        listItem.setAttribute('data-dreamnode', dreamnode.name);
        
        listItem.classList.add(dreamnode.type === 'person' ? 'person-node' : 'idea-node');
        
        const mediaFile = getMediaFile(dreamnode.name);
        if (mediaFile) {
            console.log('Media file found for dreamnode:', mediaFile);
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
        } else {
            console.log('No media file found for dreamnode:', dreamnode.name);
        }
        
        const label = document.createElement('span');
        label.textContent = dreamnode.name;
        listItem.appendChild(label);
        
        listItem.addEventListener('click', () => {
            updatePlFile(dreamnode.name);
            centerDreamnode(dreamnode.name);
        });

        listItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, dreamnode.name);
        });

        dreamnodeList.appendChild(listItem);
    });
    console.log('Finished displaying dreamnodes');
}

function sortDreamnodes(dreamnodes, method) {
    switch (method) {
        case 'alphabetical':
            return dreamnodes.sort((a, b) => a.name.localeCompare(b.name));
        case 'dateCreated':
            return dreamnodes.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
        case 'dateModified':
            return dreamnodes.sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified));
        case 'activity':
            return dreamnodes.sort((a, b) => b.interactions - a.interactions);
        default:
            return dreamnodes;
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
    const type = document.querySelector('input[name="dreamnodeType"]:checked').value;

    if (!name) {
        alert('Please enter a name for the DreamNode.');
        return;
    }

    if (clone && !repoUrl) {
        alert('Please enter a repository URL to clone.');
        return;
    }

    ipcRenderer.send('create-dreamnode', { name, clone, repoUrl, type });
    newDreamnodeDialog.style.display = 'none';
    dreamnodeNameInput.value = '';
    cloneCheckbox.checked = false;
    repoUrlInput.value = '';
    repoUrlInput.style.display = 'none';
    document.getElementById('typeIdea').checked = true;
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    allDreamnodes = getDreamnodes();
    console.log('All dreamnodes:', allDreamnodes);
    const sortedDreamnodes = sortDreamnodes(allDreamnodes, currentSortMethod);
    console.log('Sorted dreamnodes:', sortedDreamnodes);
    displayDreamnodes(sortedDreamnodes);

    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', (e) => {
        console.log('Sort method changed to:', e.target.value);
        currentSortMethod = e.target.value;
        displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));
    });
});

// Add this at the end of the file
console.log('renderer.js loaded');
