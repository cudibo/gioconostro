// Joystick controller for mobile game
// This file handles all joystick functionality including touch and mouse events

// Joystick state - exposed for external access
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
    direction: null, // Direction name for debugging
    directionX: 0,   // X component of direction (-1 to 1)
    directionY: 0    // Y component of direction (-1 to 1)
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
    joystickState.directionX = 0;
    joystickState.directionY = 0;
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

