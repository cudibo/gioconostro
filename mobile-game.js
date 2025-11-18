// Game configuration
const gameConfig = {
    images: {
        hero: 'assets/eroe-colors-ai.png',
        monster: 'assets/mostro-colors.png',
        map: 'assets/mappa.jpeg'
    }
};

// Collision zones (obstacles like houses) - defined as rectangles
// These are relative to a 500x500 canvas and will be scaled
const collisionZones = [
    // House obstacle - adjust these coordinates based on where the house is on your map
    // Format: { x, y, width, height }
    { x: 210, y: 50, width: 160, height: 120 }, // Example: house in center area
    { x: 60, y: 140, width: 60, height: 140 }
];

// Game state
const gameState = {
    hero: { x: 50, y: 50, size: 60, speed: 3 },
    monster: { x: 400, y: 300, size: 60, speed: 1 },
    goal: { x: 450, y: 50, size: 30 },
    isRunning: true,
    isWon: false,
    isLost: false
};

// Canvas setup
let canvas, ctx;

// Set canvas size for mobile horizontal mode
function resizeCanvas() {
    if (!canvas) {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
    }
    
    const container = document.querySelector('.game-canvas-container');
    if (!container || container.clientWidth === 0) {
        // Retry after a short delay if container not ready
        setTimeout(resizeCanvas, 100);
        return;
    }
    
    const maxWidth = container.clientWidth - 40; // padding
    const maxHeight = window.innerHeight * 0.6;
    
    const newWidth = Math.max(300, Math.min(maxWidth, 600));
    const newHeight = Math.max(250, Math.min(maxHeight, 400));
    
    // Scale game positions based on canvas size
    const scaleX = newWidth / 500;
    const scaleY = newHeight / 500;
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Scale initial positions only if they haven't been scaled yet
    // Check if positions are still at default values (within small tolerance)
    if (Math.abs(gameState.hero.x - 50) < 1 && Math.abs(gameState.hero.y - 50) < 1) {
        gameState.hero.x = 50 * scaleX;
        gameState.hero.y = 50 * scaleY;
        gameState.monster.x = 400 * scaleX;
        gameState.monster.y = 300 * scaleY;
        gameState.goal.x = 450 * scaleX;
        gameState.goal.y = 50 * scaleY;
    }
    
    // Scale collision zones
    gameState.scaledCollisionZones = collisionZones.map(zone => ({
        x: zone.x * scaleX,
        y: zone.y * scaleY,
        width: zone.width * scaleX,
        height: zone.height * scaleY
    }));
    
    drawGame();
}

// Images
const images = {
    hero: new Image(),
    monster: new Image(),
    map: new Image()
};

let imagesLoaded = 0;
const totalImages = 3;

function loadImages() {
    images.hero.src = gameConfig.images.hero;
    images.monster.src = gameConfig.images.monster;
    images.map.src = gameConfig.images.map;
    
    images.hero.onload = images.monster.onload = images.map.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            drawGame();
        }
    };
    
    // Handle image load errors - draw anyway with fallback shapes
    images.hero.onerror = images.monster.onerror = images.map.onerror = () => {
        console.warn('Image failed to load, using fallback');
        // Draw immediately even if images fail
        setTimeout(drawGame, 100);
    };
    
    // Draw immediately even if images are not loaded yet (will use fallback shapes)
    setTimeout(drawGame, 100);
}

// Joystick state
const joystickState = {
    isActive: false,
    baseX: 0,
    baseY: 0,
    baseRadius: 0,
    stickX: 0,
    stickY: 0,
    stickRadius: 0,
    currentX: 0,
    currentY: 0,
    direction: null // 'up', 'down', 'left', 'right', or null
};

// Initialize joystick
function initJoystick() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
    const rect = joystickBase.getBoundingClientRect();
    
    joystickState.baseX = rect.left + rect.width / 2;
    joystickState.baseY = rect.top + rect.height / 2;
    joystickState.baseRadius = rect.width / 2;
    joystickState.stickRadius = joystickStick.offsetWidth / 2;
    joystickState.stickX = joystickState.baseX;
    joystickState.stickY = joystickState.baseY;
    
    // Reset stick position
    updateJoystickPosition(joystickState.baseX, joystickState.baseY);
}

// Update joystick visual position
function updateJoystickPosition(x, y) {
    const joystickStick = document.getElementById('joystickStick');
    const dx = x - joystickState.baseX;
    const dy = y - joystickState.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit stick to base circle
    if (distance > joystickState.baseRadius - joystickState.stickRadius) {
        const angle = Math.atan2(dy, dx);
        x = joystickState.baseX + Math.cos(angle) * (joystickState.baseRadius - joystickState.stickRadius);
        y = joystickState.baseY + Math.sin(angle) * (joystickState.baseRadius - joystickState.stickRadius);
    }
    
    joystickState.currentX = x;
    joystickState.currentY = y;
    joystickState.stickX = x;
    joystickState.stickY = y;
    
    // Update visual position
    const offsetX = x - joystickState.baseX;
    const offsetY = y - joystickState.baseY;
    joystickStick.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    // Calculate direction
    const deadZone = joystickState.baseRadius * 0.3; // 30% dead zone
    if (distance < deadZone) {
        joystickState.direction = null;
    } else {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Determine primary direction (up, down, left, right)
        if (angle >= -45 && angle < 45) {
            joystickState.direction = 'right';
        } else if (angle >= 45 && angle < 135) {
            joystickState.direction = 'down';
        } else if (angle >= 135 || angle < -135) {
            joystickState.direction = 'left';
        } else {
            joystickState.direction = 'up';
        }
    }
}

// Reset joystick to center
function resetJoystick() {
    joystickState.isActive = false;
    joystickState.direction = null;
    updateJoystickPosition(joystickState.baseX, joystickState.baseY);
}

// Joystick event handlers
const joystickBase = document.getElementById('joystickBase');
const joystickStick = document.getElementById('joystickStick');

function getTouchPosition(e) {
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX,
        y: touch.clientY
    };
}

function handleJoystickStart(e) {
    e.preventDefault();
    joystickState.isActive = true;
    const pos = getTouchPosition(e);
    updateJoystickPosition(pos.x, pos.y);
}

function handleJoystickMove(e) {
    if (!joystickState.isActive) return;
    e.preventDefault();
    const pos = getTouchPosition(e);
    updateJoystickPosition(pos.x, pos.y);
}

function handleJoystickEnd(e) {
    if (!joystickState.isActive) return;
    e.preventDefault();
    resetJoystick();
}

// Touch events
joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
joystickBase.addEventListener('touchend', handleJoystickEnd, { passive: false });
joystickBase.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

// Mouse events (for testing on desktop)
joystickBase.addEventListener('mousedown', handleJoystickStart);
document.addEventListener('mousemove', handleJoystickMove);
document.addEventListener('mouseup', handleJoystickEnd);

// Initialize joystick on load
window.addEventListener('load', () => {
    setTimeout(initJoystick, 100);
});
window.addEventListener('resize', () => {
    setTimeout(initJoystick, 100);
});

// Game loop - update hero position based on joystick
function updateGame() {
    if (!canvas || !ctx) {
        requestAnimationFrame(updateGame);
        return;
    }
    
    if (gameState.isWon || gameState.isLost) {
        gameState.isRunning = false;
        requestAnimationFrame(updateGame);
        return;
    }
    
    // Move hero based on joystick direction
    if (joystickState.direction && gameState.isRunning) {
        const stepSize = gameState.hero.speed;
        const oldX = gameState.hero.x;
        const oldY = gameState.hero.y;
        let newX = oldX;
        let newY = oldY;
        
        switch(joystickState.direction) {
            case 'up':
                newY = Math.max(0, oldY - stepSize);
                break;
            case 'down':
                newY = Math.min(canvas.height - gameState.hero.size, oldY + stepSize);
                break;
            case 'left':
                newX = Math.max(0, oldX - stepSize);
                break;
            case 'right':
                newX = Math.min(canvas.width - gameState.hero.size, oldX + stepSize);
                break;
        }
        
        // Only move if the new position is valid (no collision with obstacles)
        if (isValidPosition(newX, newY, gameState.hero.size)) {
            gameState.hero.x = newX;
            gameState.hero.y = newY;
        }
        
        checkCollisions();
        drawGame();
    }
    
    // Move monster
    if (gameState.isRunning && !gameState.isWon && !gameState.isLost) {
        const dx = gameState.hero.x - gameState.monster.x;
        const dy = gameState.hero.y - gameState.monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const oldX = gameState.monster.x;
            const oldY = gameState.monster.y;
            const newX = oldX + (dx / distance) * gameState.monster.speed;
            const newY = oldY + (dy / distance) * gameState.monster.speed;
            
            // Try to move, but avoid obstacles
            // First try the intended direction
            if (isValidPosition(newX, newY, gameState.monster.size)) {
                gameState.monster.x = newX;
                gameState.monster.y = newY;
            } else {
                // If direct path is blocked, try moving only horizontally or vertically
                if (isValidPosition(newX, oldY, gameState.monster.size)) {
                    gameState.monster.x = newX;
                } else if (isValidPosition(oldX, newY, gameState.monster.size)) {
                    gameState.monster.y = newY;
                }
                // If both are blocked, monster stays in place
            }
        }
        
        // Keep monster in bounds
        gameState.monster.x = Math.max(0, Math.min(canvas.width - gameState.monster.size, gameState.monster.x));
        gameState.monster.y = Math.max(0, Math.min(canvas.height - gameState.monster.size, gameState.monster.y));
        
        checkCollisions();
        drawGame();
    }
    
    requestAnimationFrame(updateGame);
}

// Start game loop after initialization
setTimeout(() => {
    updateGame();
}, 300);

// Check if a circular entity (hero or monster) collides with collision zones
function checkCollisionWithZones(entityX, entityY, entitySize) {
    if (!gameState.scaledCollisionZones) return false;
    
    const entityRadius = entitySize / 2;
    const entityCenterX = entityX + entityRadius;
    const entityCenterY = entityY + entityRadius;
    
    for (const zone of gameState.scaledCollisionZones) {
        // Check if circle overlaps with rectangle
        const closestX = Math.max(zone.x, Math.min(entityCenterX, zone.x + zone.width));
        const closestY = Math.max(zone.y, Math.min(entityCenterY, zone.y + zone.height));
        
        const dx = entityCenterX - closestX;
        const dy = entityCenterY - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < entityRadius) {
            return true; // Collision detected
        }
    }
    
    return false;
}

// Check if a position is valid (not colliding with obstacles)
function isValidPosition(x, y, size) {
    // Check boundaries
    if (x < 0 || y < 0 || x + size > canvas.width || y + size > canvas.height) {
        return false;
    }
    
    // Check collision zones
    if (checkCollisionWithZones(x, y, size)) {
        return false;
    }
    
    return true;
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
    if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) {
        return;
    }
    
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
    
    // Draw collision zones (for debugging - semi-transparent red)
    if (gameState.scaledCollisionZones) {
        gameState.scaledCollisionZones.forEach(zone => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        });
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
    if (!canvas) return;
    
    // Scale positions based on current canvas size
    const scaleX = canvas.width / 500;
    const scaleY = canvas.height / 500;
    
    gameState.hero.x = 50 * scaleX;
    gameState.hero.y = 50 * scaleY;
    gameState.monster.x = 400 * scaleX;
    gameState.monster.y = 300 * scaleY;
    gameState.goal.x = 450 * scaleX;
    gameState.goal.y = 50 * scaleY;
    gameState.isRunning = true;
    gameState.isWon = false;
    gameState.isLost = false;
    
    // Recalculate collision zones
    if (gameState.scaledCollisionZones) {
        gameState.scaledCollisionZones = collisionZones.map(zone => ({
            x: zone.x * scaleX,
            y: zone.y * scaleY,
            width: zone.width * scaleX,
            height: zone.height * scaleY
        }));
    }
    
    resetJoystick();
    showStatus('', 'info');
    drawGame();
}

// Initialize everything when DOM is ready
function init() {
    resizeCanvas();
    loadImages();
    
    // Event listeners
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }
    
    // Initial draw after a short delay to ensure everything is ready
    setTimeout(() => {
        resizeCanvas();
        drawGame();
    }, 200);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('resize', () => {
    setTimeout(resizeCanvas, 100);
});
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        resizeCanvas();
        drawGame();
    }, 200);
});

