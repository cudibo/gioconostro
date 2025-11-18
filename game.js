// Game configuration
const gameConfig = {
    images: {
        hero: 'assets/eroe-colors-ai.png',
        monster: 'assets/mostro-colors.png',
        map: 'assets/mappa.jpeg'
    }
};

// Game state
const gameState = {
    hero: { x: 50, y: 50, size: 60 },
    monster: { x: 400, y: 300, size: 60, speed: 2 },
    goal: { x: 450, y: 50, size: 30 },
    isRunning: false,
    isWon: false,
    isLost: false,
    commands: [],
    currentCommandIndex: 0
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 500;

// Images
const images = {
    hero: new Image(),
    monster: new Image(),
    map: new Image()
};

images.hero.src = gameConfig.images.hero;
images.monster.src = gameConfig.images.monster;
images.map.src = gameConfig.images.map;

let imagesLoaded = 0;
const totalImages = 3;

images.hero.onload = images.monster.onload = images.map.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        drawGame();
    }
};

// Drag and Drop functionality
let draggedBlock = null;
let draggedElement = null;
let touchStartPos = null;
let isDragging = false;

// Store original blocks for reference
const originalBlocks = new Map();

// Helper function to add block to workspace or loop
function addBlockToTarget(blockElement, targetContainer) {
    const blockClone = blockElement.cloneNode(true);
    blockClone.classList.remove('dragging');
    blockClone.classList.add('block-in-workspace');
    blockClone.draggable = false;
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        blockClone.remove();
        // Show empty message if workspace is empty
        if (targetContainer === workspace && (workspace.children.length === 0 || (workspace.children.length === 1 && workspace.querySelector('.empty-message')))) {
            workspace.innerHTML = '<p class="empty-message">Trascina qui i blocchi per creare il tuo programma</p>';
        }
    };
    deleteBtn.onmouseenter = (e) => e.stopPropagation();
    blockClone.appendChild(deleteBtn);
    
    // Handle loop blocks
    if (blockClone.dataset.command === 'repeat') {
        const loopContainer = document.createElement('div');
        loopContainer.className = 'loop-container';
        
        const loopHeader = document.createElement('div');
        loopHeader.className = 'loop-header';
        loopHeader.innerHTML = blockClone.innerHTML;
        const headerDeleteBtn = loopHeader.querySelector('.delete-btn');
        if (headerDeleteBtn) {
            headerDeleteBtn.onclick = (e) => {
                e.stopPropagation();
                loopContainer.remove();
                if (workspace.children.length === 0 || (workspace.children.length === 1 && workspace.querySelector('.empty-message'))) {
                    workspace.innerHTML = '<p class="empty-message">Trascina qui i blocchi per creare il tuo programma</p>';
                }
            };
            headerDeleteBtn.onmouseenter = (e) => e.stopPropagation();
        }
        
        const loopContent = document.createElement('div');
        loopContent.className = 'loop-content';
        
        loopContainer.appendChild(loopHeader);
        loopContainer.appendChild(loopContent);
        
        // Make loop content droppable
        setupDropZone(loopContent);
        
        targetContainer.appendChild(loopContainer);
    } else {
        targetContainer.appendChild(blockClone);
    }
    
    // Remove empty message if present
    const emptyMsg = targetContainer.querySelector('.empty-message');
    if (emptyMsg) emptyMsg.remove();
}

// Setup drop zone for workspace and loop-content
function setupDropZone(dropZone) {
    // Only add desktop handlers if not already added
    if (!dropZone.hasAttribute('data-dropzone-setup')) {
        dropZone.setAttribute('data-dropzone-setup', 'true');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            // Highlight loop-content on drag over
            if (dropZone.classList.contains('loop-content')) {
                dropZone.style.backgroundColor = '#f0f0f0';
            }
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            // Only change background if actually leaving the drop zone
            if (dropZone.classList.contains('loop-content') && !dropZone.contains(e.relatedTarget)) {
                dropZone.style.backgroundColor = 'white';
            }
        });
        
        // Touch support
        dropZone.addEventListener('touchmove', (e) => {
            if (isDragging && draggedElement) {
                e.preventDefault();
                // Highlight loop-content on touch move
                if (dropZone.classList.contains('loop-content')) {
                    dropZone.style.backgroundColor = '#f0f0f0';
                }
            }
        }, { passive: false });
        
        dropZone.addEventListener('touchend', (e) => {
            if (isDragging && draggedElement) {
                const touch = e.changedTouches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (dropZone.contains(elementBelow) || elementBelow === dropZone) {
                    e.preventDefault();
                    if (draggedElement.dataset.command !== 'repeat') {
                        addBlockToTarget(draggedElement, dropZone);
                    }
                }
                
                // Reset background
                if (dropZone.classList.contains('loop-content')) {
                    dropZone.style.backgroundColor = 'white';
                }
                
                isDragging = false;
                draggedElement = null;
                document.querySelectorAll('.block').forEach(b => b.classList.remove('dragging'));
            }
        });
    }
}

document.querySelectorAll('.block').forEach(block => {
    originalBlocks.set(block.dataset.command, block);
    
    // Desktop drag and drop
    block.addEventListener('dragstart', (e) => {
        draggedBlock = block.cloneNode(true);
        draggedElement = block;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', block.dataset.command);
        block.classList.add('dragging');
    });

    block.addEventListener('dragend', (e) => {
        block.classList.remove('dragging');
    });
    
    // Touch support for mobile
    block.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartPos = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        draggedElement = block;
        block.classList.add('dragging');
    }, { passive: false });
    
    block.addEventListener('touchmove', (e) => {
        if (!touchStartPos || !draggedElement) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        
        // Start dragging if moved more than 10px
        if (deltaX > 10 || deltaY > 10) {
            isDragging = true;
            e.preventDefault();
        }
    }, { passive: false });
    
    block.addEventListener('touchend', (e) => {
        if (!touchStartPos) return;
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (isDragging && draggedElement) {
            // Find drop target
            const workspaceArea = document.getElementById('workspace');
            const loopContent = elementBelow?.closest('.loop-content');
            
            if (loopContent) {
                if (draggedElement.dataset.command !== 'repeat') {
                    addBlockToTarget(draggedElement, loopContent);
                }
            } else if (workspaceArea && (workspaceArea.contains(elementBelow) || elementBelow === workspaceArea)) {
                if (!elementBelow?.closest('.loop-content')) {
                    addBlockToTarget(draggedElement, workspaceArea);
                }
            }
        }
        
        isDragging = false;
        draggedElement = null;
        touchStartPos = null;
        block.classList.remove('dragging');
    });
    
    block.addEventListener('touchcancel', () => {
        isDragging = false;
        draggedElement = null;
        touchStartPos = null;
        block.classList.remove('dragging');
    });
});

const workspace = document.getElementById('workspace');

// Setup workspace as drop zone
setupDropZone(workspace);

// Desktop drop handler for workspace
workspace.addEventListener('drop', (e) => {
    // Don't handle if dropping on loop-content (handled separately)
    if (e.target.closest('.loop-content')) {
        return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    if (draggedElement) {
        addBlockToTarget(draggedElement, workspace);
        draggedElement = null;
    }
});

// Touch support for workspace
workspace.addEventListener('touchmove', (e) => {
    if (isDragging && draggedElement) {
        e.preventDefault();
    }
}, { passive: false });


// Parse commands from workspace
function parseCommands() {
    const commands = [];
    const blocks = workspace.querySelectorAll('.block-in-workspace, .loop-container');
    
    blocks.forEach(block => {
        if (block.classList.contains('loop-container')) {
            const loopHeader = block.querySelector('.loop-header');
            const loopCount = parseInt(loopHeader.querySelector('.loop-count').value) || 2;
            const loopContent = block.querySelector('.loop-content');
            const innerBlocks = loopContent.querySelectorAll('.block-in-workspace');
            
            const innerCommands = [];
            innerBlocks.forEach(innerBlock => {
                const command = innerBlock.dataset.command;
                if (command && command.startsWith('move-')) {
                    innerCommands.push(command);
                }
            });
            
            for (let i = 0; i < loopCount; i++) {
                commands.push(...innerCommands);
            }
        } else {
            const command = block.dataset.command;
            if (command && command.startsWith('move-')) {
                commands.push(command);
            }
        }
    });
    
    return commands;
}

// Game execution
let animationFrame = null;

function executeCommands() {
    if (gameState.isRunning) return;
    
    gameState.commands = parseCommands();
    if (gameState.commands.length === 0) {
        showStatus('Aggiungi almeno un comando di movimento!', 'error');
        return;
    }
    
    // Reset game state
    gameState.hero.x = 50;
    gameState.hero.y = 50;
    gameState.monster.x = 400;
    gameState.monster.y = 300;
    gameState.isRunning = true;
    gameState.isWon = false;
    gameState.isLost = false;
    gameState.currentCommandIndex = 0;
    
    showStatus('Esecuzione in corso...', 'info');
    
    executeNextCommand();
    startMonsterMovement();
}

function executeNextCommand() {
    if (gameState.currentCommandIndex >= gameState.commands.length) {
        if (!gameState.isWon && !gameState.isLost) {
            showStatus('Programma completato ma obiettivo non raggiunto!', 'error');
            gameState.isRunning = false;
        }
        return;
    }
    
    if (gameState.isWon || gameState.isLost) {
        gameState.isRunning = false;
        return;
    }
    
    const command = gameState.commands[gameState.currentCommandIndex];
    const stepSize = 50;
    
    switch(command) {
        case 'move-up':
            gameState.hero.y = Math.max(0, gameState.hero.y - stepSize);
            break;
        case 'move-down':
            gameState.hero.y = Math.min(canvas.height - gameState.hero.size, gameState.hero.y + stepSize);
            break;
        case 'move-left':
            gameState.hero.x = Math.max(0, gameState.hero.x - stepSize);
            break;
        case 'move-right':
            gameState.hero.x = Math.min(canvas.width - gameState.hero.size, gameState.hero.x + stepSize);
            break;
    }
    
    checkCollisions();
    drawGame();
    
    gameState.currentCommandIndex++;
    
    setTimeout(() => {
        executeNextCommand();
    }, 500);
}

function startMonsterMovement() {
    if (!gameState.isRunning || gameState.isWon || gameState.isLost) return;
    
    // Simple AI: move towards hero
    const dx = gameState.hero.x - gameState.monster.x;
    const dy = gameState.hero.y - gameState.monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        gameState.monster.x += (dx / distance) * gameState.monster.speed;
        gameState.monster.y += (dy / distance) * gameState.monster.speed;
    }
    
    // Keep monster in bounds
    gameState.monster.x = Math.max(0, Math.min(canvas.width - gameState.monster.size, gameState.monster.x));
    gameState.monster.y = Math.max(0, Math.min(canvas.height - gameState.monster.size, gameState.monster.y));
    
    checkCollisions();
    drawGame();
    
    if (gameState.isRunning && !gameState.isWon && !gameState.isLost) {
        requestAnimationFrame(() => {
            setTimeout(() => startMonsterMovement(), 50);
        });
    }
}

function checkCollisions() {
    // Check goal collision
    const goalDx = gameState.hero.x - gameState.goal.x;
    const goalDy = gameState.hero.y - gameState.goal.y;
    const goalDistance = Math.sqrt(goalDx * goalDx + goalDy * goalDy);
    
    if (goalDistance < (gameState.hero.size + gameState.goal.size) / 2) {
        gameState.isWon = true;
        gameState.isRunning = false;
        showStatus('🎉 Vittoria! Hai raggiunto l\'obiettivo!', 'success');
        return;
    }
    
    // Check monster collision
    const monsterDx = gameState.hero.x - gameState.monster.x;
    const monsterDy = gameState.hero.y - gameState.monster.y;
    const monsterDistance = Math.sqrt(monsterDx * monsterDx + monsterDy * monsterDy);
    
    if (monsterDistance < (gameState.hero.size + gameState.monster.size) / 2) {
        gameState.isLost = true;
        gameState.isRunning = false;
        showStatus('💀 Hai incontrato il mostro! Riprova!', 'error');
        return;
    }
}

function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw map background
    if (images.map.complete) {
        ctx.drawImage(images.map, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw goal
    ctx.fillStyle = '#28a745';
    ctx.beginPath();
    ctx.arc(gameState.goal.x + gameState.goal.size/2, gameState.goal.y + gameState.goal.size/2, gameState.goal.size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#155724';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw flag on goal
    ctx.fillStyle = '#fff';
    ctx.fillRect(gameState.goal.x + gameState.goal.size/2, gameState.goal.y, 3, gameState.goal.size/2);
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(gameState.goal.x + gameState.goal.size/2 + 3, gameState.goal.y);
    ctx.lineTo(gameState.goal.x + gameState.goal.size/2 + 3, gameState.goal.y + gameState.goal.size/4);
    ctx.lineTo(gameState.goal.x + gameState.goal.size/2 + 15, gameState.goal.y + gameState.goal.size/8);
    ctx.closePath();
    ctx.fill();
    
    // Draw monster with shadow and border
    if (images.monster.complete) {
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw white border/outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(gameState.monster.x + gameState.monster.size/2, gameState.monster.y + gameState.monster.size/2, gameState.monster.size/2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw red border for visibility
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gameState.monster.x + gameState.monster.size/2, gameState.monster.y + gameState.monster.size/2, gameState.monster.size/2 + 1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw monster image
        ctx.save();
        ctx.beginPath();
        ctx.arc(gameState.monster.x + gameState.monster.size/2, gameState.monster.y + gameState.monster.size/2, gameState.monster.size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(images.monster, gameState.monster.x, gameState.monster.y, gameState.monster.size, gameState.monster.size);
        ctx.restore();
    } else {
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(gameState.monster.x, gameState.monster.y, gameState.monster.size, gameState.monster.size);
    }
    
    // Draw hero with shadow and border
    if (images.hero.complete) {
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw white border/outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(gameState.hero.x + gameState.hero.size/2, gameState.hero.y + gameState.hero.size/2, gameState.hero.size/2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw blue border for visibility
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gameState.hero.x + gameState.hero.size/2, gameState.hero.y + gameState.hero.size/2, gameState.hero.size/2 + 1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw hero image
        ctx.save();
        ctx.beginPath();
        ctx.arc(gameState.hero.x + gameState.hero.size/2, gameState.hero.y + gameState.hero.size/2, gameState.hero.size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(images.hero, gameState.hero.x, gameState.hero.y, gameState.hero.size, gameState.hero.size);
        ctx.restore();
    } else {
        ctx.fillStyle = '#007bff';
        ctx.fillRect(gameState.hero.x, gameState.hero.y, gameState.hero.size, gameState.hero.size);
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('game-status');
    statusEl.textContent = message;
    statusEl.className = `game-status ${type}`;
}

function resetGame() {
    gameState.hero.x = 50;
    gameState.hero.y = 50;
    gameState.monster.x = 400;
    gameState.monster.y = 300;
    gameState.isRunning = false;
    gameState.isWon = false;
    gameState.isLost = false;
    gameState.commands = [];
    gameState.currentCommandIndex = 0;
    showStatus('', 'info');
    drawGame();
}

function clearWorkspace() {
    workspace.innerHTML = '<p class="empty-message">Trascina qui i blocchi per creare il tuo programma</p>';
    resetGame();
}

// Event listeners
document.getElementById('run-btn').addEventListener('click', executeCommands);
document.getElementById('reset-btn').addEventListener('click', resetGame);
document.getElementById('clear-btn').addEventListener('click', clearWorkspace);

// Initial draw
drawGame();


