const { ipcRenderer, clipboard } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

const VAULT_PATH = '/Users/davidrug/Library/Mobile Documents/iCloud~md~obsidian/Documents/InterBrain';

let allDreamnodes = [];
let currentSortMethod = 'activity';
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

function createPlFile(dreamnodeName, type = 'idea') {
    const plPath = path.join(VAULT_PATH, dreamnodeName, '.pl');
    const metadata = {
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        interactions: 0,
        type: type,
        relatedNodes: []
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

    const itemsPerRow = Math.floor(dreamnodeList.offsetWidth / 200); // Adjust 200 based on item width + gap
    let currentRow;
    let rowIndex = 0;

    dreamnodes.forEach((dreamnode, index) => {
        if (index % itemsPerRow === 0) {
            currentRow = document.createElement('div');
            currentRow.className = 'honeycomb-row';
            dreamnodeList.appendChild(currentRow);
            rowIndex++;
        }

        // Skip the last item in even rows
        if (rowIndex % 2 === 0 && (index + 1) % itemsPerRow === 0) {
            return;
        }

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

        currentRow.appendChild(listItem);
    });
    logger.log(`Finished displaying ${dreamnodes.length} dreamnodes`);
}

// Call displayDreamnodes after initial render
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing code)
    displayDreamnodes(sortedDreamnodes);
});

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
    const metadata = getMetadata(dreamnode);
    const relatedNodes = metadata.relatedNodes || [];
    const liminalWeb = document.createElement('div');
    liminalWeb.id = 'liminalWeb';

    dreamnodes.forEach(node => {
        if (node.getAttribute('data-dreamnode') === dreamnode) {
            node.classList.add('centered');
            
            // Create flip button
            const flipButton = document.createElement('button');
            flipButton.textContent = 'Show DreamSong';
            flipButton.classList.add('flip-button');
            flipButton.addEventListener('click', (e) => {
                e.stopPropagation();
                flipDreamnode(node);
            });
            
            // Create dream talk side
            const dreamTalkSide = document.createElement('div');
            dreamTalkSide.classList.add('dream-talk-side');
            while (node.firstChild) {
                dreamTalkSide.appendChild(node.firstChild);
            }
            
            // Create dream song side
            const dreamSongSide = document.createElement('div');
            dreamSongSide.classList.add('dream-song-side');
            const dreamSongContent = document.createElement('div');
            dreamSongContent.classList.add('dream-song-content');
            dreamSongContent.textContent = 'DreamSong';
            dreamSongSide.appendChild(dreamSongContent);
            
            // Append both sides to the node
            node.appendChild(dreamTalkSide);
            node.appendChild(dreamSongSide);
            
            // Append flip button to body, not to the node
            document.body.appendChild(flipButton);
            
            node.addEventListener('click', handleExitFullScreen);
        } else {
            node.classList.add('hidden');
        }
    });

    // Create and position related nodes
    relatedNodes.forEach((relatedNode, index) => {
        const relatedNodeElement = createRelatedNodeElement(relatedNode);
        liminalWeb.appendChild(relatedNodeElement);
        positionRelatedNode(relatedNodeElement, index, relatedNodes.length);
    });

    document.body.appendChild(liminalWeb);
    document.addEventListener('keydown', handleExitFullScreen);
}

function createRelatedNodeElement(nodeName) {
    const element = document.createElement('div');
    element.className = 'related-node';
    element.setAttribute('data-dreamnode', nodeName);
    const metadata = getMetadata(nodeName);
    
    element.classList.add(metadata.type === 'person' ? 'person-node' : 'idea-node');

    const mediaFile = getMediaFile(nodeName);
    if (mediaFile) {
        if (mediaFile.format === 'mp4') {
            const video = document.createElement('video');
            video.src = mediaFile.path;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            element.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = mediaFile.path;
            element.appendChild(img);
        }
    }

    const label = document.createElement('span');
    label.textContent = nodeName;
    element.appendChild(label);

    element.addEventListener('click', () => {
        exitFullScreen();
        centerDreamnode(nodeName);
    });

    return element;
}

function positionRelatedNode(element, index, total) {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 300; // Adjust this value to change the distance from the center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    element.style.transform = `translate(${x}px, ${y}px)`;
}

function flipDreamnode(node) {
    const flipButton = document.querySelector('.flip-button');
    const dreamTalkSide = node.querySelector('.dream-talk-side');
    const dreamSongSide = node.querySelector('.dream-song-side');

    if (node.classList.contains('flipped')) {
        node.classList.remove('flipped');
        if (flipButton) {
            flipButton.textContent = 'Show DreamSong';
        }
    } else {
        node.classList.add('flipped');
        if (flipButton) {
            flipButton.textContent = 'Show DreamTalk';
        }
    }

    // Switch content at the midpoint of the animation
    setTimeout(() => {
        if (node.classList.contains('flipped')) {
            dreamTalkSide.style.display = 'none';
            dreamSongSide.style.display = 'flex';
        } else {
            dreamTalkSide.style.display = 'flex';
            dreamSongSide.style.display = 'none';
        }
    }, 450); // Half of the new animation duration (3 * 300ms = 900ms, so half is 450ms)
}

function exitFullScreen() {
    const centeredNode = document.querySelector('.dreamnode-item.centered');
    if (centeredNode) {
        centeredNode.classList.remove('centered', 'flipped');
        centeredNode.removeEventListener('click', exitFullScreen);
    }
    document.querySelectorAll('.dreamnode-item.hidden').forEach(node => {
        node.classList.remove('hidden');
    });
    removeFlipButton();
    document.removeEventListener('keydown', handleEscapeKey);
}

function removeFlipButton() {
    const flipButton = document.querySelector('.flip-button');
    if (flipButton) {
        flipButton.remove();
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        exitFullScreen();
    }
}

// Add this new function to handle both Escape key and click
function handleExitFullScreen(e) {
    if (e.type === 'keydown' && e.key !== 'Escape') {
        return;
    }
    exitFullScreen();
}

function showContextMenu(e, dreamnode) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;

    const menuOptions = {
        'openFinder': () => ipcRenderer.send('open-in-finder', dreamnode),
        'openGitFox': () => {
            logger.log(`Attempting to open GitFox for dreamnode: ${dreamnode}`);
            ipcRenderer.send('open-in-gitfox', dreamnode);
            ipcRenderer.once('gitfox-opened', (event, result) => {
                if (result.success) {
                    logger.log(`Successfully opened GitFox for ${dreamnode}`);
                } else {
                    logger.log(`Failed to open GitFox for ${dreamnode}: ${result.error}`);
                    alert(`Failed to open GitFox: ${result.error}`);
                }
            });
        },
        'openKeynote': () => {
            logger.log(`Attempting to open Keynote for dreamnode: ${dreamnode}`);
            ipcRenderer.send('open-in-keynote', dreamnode);
            ipcRenderer.once('keynote-opened', (event, result) => {
                if (result.success) {
                    logger.log(`Successfully opened Keynote for ${dreamnode}`);
                } else {
                    logger.log(`Failed to open Keynote for ${dreamnode}: ${result.error}`);
                    alert(`Failed to open Keynote: ${result.error}`);
                }
            });
        },
        'openC4D': () => {
            logger.log(`Attempting to open Cinema 4D for dreamnode: ${dreamnode}`);
            ipcRenderer.send('open-in-c4d', dreamnode);
            ipcRenderer.once('c4d-opened', (event, result) => {
                if (result.success) {
                    logger.log(`Successfully opened Cinema 4D for ${dreamnode}`);
                } else {
                    logger.log(`Failed to open Cinema 4D for ${dreamnode}: ${result.error}`);
                    alert(`Failed to open Cinema 4D: ${result.error}`);
                }
            });
        },
        'openSublime': () => {
            logger.log(`Attempting to open Sublime Text for dreamnode: ${dreamnode}`);
            ipcRenderer.send('open-in-sublime', dreamnode);
            ipcRenderer.once('sublime-opened', (event, result) => {
                if (result.success) {
                    logger.log(`Successfully opened Sublime Text for ${dreamnode}`);
                } else {
                    logger.log(`Failed to open Sublime Text for ${dreamnode}: ${result.error}`);
                    alert(`Failed to open Sublime Text: ${result.error}`);
                }
            });
        },
        'copyDreamTalk': () => {
            try {
                const mediaFile = getMediaFile(dreamnode);
                if (mediaFile) {
                    const fileContent = fs.readFileSync(mediaFile.path);
                    const nativeImage = require('electron').nativeImage;
                    
                    if (mediaFile.format === 'gif') {
                        clipboard.writeBuffer('image/gif', fileContent);
                    } else if (['png', 'jpeg', 'jpg', 'webp'].includes(mediaFile.format)) {
                        const image = nativeImage.createFromBuffer(fileContent);
                        clipboard.writeImage(image);
                    } else if (mediaFile.format === 'svg') {
                        clipboard.writeText(fileContent.toString('utf-8'));
                    } else if (mediaFile.format === 'mp4') {
                        clipboard.writeBuffer('video/mp4', fileContent);
                    } else {
                        clipboard.writeBuffer('application/octet-stream', fileContent);
                    }
                    
                    clipboard.writeText(mediaFile.path, 'selection');
                    
                    logger.log(`Copied media file (${mediaFile.format}) for ${dreamnode} to clipboard`);
                } else {
                    logger.log(`No media file found for ${dreamnode}`);
                    alert(`No media file found for ${dreamnode}`);
                }
            } catch (error) {
                logger.log(`Error copying media file for ${dreamnode}: ${error.message}`);
                alert(`Error copying media file: ${error.message}`);
            }
        },
        'rename': () => showRenameDialog(dreamnode),
        'editMetadata': () => {
            logger.log(`Attempting to edit metadata for dreamnode: ${dreamnode}`);
            showMetadataDialog(dreamnode);
        }
    };

    Object.keys(menuOptions).forEach(optionId => {
        const option = document.getElementById(optionId);
        if (option) {
            option.onclick = () => {
                menuOptions[optionId]();
                contextMenu.style.display = 'none';
            };
        }
    });

    const closeContextMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
            document.removeEventListener('click', closeContextMenu);
            document.removeEventListener('keydown', handleEscapeKey);
        }
    };

    const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            contextMenu.style.display = 'none';
            document.removeEventListener('click', closeContextMenu);
            document.removeEventListener('keydown', handleEscapeKey);
        }
    };

    document.addEventListener('click', closeContextMenu);
    document.addEventListener('keydown', handleEscapeKey);
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
    
    // Set up related nodes
    setupRelatedNodesInput(dreamnode, metadata.type || 'idea', metadata.relatedNodes || []);
    
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
            type: document.querySelector('input[name="type"]:checked').value,
            relatedNodes: Array.from(document.querySelectorAll('.selected-node'))
                .map(node => node.querySelector('span').textContent.trim())
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

function setupRelatedNodesInput(currentNode, nodeType, selectedNodes) {
    const relatedNodesInput = document.getElementById('relatedNodesInput');
    const relatedNodesList = document.getElementById('relatedNodesList');
    const selectedRelatedNodes = document.getElementById('selectedRelatedNodes');

    // Clear previous content
    relatedNodesList.innerHTML = '';
    selectedRelatedNodes.innerHTML = '';

    // Add selected nodes
    selectedNodes.forEach(node => addSelectedNode(node));

    // Get all nodes of the opposite type
    const oppositeType = nodeType === 'idea' ? 'person' : 'idea';
    const availableNodes = allDreamnodes.filter(node => node.type === oppositeType && node.name !== currentNode);

    relatedNodesInput.addEventListener('input', () => {
        const searchTerm = relatedNodesInput.value.toLowerCase();
        const filteredNodes = availableNodes.filter(node => 
            node.name.toLowerCase().includes(searchTerm) && 
            !selectedNodes.includes(node.name)
        );

        relatedNodesList.innerHTML = '';
        filteredNodes.forEach(node => {
            const li = document.createElement('li');
            li.textContent = node.name;
            li.addEventListener('click', () => {
                addSelectedNode(node.name);
                relatedNodesInput.value = '';
                relatedNodesList.style.display = 'none';
            });
            relatedNodesList.appendChild(li);
        });

        relatedNodesList.style.display = filteredNodes.length > 0 ? 'block' : 'none';
    });

    relatedNodesInput.addEventListener('focus', () => {
        if (relatedNodesList.children.length > 0) {
            relatedNodesList.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!relatedNodesInput.contains(e.target) && !relatedNodesList.contains(e.target)) {
            relatedNodesList.style.display = 'none';
        }
    });

    function addSelectedNode(nodeName) {
        const trimmedName = nodeName.trim();
        if (!selectedNodes.includes(trimmedName)) {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'selected-node';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = trimmedName;
            nodeElement.appendChild(nameSpan);
            
            const removeButton = document.createElement('span');
            removeButton.className = 'remove-node';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => {
                selectedRelatedNodes.removeChild(nodeElement);
                selectedNodes = selectedNodes.filter(node => node !== trimmedName);
            });

            nodeElement.appendChild(removeButton);
            selectedRelatedNodes.appendChild(nodeElement);
            selectedNodes.push(trimmedName);
            
            // Clear the input and hide the list after adding
            relatedNodesInput.value = '';
            relatedNodesList.style.display = 'none';
        }
    }
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
    // Ensure all related nodes are trimmed
    if (metadata.relatedNodes) {
        metadata.relatedNodes = metadata.relatedNodes.map(node => node.trim());
    }
    fs.writeFileSync(plPath, JSON.stringify(metadata, null, 2));
    allDreamnodes = getDreamnodes();
    displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));
}


function showRenameDialog(dreamnode) {
    const renameDialog = document.getElementById('renameDialog');
    const renameInput = document.getElementById('renameInput');
    const confirmRenameBtn = document.getElementById('confirmRename');
    const cancelRenameBtn = document.getElementById('cancelRename');

    renameInput.value = dreamnode;
    renameDialog.style.display = 'block';

    confirmRenameBtn.onclick = () => {
        const newName = renameInput.value.trim();
        if (newName && newName !== dreamnode) {
            renameDreamnode(dreamnode, newName);
        }
        renameDialog.style.display = 'none';
    };

    cancelRenameBtn.onclick = () => {
        renameDialog.style.display = 'none';
    };

    const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
            renameDialog.style.display = 'none';
            document.removeEventListener('keydown', handleEscapeKey);
        }
    };

    document.addEventListener('keydown', handleEscapeKey);
}

function renameDreamnode(oldName, newName) {
    const oldPath = path.join(VAULT_PATH, oldName);
    const newPath = path.join(VAULT_PATH, newName);

    try {
        // Rename the directory
        fs.renameSync(oldPath, newPath);

        // Update .pl file
        const plPath = path.join(newPath, '.pl');
        if (fs.existsSync(plPath)) {
            const plContent = JSON.parse(fs.readFileSync(plPath, 'utf-8'));
            plContent.dateModified = new Date().toISOString();
            fs.writeFileSync(plPath, JSON.stringify(plContent, null, 2));
        }

        // Rename media file if it exists
        const mediaFile = getMediaFile(oldName);
        if (mediaFile) {
            const oldMediaPath = mediaFile.path;
            const newMediaPath = path.join(newPath, `${newName}.${mediaFile.format}`);
            fs.renameSync(oldMediaPath, newMediaPath);
        }

        // Refresh the dreamnode list
        allDreamnodes = getDreamnodes();
        displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));

        logger.log(`Successfully renamed dreamnode from ${oldName} to ${newName}`);
    } catch (error) {
        console.error('Error renaming dreamnode:', error);
        logger.log(`Error renaming dreamnode from ${oldName} to ${newName}: ${error.message}`);
    }
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
        displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
    } else {
        alert('Failed to create DreamNode. Please try again.');
    }
});

searchBar.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
});

searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchDialog.style.display = 'none';
        // Keep the current search term and sorting
    } else if (e.key === 'Escape') {
        handleEscapeKey(e);
    }
});

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const searchDialog = document.getElementById('searchDialog');
        const newDreamnodeDialog = document.getElementById('newDreamnodeDialog');
        const metadataDialog = document.getElementById('metadataDialog');

        if (newDreamnodeDialog.style.display !== 'none') {
            newDreamnodeDialog.style.display = 'none';
        } else if (metadataDialog.style.display !== 'none') {
            metadataDialog.style.display = 'none';
        } else {
            // Always reset search when Escape is pressed
            searchDialog.style.display = 'none';
            clearSearch();
            exitFullScreen();
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.key === 'o') {
        e.preventDefault();
        searchDialog.style.display = searchDialog.style.display === 'none' ? 'flex' : 'none';
        if (searchDialog.style.display === 'flex') {
            searchBar.focus();
        }
    } else if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        newDreamnodeDialog.style.display = 'block';
        dreamnodeNameInput.focus();
    } else if (e.key === 'Escape') {
        handleEscapeKey(e);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Single character key pressed without modifiers
        if (searchDialog.style.display === 'none') {
            currentSearchTerm += e.key;
            displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
        }
    } else if (e.key === 'Backspace' && searchDialog.style.display === 'none') {
        currentSearchTerm = currentSearchTerm.slice(0, -1);
        displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
    }
});

// Add this function to clear the search when Escape is pressed
function clearSearch() {
    currentSearchTerm = '';
    searchBar.value = '';
    displayDreamnodes(sortDreamnodes(allDreamnodes, currentSortMethod));
}

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

    // Set up drag and drop
    setupDragAndDrop();
});

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const body = document.body;

    body.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('active');
    });

    body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget === null || !body.contains(e.relatedTarget)) {
            dropZone.classList.remove('active');
        }
    });

    body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('active');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleDroppedFile(files[0]);
        }
    });
}

function handleDroppedFile(file) {
    const supportedFormats = ['gif', 'mp4', 'png', 'jpeg', 'jpg', 'webp', 'svg'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (supportedFormats.includes(fileExtension)) {
        showNewDreamnodeDialog(file);
    } else {
        alert('Unsupported file format. Please drop a supported media file.');
    }
}

function showNewDreamnodeDialog(file) {
    const newDreamnodeDialog = document.getElementById('newDreamnodeDialog');
    const dreamnodeNameInput = document.getElementById('dreamnodeName');
    const createDreamnodeBtn = document.getElementById('createDreamnodeBtn');

    dreamnodeNameInput.value = file.name.split('.')[0]; // Set default name to file name without extension
    newDreamnodeDialog.style.display = 'block';

    const originalCreateHandler = createDreamnodeBtn.onclick;
    createDreamnodeBtn.onclick = () => {
        const name = dreamnodeNameInput.value.trim();
        const type = document.querySelector('input[name="dreamnodeType"]:checked').value;

        if (!name) {
            alert('Please enter a name for the DreamNode.');
            return;
        }

        ipcRenderer.send('create-dreamnode-with-media', { name, type, filePath: file.path });
        newDreamnodeDialog.style.display = 'none';

        // Reset the original event handler
        createDreamnodeBtn.onclick = originalCreateHandler;
    };

    // Focus on the name input
    dreamnodeNameInput.focus();
}

// Add a new IPC listener for the response
ipcRenderer.on('dreamnode-with-media-created', (event, result) => {
    if (result.success) {
        allDreamnodes = getDreamnodes();
        displayDreamnodes(filterAndSortDreamnodes(currentSearchTerm, currentSortMethod));
    } else {
        alert(`Failed to create DreamNode with media: ${result.error}`);
    }
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
