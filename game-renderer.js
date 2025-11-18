// Common rendering functions for the game
// This file contains shared drawing logic used by both game.js and mobile-game.js

/**
 * Draw the map background
 */
function drawMapBackground(ctx, canvas, images) {
    if (images.map.complete) {
        ctx.drawImage(images.map, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Draw collision zones (optional, for debugging)
 */
function drawCollisionZones(ctx, gameState) {
    if (gameState.scaledCollisionZones) {
        gameState.scaledCollisionZones.forEach(zone => {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Semi-transparent red
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        });
    }
}

/**
 * Draw the goal (flag)
 */
function drawGoal(ctx, goal) {
    // Draw goal circle
    ctx.fillStyle = '#28a745';
    ctx.beginPath();
    ctx.arc(goal.x + goal.size/2, goal.y + goal.size/2, goal.size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#155724';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw flag on goal
    ctx.fillStyle = '#fff';
    ctx.fillRect(goal.x + goal.size/2, goal.y, 3, goal.size/2);
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(goal.x + goal.size/2 + 3, goal.y);
    ctx.lineTo(goal.x + goal.size/2 + 3, goal.y + goal.size/4);
    ctx.lineTo(goal.x + goal.size/2 + 15, goal.y + goal.size/8);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a character (hero or monster) with shadow, border, and image
 */
function drawCharacter(ctx, character, image, fallbackColor, borderColor) {
    if (image.complete) {
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Draw white border/outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(character.x + character.size/2, character.y + character.size/2, character.size/2 + 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw colored border for visibility
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(character.x + character.size/2, character.y + character.size/2, character.size/2 + 1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw character image
        ctx.save();
        ctx.beginPath();
        ctx.arc(character.x + character.size/2, character.y + character.size/2, character.size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(image, character.x, character.y, character.size, character.size);
        ctx.restore();
    } else {
        // Fallback: draw colored rectangle
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(character.x, character.y, character.size, character.size);
    }
}

/**
 * Draw the monster
 */
function drawMonster(ctx, monster, images) {
    drawCharacter(ctx, monster, images.monster, '#dc3545', '#dc3545');
}

/**
 * Draw the hero
 */
function drawHero(ctx, hero, images) {
    drawCharacter(ctx, hero, images.hero, '#007bff', '#007bff');
}

/**
 * Main draw function - draws the entire game scene
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} gameState - Game state object
 * @param {Object} images - Image objects
 * @param {boolean} showCollisionZones - Whether to draw collision zones (for debugging)
 */
function drawGameScene(ctx, canvas, gameState, images, showCollisionZones = false) {
    // Check if canvas is valid
    if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) {
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw map background
    drawMapBackground(ctx, canvas, images);
    
    // Draw collision zones (optional, for debugging)
    if (showCollisionZones) {
        drawCollisionZones(ctx, gameState);
    }
    
    // Draw goal
    drawGoal(ctx, gameState.goal);
    
    // Draw monster
    drawMonster(ctx, gameState.monster, images);
    
    // Draw hero
    drawHero(ctx, gameState.hero, images);
}

