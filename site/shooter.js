const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#ec7063'];
const GRID_COLS = 11;
const GRID_ROWS = 12;
const ASPECT_RATIO = 3 / 4;
const POWER_UP_CHANCE = 0.05;
const SPECIAL_BAG_CHANCE = 0.03;

let gameState = {
    level: 1,
    shots: 40,
    maxShots: 40,
    points: 0,
    grid: [],
    currentBall: null,
    nextBall: null,
    ballInFlight: null,
    aimAngle: -Math.PI / 2,
    mousePos: { x: 0, y: 0 },
    isDragging: false,
    dragStart: null,
    fallingBags: [],
    gameOver: false,
    canShoot: true
};

let canvasScale = 1;
let bagRadius = 20;
let cannonY = 0;

function initCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const canvasWidth = Math.min(containerWidth, 600);
    const canvasHeight = canvasWidth / ASPECT_RATIO;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    canvasScale = canvasWidth / 600;
    bagRadius = 27 * canvasScale;
    cannonY = canvas.height - 50 * canvasScale;
    
    initGrid();
}

function initGrid() {
    gameState.grid = [];
    const numColors = Math.min(4 + gameState.level - 1, 7);
    
    for (let row = 0; row < GRID_ROWS; row++) {
        gameState.grid[row] = [];
        const cols = (row % 2 === 0) ? GRID_COLS : GRID_COLS - 1;
        
        for (let col = 0; col < cols; col++) {
            if (row < 9) {
                const specialRoll = Math.random();
                let type = 'normal';
                
                if (specialRoll < SPECIAL_BAG_CHANCE) {
                    type = Math.random() < 0.5 ? 'bomb' : 'rowclear';
                }
                
                gameState.grid[row][col] = {
                    color: COLORS[Math.floor(Math.random() * numColors)],
                    type: type,
                    x: 0,
                    y: 0
                };
            } else {
                gameState.grid[row][col] = null;
            }
        }
    }
    
    updateGridPositions();
}

function updateGridPositions() {
    const gridWidth = canvas.width;
    const gridStartX = bagRadius;
    const gridStartY = bagRadius * 0.5;
    
    for (let row = 0; row < GRID_ROWS; row++) {
        const cols = gameState.grid[row].length;
        const offsetX = (row % 2 === 1) ? bagRadius : 0;
        
        for (let col = 0; col < cols; col++) {
            if (gameState.grid[row][col]) {
                gameState.grid[row][col].x = gridStartX + col * bagRadius * 2 + offsetX;
                gameState.grid[row][col].y = gridStartY + row * bagRadius * 1.75;
            }
        }
    }
}

function getGridPosition(x, y) {
    const gridWidth = canvas.width;
    const gridStartX = bagRadius;
    const gridStartY = bagRadius * 0.5;
    
    const row = Math.round((y - gridStartY) / (bagRadius * 1.75));
    const offsetX = (row % 2 === 1) ? bagRadius : 0;
    const col = Math.round((x - gridStartX - offsetX) / (bagRadius * 2));
    
    return { row, col };
}

function spawnBall() {
    const numColors = Math.min(4 + gameState.level - 1, 7);
    const powerUpRoll = Math.random();
    
    let type = 'normal';
    if (powerUpRoll < POWER_UP_CHANCE) {
        type = Math.random() < 0.5 ? 'bomb' : 'rowclear';
    }
    
    return {
        color: COLORS[Math.floor(Math.random() * numColors)],
        type: type
    };
}

function drawBag(x, y, color, radius = bagRadius, type = 'normal') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    if (type === 'bomb') {
        ctx.fillStyle = '#000';
        ctx.font = `bold ${radius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', x, y);
    } else if (type === 'rowclear') {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${radius * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x, y);
    }
}

function drawCannon() {
    const cannonX = canvas.width / 2;
    const cannonWidth = 40 * canvasScale;
    const cannonHeight = 50 * canvasScale;
    
    ctx.save();
    ctx.translate(cannonX, cannonY);
    ctx.rotate(gameState.aimAngle + Math.PI / 2);
    
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-cannonWidth / 2, 0, cannonWidth, cannonHeight);
    
    ctx.restore();
    
    if (gameState.currentBall) {
        drawBag(cannonX, cannonY - 10 * canvasScale, gameState.currentBall.color, bagRadius * 0.8, gameState.currentBall.type);
    }
    
    if (gameState.nextBall) {
        const nextX = cannonX + 60 * canvasScale;
        const nextY = cannonY;
        drawBag(nextX, nextY, gameState.nextBall.color, bagRadius * 0.6, gameState.nextBall.type);
    }
}

function drawTrajectory() {
    if (!gameState.currentBall || !gameState.canShoot) return;
    
    const cannonX = canvas.width / 2;
    const startY = cannonY - 10 * canvasScale;
    
    const dx = Math.cos(gameState.aimAngle);
    const dy = Math.sin(gameState.aimAngle);
    
    const fadeHeight = canvas.height * (0.6 - (gameState.level - 1) * 0.1);
    const maxY = canvas.height - fadeHeight;
    
    ctx.strokeStyle = gameState.currentBall.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    let x = cannonX;
    let y = startY;
    let vx = dx * 10;
    let vy = dy * 10;
    
    for (let i = 0; i < 100; i++) {
        const prevX = x;
        const prevY = y;
        
        x += vx;
        y += vy;
        
        if (x < bagRadius || x > canvas.width - bagRadius) {
            vx = -vx;
            x = Math.max(bagRadius, Math.min(canvas.width - bagRadius, x));
        }
        
        if (y < maxY) {
            const alpha = Math.max(0, (y - (canvas.height - fadeHeight)) / fadeHeight);
            ctx.globalAlpha = alpha;
        } else {
            ctx.globalAlpha = 1;
        }
        
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        if (y < bagRadius * 0.5) break;
        
        let hitBag = false;
        for (let row = 0; row < GRID_ROWS && !hitBag; row++) {
            for (let col = 0; col < gameState.grid[row].length && !hitBag; col++) {
                const bag = gameState.grid[row][col];
                if (bag) {
                    const dist = Math.sqrt((x - bag.x) ** 2 + (y - bag.y) ** 2);
                    if (dist < bagRadius * 2) {
                        hitBag = true;
                    }
                }
            }
        }
        
        if (hitBag) break;
    }
    
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
}

function drawGrid() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bag = gameState.grid[row][col];
            if (bag) {
                drawBag(bag.x, bag.y, bag.color, bagRadius, bag.type);
            }
        }
    }
}

function drawFallingBags() {
    for (const bag of gameState.fallingBags) {
        drawBag(bag.x, bag.y, bag.color, bagRadius, bag.type);
    }
}

function shootBall() {
    if (!gameState.canShoot || !gameState.currentBall || gameState.shots <= 0) return;
    
    gameState.shots--;
    updateUI();
    
    const cannonX = canvas.width / 2;
    const startY = cannonY - 10 * canvasScale;
    
    gameState.ballInFlight = {
        x: cannonX,
        y: startY,
        vx: Math.cos(gameState.aimAngle) * 15,
        vy: Math.sin(gameState.aimAngle) * 15,
        color: gameState.currentBall.color,
        type: gameState.currentBall.type
    };
    
    gameState.currentBall = gameState.nextBall;
    gameState.nextBall = spawnBall();
    gameState.canShoot = false;
}

function updateBallInFlight() {
    if (!gameState.ballInFlight) return;
    
    const ball = gameState.ballInFlight;
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    if (ball.x < bagRadius || ball.x > canvas.width - bagRadius) {
        ball.vx = -ball.vx;
        ball.x = Math.max(bagRadius, Math.min(canvas.width - bagRadius, ball.x));
    }
    
    if (ball.y < bagRadius * 0.5) {
        attachBallToGrid(ball.x, ball.y, ball.color, ball.type);
        gameState.ballInFlight = null;
        gameState.canShoot = true;
        return;
    }
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bag = gameState.grid[row][col];
            if (bag) {
                const dist = Math.sqrt((ball.x - bag.x) ** 2 + (ball.y - bag.y) ** 2);
                if (dist < bagRadius * 1.8) {
                    attachBallToGrid(ball.x, ball.y, ball.color, ball.type);
                    gameState.ballInFlight = null;
                    gameState.canShoot = true;
                    return;
                }
            }
        }
    }
}

function attachBallToGrid(x, y, color, type = 'normal') {
    const pos = getGridPosition(x, y);
    let { row, col } = pos;
    
    row = Math.max(0, Math.min(GRID_ROWS - 1, row));
    
    const maxCol = (row % 2 === 0) ? GRID_COLS - 1 : GRID_COLS - 2;
    col = Math.max(0, Math.min(maxCol, col));
    
    if (!gameState.grid[row]) {
        gameState.grid[row] = [];
    }
    
    if (type === 'bomb') {
        activateBomb(row, col);
        return;
    } else if (type === 'rowclear') {
        activateRowClear(row);
        return;
    }
    
    gameState.grid[row][col] = {
        color: color,
        type: 'normal',
        x: 0,
        y: 0
    };
    
    updateGridPositions();
    checkMatches(row, col);
}

function activateBomb(centerRow, centerCol) {
    const radius = 2.5;
    const cleared = [];
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bag = gameState.grid[row][col];
            if (bag) {
                const dist = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
                if (dist <= radius) {
                    cleared.push({ row, col, bag });
                }
            }
        }
    }
    
    const pointsPerBag = 10 + (gameState.level - 1);
    gameState.points += cleared.length * pointsPerBag;
    
    for (const { row, col, bag } of cleared.slice(0, 10)) {
        gameState.fallingBags.push({
            x: bag.x,
            y: bag.y,
            color: bag.color,
            type: bag.type,
            vy: 0,
            rotation: 0
        });
    }
    
    for (const { row, col } of cleared) {
        gameState.grid[row][col] = null;
    }
    
    updateUI();
}

function activateRowClear(targetRow) {
    const cleared = [];
    
    for (let row = targetRow; row < GRID_ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bag = gameState.grid[row][col];
            if (bag) {
                cleared.push({ row, col, bag });
            }
        }
    }
    
    const pointsPerBag = 10 + (gameState.level - 1);
    gameState.points += cleared.length * pointsPerBag;
    
    for (const { row, col, bag } of cleared.slice(0, 10)) {
        gameState.fallingBags.push({
            x: bag.x,
            y: bag.y,
            color: bag.color,
            type: bag.type,
            vy: 0,
            rotation: 0
        });
    }
    
    for (const { row, col } of cleared) {
        gameState.grid[row][col] = null;
    }
    
    updateUI();
}

function removeOrphans() {
    const connected = new Set();
    const toCheck = [];
    
    for (let col = 0; col < gameState.grid[0].length; col++) {
        if (gameState.grid[0][col]) {
            toCheck.push([0, col]);
            connected.add(`0,${col}`);
        }
    }
    
    while (toCheck.length > 0) {
        const [row, col] = toCheck.pop();
        const neighbors = getNeighbors(row, col);
        
        for (const [nRow, nCol] of neighbors) {
            const key = `${nRow},${nCol}`;
            if (!connected.has(key) && gameState.grid[nRow]?.[nCol]) {
                connected.add(key);
                toCheck.push([nRow, nCol]);
            }
        }
    }
    
    const orphans = [];
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bag = gameState.grid[row][col];
            if (bag && !connected.has(`${row},${col}`)) {
                orphans.push({ row, col, bag });
            }
        }
    }
    
    if (orphans.length > 0) {
        const pointsPerBag = 10 + (gameState.level - 1);
        gameState.points += orphans.length * pointsPerBag;
        
        for (const { row, col, bag } of orphans.slice(0, 10)) {
            gameState.fallingBags.push({
                x: bag.x,
                y: bag.y,
                color: bag.color,
                type: bag.type,
                vy: 0,
                rotation: 0
            });
        }
        
        for (const { row, col } of orphans) {
            gameState.grid[row][col] = null;
        }
    }
}

function checkMatches(startRow, startCol) {
    const color = gameState.grid[startRow][startCol]?.color;
    if (!color) return;
    
    const visited = new Set();
    const toCheck = [[startRow, startCol]];
    const matched = [];
    
    while (toCheck.length > 0) {
        const [row, col] = toCheck.pop();
        const key = `${row},${col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const bag = gameState.grid[row]?.[col];
        if (!bag || bag.color !== color) continue;
        
        matched.push({ row, col, bag });
        
        const neighbors = getNeighbors(row, col);
        for (const [nRow, nCol] of neighbors) {
            toCheck.push([nRow, nCol]);
        }
    }
    
    if (matched.length >= 3) {
        let hasSpecial = false;
        for (const { row, col, bag } of matched) {
            if (bag.type === 'bomb') {
                activateBomb(row, col);
                hasSpecial = true;
            } else if (bag.type === 'rowclear') {
                activateRowClear(row);
                hasSpecial = true;
            }
        }
        
        if (hasSpecial) return;
        
        const pointsPerBag = 10 + (gameState.level - 1);
        gameState.points += matched.length * pointsPerBag;
        
        for (const { row, col, bag } of matched.slice(0, 10)) {
            gameState.fallingBags.push({
                x: bag.x,
                y: bag.y,
                color: bag.color,
                type: bag.type,
                vy: 0,
                rotation: 0
            });
        }
        
        for (const { row, col } of matched) {
            gameState.grid[row][col] = null;
        }
        
        removeOrphans();
        updateUI();
    }
    
    if (gameState.shots <= 0) {
        endGame();
    }
}

function getNeighbors(row, col) {
    const neighbors = [];
    const isEvenRow = row % 2 === 0;
    
    const offsets = isEvenRow ? [
        [-1, -1], [-1, 0],
        [0, -1], [0, 1],
        [1, -1], [1, 0]
    ] : [
        [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, 0], [1, 1]
    ];
    
    for (const [dRow, dCol] of offsets) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < gameState.grid[newRow]?.length) {
            neighbors.push([newRow, newCol]);
        }
    }
    
    return neighbors;
}

function updateFallingBags() {
    for (let i = gameState.fallingBags.length - 1; i >= 0; i--) {
        const bag = gameState.fallingBags[i];
        bag.vy += 0.5;
        bag.y += bag.vy;
        bag.rotation += 0.1;
        
        if (bag.y > canvas.height + bagRadius) {
            gameState.fallingBags.splice(i, 1);
        }
    }
}

function updateUI() {
    document.getElementById('level-display').textContent = gameState.level;
    document.getElementById('shots-display').textContent = gameState.shots;
    document.getElementById('points-display').textContent = gameState.points;
    
    const shotsDisplay = document.getElementById('shots-display');
    if (gameState.shots < 5) {
        shotsDisplay.classList.add('low');
    } else {
        shotsDisplay.classList.remove('low');
    }
    
    const collectBtn = document.getElementById('collect-btn');
    const coins = Math.floor(gameState.points / 10);
    document.getElementById('collect-amount').textContent = coins;
    
    if (gameState.points > 0) {
        collectBtn.disabled = false;
    } else {
        collectBtn.disabled = true;
    }
}

function endGame() {
    gameState.gameOver = true;
    document.getElementById('final-score').textContent = gameState.points;
    document.getElementById('shots-used').textContent = 30 - gameState.shots;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

function resetGame() {
    gameState.shots = 30;
    gameState.points = 0;
    gameState.gameOver = false;
    gameState.ballInFlight = null;
    gameState.fallingBags = [];
    gameState.canShoot = true;
    
    initGrid();
    gameState.currentBall = spawnBall();
    gameState.nextBall = spawnBall();
    
    updateUI();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawFallingBags();
    drawTrajectory();
    drawCannon();
    
    if (gameState.ballInFlight) {
        drawBag(gameState.ballInFlight.x, gameState.ballInFlight.y, gameState.ballInFlight.color, bagRadius * 0.8);
    }
}

function gameLoop() {
    if (!gameState.gameOver) {
        updateBallInFlight();
        updateFallingBags();
        render();
    }
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mousePos.x = e.clientX - rect.left;
    gameState.mousePos.y = e.clientY - rect.top;
    
    const cannonX = canvas.width / 2;
    const dx = gameState.mousePos.x - cannonX;
    const dy = gameState.mousePos.y - (cannonY - 10 * canvasScale);
    
    gameState.aimAngle = Math.atan2(dy, dx);
    gameState.aimAngle = Math.max(-Math.PI * 0.95, Math.min(-Math.PI * 0.05, gameState.aimAngle));
});

canvas.addEventListener('click', () => {
    shootBall();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    gameState.dragStart = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
    gameState.isDragging = true;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!gameState.isDragging) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const cannonX = canvas.width / 2;
    const dx = x - cannonX;
    const dy = y - (cannonY - 10 * canvasScale);
    
    gameState.aimAngle = Math.atan2(dy, dx);
    gameState.aimAngle = Math.max(-Math.PI * 0.95, Math.min(-Math.PI * 0.05, gameState.aimAngle));
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameState.isDragging) {
        shootBall();
        gameState.isDragging = false;
        gameState.dragStart = null;
    }
});

document.getElementById('help-btn').addEventListener('click', () => {
    document.getElementById('tutorial-overlay').classList.remove('hidden');
});

document.getElementById('close-tutorial').addEventListener('click', () => {
    document.getElementById('tutorial-overlay').classList.add('hidden');
});

document.getElementById('collect-btn').addEventListener('click', () => {
    alert(`Collected ${Math.floor(gameState.points / 10)} coins! (Server integration pending)`);
    gameState.points = 0;
    updateUI();
});

document.getElementById('collect-final').addEventListener('click', () => {
    alert(`Collected ${Math.floor(gameState.points / 10)} coins! (Server integration pending)`);
    document.getElementById('gameover-overlay').classList.add('hidden');
    resetGame();
});

document.getElementById('play-again').addEventListener('click', () => {
    document.getElementById('gameover-overlay').classList.add('hidden');
    resetGame();
});

window.addEventListener('resize', () => {
    initCanvas();
    render();
});

const tutorialSeen = localStorage.getItem('shooter-tutorial-seen');
if (!tutorialSeen) {
    document.getElementById('tutorial-overlay').classList.remove('hidden');
    localStorage.setItem('shooter-tutorial-seen', 'true');
}

initCanvas();
gameState.currentBall = spawnBall();
gameState.nextBall = spawnBall();
updateUI();
gameLoop();
