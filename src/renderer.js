const { ipcRenderer, clipboard } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';

let allDreamnodes = [];
let currentSortMethod = 'alphabetical';
let currentSearchTerm = '';

function getDreamnodes() {
    logger.log(`Getting dreamnodes from: ${VAULT_PATH}`);
    const dreamnodes = [];
    const files = fs.readdirSync(VAULT_PATH);
    logger.log(`Files in VAULT_PATH: ${files.join(', ')}`);

    files.forEach(file => {
        const fullPath = path.join(VAULT_PATH, file);
        logger.log(`Checking file: ${file}`);
        if (fs.statSync(fullPath).isDirectory()) {
            const gitPath = path.join(fullPath, '.git');
            logger.log(`Checking for .git in: ${gitPath}`);
            if (fs.existsSync(gitPath)) {
                const plPath = path.join(fullPath, '.pl');
                logger.log(`Checking for .pl in: ${plPath}`);
                let metadata = {};
                if (fs.existsSync(plPath)) {
                    try {
                        metadata = JSON.parse(fs.readFileSync(plPath, 'utf-8'));
                        logger.log(`Metadata found: ${JSON.stringify(metadata)}`);
                    } catch (error) {
                        logger.log(`Error reading .pl file: ${error.message}`);
                        metadata = createPlFile(file);
                        logger.log(`Created new metadata due to error: ${JSON.stringify(metadata)}`);
                    }
                } else {
                    metadata = createPlFile(file);
                    logger.log(`Created new metadata: ${JSON.stringify(metadata)}`);
                }
                dreamnodes.push({ name: file, ...metadata });
                logger.log(`Added dreamnode: ${JSON.stringify({ name: file, ...metadata })}`);
            }
        }
    });

    logger.log(`Returning dreamnodes: ${JSON.stringify(dreamnodes)}`);
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
    logger.log(`Displaying dreamnodes: ${JSON.stringify(dreamnodes)}`);
    const dreamnodeList = document.getElementById('dreamnodeList');
    if (!dreamnodeList) {
        logger.log('dreamnodeList element not found');
        return;
    }
    dreamnodeList.innerHTML = ''; // Clear existing list

    if (dreamnodes.length === 0) {
        logger.log('No dreamnodes to display');
        const noNodesMessage = document.createElement('div');
        noNodesMessage.textContent = 'No dreamnodes found';
        dreamnodeList.appendChild(noNodesMessage);
        return;
    }

    dreamnodes.forEach(dreamnode => {
        logger.log(`Creating element for dreamnode: ${JSON.stringify(dreamnode)}`);
        const listItem = document.createElement('div');
        listItem.className = 'dreamnode-item';
        listItem.setAttribute('data-dreamnode', dreamnode.name);
        
        listItem.classList.add(dreamnode.type === 'person' ? 'person-node' : 'idea-node');
        
        const mediaFile = getMediaFile(dreamnode.name);
        if (mediaFile) {
            logger.log(`Media file found for dreamnode: ${JSON.stringify(mediaFile)}`);
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
            logger.log(`No media file found for dreamnode: ${dreamnode.name}`);
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
    logger.log(`Finished displaying ${dreamnodes.length} dreamnodes`);
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
    const editMetadataOption = document.getElementById('editMetadata');

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

    editMetadataOption.onclick = () => {
        showMetadataDialog(dreamnode);
        contextMenu.style.display = 'none';
    };

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    }, { once: true });
}

function showMetadataDialog(dreamnode) {
    const metadata = getMetadata(dreamnode);
    const metadataDialog = document.getElementById('metadataDialog');
    const metadataForm = document.getElementById('metadataForm');
    
    // Set values for each input
    document.getElementById('dateCreated').value = metadata.dateCreated ? new Date(metadata.dateCreated).toISOString().slice(0, 16) : '';
    document.getElementById('dateModified').value = metadata.dateModified ? new Date(metadata.dateModified).toISOString().slice(0, 16) : '';
    document.getElementById('interactions').value = metadata.interactions || 0;
    document.querySelector(`input[name="type"][value="${metadata.type || 'idea'}"]`).checked = true;
    
    metadataDialog.style.display = 'block';
    
    const updateMetadataBtn = document.getElementById('updateMetadataBtn');
    const cancelMetadataBtn = document.getElementById('cancelMetadataBtn');
    
    const closeDialog = () => {
        metadataDialog.style.display = 'none';
        document.removeEventListener('keydown', handleEscapeKey);
    };
    
    const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
        }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    updateMetadataBtn.onclick = () => {
        const updatedMetadata = {
            dateCreated: document.getElementById('dateCreated').value,
            dateModified: document.getElementById('dateModified').value,
            interactions: parseInt(document.getElementById('interactions').value, 10),
            type: document.querySelector('input[name="type"]:checked').value
        };
        updateMetadata(dreamnode, updatedMetadata);
        closeDialog();
    };
    
    cancelMetadataBtn.onclick = closeDialog;
    
    // Add functionality for "Now" buttons
    document.querySelectorAll('.now-btn').forEach(btn => {
        btn.onclick = () => {
            const inputId = btn.getAttribute('data-for');
            document.getElementById(inputId).value = new Date().toISOString().slice(0, 16);
        };
    });
}

function getMetadata(dreamnode) {
    const plPath = path.join(VAULT_PATH, dreamnode, '.pl');
    if (fs.existsSync(plPath)) {
        return JSON.parse(fs.readFileSync(plPath, 'utf-8'));
    }
    return {};
}

function updateMetadata(dreamnode, metadata) {
    const plPath = path.join(VAULT_PATH, dreamnode, '.pl');
    fs.writeFileSync(plPath, JSON.stringify(metadata, null, 2));
    allDreamnodes = getDreamnodes();
    displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));
}

function generateDreamTalk(dreamnode) {
    // Implement the logic to generate DreamTalk here
    return `DreamTalk for ${dreamnode}`;
}

function filterAndSortDreamnodes(searchTerm, sortMethod) {
    const filtered = allDreamnodes.filter(dreamnode => 
        dreamnode.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return sortDreamnodes(filtered, sortMethod);
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
    displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
});

function handleEscapeKey(e) {
    if (e.key === 'Escape' && searchDialog.style.display === 'block') {
        searchDialog.style.display = 'none';
        searchBar.value = '';
        currentSearchTerm = '';
        displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));
    }
}

searchBar.addEventListener('keydown', handleEscapeKey);

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
    } else {
        handleEscapeKey(e);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    logger.log('DOMContentLoaded event fired');
    allDreamnodes = getDreamnodes();
    logger.log(`All dreamnodes: ${JSON.stringify(allDreamnodes)}`);
    const sortedDreamnodes = sortDreamnodes(allDreamnodes, currentSortMethod);
    logger.log(`Sorted dreamnodes: ${JSON.stringify(sortedDreamnodes)}`);
    displayDreamnodes(sortedDreamnodes);

    const sortButtons = document.getElementById('sortButtons');
    ['alphabetical', 'dateCreated', 'dateModified', 'activity'].forEach(method => {
        const button = document.createElement('button');
        button.textContent = method.charAt(0).toUpperCase() + method.slice(1);
        button.addEventListener('click', () => {
            logger.log(`Sort method changed to: ${method}`);
            currentSortMethod = method;
            displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
            updateActiveButton(method);
        });
        sortButtons.appendChild(button);
    });
    updateActiveButton(currentSortMethod);
});

// Add this at the end of the file
function updateActiveButton(activeMethod) {
    const buttons = document.querySelectorAll('#sortButtons button');
    buttons.forEach(button => {
        if (button.textContent.toLowerCase() === activeMethod) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

logger.log('renderer.js loaded');
