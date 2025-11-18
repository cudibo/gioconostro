// Game version
const GAME_VERSION = '0.4';

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
    hero: { x: 50, y: 50, size: 42, speed: 3 }, // Reduced by 30% (60 * 0.7 = 42)
    monster: { x: 400, y: 300, size: 42, speed: 1 }, // Reduced by 30% (60 * 0.7 = 42)
    goal: { x: 450, y: 50, size: 21 }, // Reduced by 30% (30 * 0.7 = 21)
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
    // Use available viewport height for fullscreen experience
    // On iOS, use innerHeight which excludes the address bar when hidden
    const availableHeight = window.innerHeight || document.documentElement.clientHeight;
    // Use more of the screen, accounting for header and controls
    const headerHeight = document.querySelector('header')?.offsetHeight || 60;
    const controlsHeight = document.querySelector('.controls')?.offsetHeight || 50;
    const maxHeight = availableHeight - headerHeight - controlsHeight - 30; // Extra padding
    
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
    
    if (!joystickBase || !joystickStick) {
        setTimeout(initJoystick, 100);
        return;
    }
    
    const rect = joystickBase.getBoundingClientRect();
    
    joystickState.baseX = rect.left + rect.width / 2;
    joystickState.baseY = rect.top + rect.height / 2;
    joystickState.baseRadius = rect.width / 2;
    joystickState.stickRadius = joystickStick.offsetWidth / 2;
    joystickState.stickX = joystickState.baseX;
    joystickState.stickY = joystickState.baseY;
    
    // Reset stick position to center (CSS already centers it with translate(-50%, -50%))
    // We just need to reset the additional offset
    joystickStick.style.transform = 'translate(-50%, -50%)';
    joystickState.currentX = joystickState.baseX;
    joystickState.currentY = joystickState.baseY;
    joystickState.direction = null;
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
    
    // Update visual position (add offset to the base centered position)
    const offsetX = x - joystickState.baseX;
    const offsetY = y - joystickState.baseY;
    joystickStick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    
    // Calculate direction with 8 directions (including diagonals)
    const deadZone = joystickState.baseRadius * 0.3; // 30% dead zone
    if (distance < deadZone) {
        joystickState.direction = null;
        joystickState.directionX = 0;
        joystickState.directionY = 0;
    } else {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Normalize direction vector for smooth diagonal movement
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Determine direction (8 directions: up, down, left, right, and 4 diagonals)
        if (angle >= -22.5 && angle < 22.5) {
            joystickState.direction = 'right';
            joystickState.directionX = 1;
            joystickState.directionY = 0;
        } else if (angle >= 22.5 && angle < 67.5) {
            joystickState.direction = 'down-right';
            joystickState.directionX = normalizedDx;
            joystickState.directionY = normalizedDy;
        } else if (angle >= 67.5 && angle < 112.5) {
            joystickState.direction = 'down';
            joystickState.directionX = 0;
            joystickState.directionY = 1;
        } else if (angle >= 112.5 && angle < 157.5) {
            joystickState.direction = 'down-left';
            joystickState.directionX = normalizedDx;
            joystickState.directionY = normalizedDy;
        } else if (angle >= 157.5 || angle < -157.5) {
            joystickState.direction = 'left';
            joystickState.directionX = -1;
            joystickState.directionY = 0;
        } else if (angle >= -157.5 && angle < -112.5) {
            joystickState.direction = 'up-left';
            joystickState.directionX = normalizedDx;
            joystickState.directionY = normalizedDy;
        } else if (angle >= -112.5 && angle < -67.5) {
            joystickState.direction = 'up';
            joystickState.directionX = 0;
            joystickState.directionY = -1;
        } else {
            joystickState.direction = 'up-right';
            joystickState.directionX = normalizedDx;
            joystickState.directionY = normalizedDy;
        }
    }
}

// Reset joystick to center
function resetJoystick() {
    joystickState.isActive = false;
    joystickState.direction = null;
    joystickState.directionX = 0;
    joystickState.directionY = 0;
    const joystickStick = document.getElementById('joystickStick');
    if (joystickStick) {
        // Reset to center position (CSS uses translate(-50%, -50%) for centering)
        joystickStick.style.transform = 'translate(-50%, -50%)';
    }
    joystickState.currentX = joystickState.baseX;
    joystickState.currentY = joystickState.baseY;
}

// Joystick event handlers
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

// Setup joystick event listeners (only once)
let joystickEventsSetup = false;

function setupJoystickEvents() {
    if (joystickEventsSetup) return;
    
    const joystickBase = document.getElementById('joystickBase');
    if (!joystickBase) {
        setTimeout(setupJoystickEvents, 100);
        return;
    }
    
    joystickEventsSetup = true;
    
    // Touch events
    joystickBase.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickBase.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickBase.addEventListener('touchend', handleJoystickEnd, { passive: false });
    joystickBase.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    
    // Mouse events (for testing on desktop)
    joystickBase.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);
}

// Initialize joystick on load
window.addEventListener('load', () => {
    setTimeout(() => {
        initJoystick();
        setupJoystickEvents();
    }, 200);
});
window.addEventListener('resize', () => {
    setTimeout(() => {
        initJoystick();
    }, 100);
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
    
    // Move hero based on joystick direction (supports 8 directions including diagonals)
    if (joystickState.direction && gameState.isRunning && (joystickState.directionX !== 0 || joystickState.directionY !== 0)) {
        const stepSize = gameState.hero.speed;
        const oldX = gameState.hero.x;
        const oldY = gameState.hero.y;
        
        // Calculate new position using direction vector (allows diagonal movement)
        let newX = oldX + (joystickState.directionX * stepSize);
        let newY = oldY + (joystickState.directionY * stepSize);
        
        // Keep within bounds
        newX = Math.max(0, Math.min(canvas.width - gameState.hero.size, newX));
        newY = Math.max(0, Math.min(canvas.height - gameState.hero.size, newY));
        
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
    // Use common rendering function (collision zones shown in mobile version for debugging)
    drawGameScene(ctx, canvas, gameState, images, true);
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

// Handle viewport changes for fullscreen on mobile
function handleViewportResize() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Aggressive technique to hide address bar on iOS Safari
    function hideAddressBar() {
        // Force scroll to hide address bar
        window.scrollTo(0, 1);
        
        // Try multiple times with delays
        setTimeout(() => window.scrollTo(0, 1), 100);
        setTimeout(() => window.scrollTo(0, 1), 300);
        setTimeout(() => window.scrollTo(0, 1), 500);
        
        // Also try scrolling by a small amount
        setTimeout(() => {
            window.scrollTo(0, window.pageYOffset || document.documentElement.scrollTop || 0);
        }, 700);
    }
    
    // Hide address bar on load
    window.addEventListener('load', hideAddressBar);
    
    // Hide address bar on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            hideAddressBar();
            resizeCanvas();
            initJoystick();
        }, 100);
    });
    
    // Hide address bar on touch start (when user interacts)
    document.addEventListener('touchstart', function() {
        setTimeout(hideAddressBar, 100);
    }, { once: false });
    
    // Handle resize - detect when address bar hides/shows
    let lastHeight = window.innerHeight;
    let resizeTimer;
    window.addEventListener('resize', function() {
        const currentHeight = window.innerHeight;
        
        // If height increased, address bar might have hidden
        if (currentHeight > lastHeight) {
            hideAddressBar();
        }
        lastHeight = currentHeight;
        
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeCanvas();
            initJoystick();
        }, 150);
    });
    
    // Try to enter fullscreen if API is available
    function tryFullscreen() {
        const doc = document.documentElement;
        if (doc.requestFullscreen) {
            doc.requestFullscreen().catch(() => {
                // Fullscreen not available or denied
            });
        } else if (doc.webkitRequestFullscreen) {
            doc.webkitRequestFullscreen();
        } else if (doc.webkitEnterFullscreen) {
            doc.webkitEnterFullscreen();
        } else if (doc.mozRequestFullScreen) {
            doc.mozRequestFullScreen();
        } else if (doc.msRequestFullscreen) {
            doc.msRequestFullscreen();
        }
    }
    
    // Try fullscreen on first user interaction
    let fullscreenAttempted = false;
    document.addEventListener('touchstart', function() {
        if (!fullscreenAttempted) {
            fullscreenAttempted = true;
            setTimeout(tryFullscreen, 500);
        }
    }, { once: true });
}

// Initialize everything when DOM is ready
function init() {
    handleViewportResize();
    resizeCanvas();
    loadImages();
    
    // Display version
    const versionOverlay = document.getElementById('versionOverlay');
    if (versionOverlay) {
        versionOverlay.textContent = `v${GAME_VERSION}`;
    }
    
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

// Resize and orientation handlers are now in handleViewportResize()

