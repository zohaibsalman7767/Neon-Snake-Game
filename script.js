
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");

const overlay = document.getElementById("overlay");
const overlayIcon = document.getElementById("overlay-icon");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");

const startButton = document.getElementById("start-btn");
const pauseButton = document.getElementById("pause-btn");
const restartButton = document.getElementById("restart-btn");

const CELL = 20;
const CELLS = canvas.width / CELL;

let snake;
let food;
let direction;
let nextDirection;
let score = 0;
let highScore = loadHighScore();
let gameState = "ready";
let gameLoop = null;

// Load saved high score
function loadHighScore() {
    try {
        return Number(localStorage.getItem("neonSnakeHighScore")) || 0;
    } catch {
        return 0;
    }
}

function saveHighScore() {
    try {
        localStorage.setItem("neonSnakeHighScore", highScore);
    } catch {
        // Game can still run if storage is unavailable.
    }
}

highScoreDisplay.textContent = highScore;

// Draw the game board
function drawBoard() {
    ctx.fillStyle = "#080f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(57, 255, 136, 0.055)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= CELLS; i++) {
        const position = i * CELL;

        ctx.beginPath();
        ctx.moveTo(position, 0);
        ctx.lineTo(position, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, position);
        ctx.lineTo(canvas.width, position);
        ctx.stroke();
    }
}

// Draw the snake
function drawSnake() {
    snake.forEach((segment, index) => {
        const padding = index === 0 ? 2 : 3;
        const x = segment.x * CELL + padding;
        const y = segment.y * CELL + padding;
        const size = CELL - padding * 2;

        ctx.save();

        if (index === 0) {
            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 14;
            ctx.fillStyle = "#b4ffcf";
        } else {
            ctx.fillStyle = "#39ff88";
        }

        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 5);
        ctx.fill();

        ctx.restore();

        // Snake eyes
        if (index === 0) {
            ctx.fillStyle = "#07140d";

            let eye1 = { x: x + 5, y: y + 5 };
            let eye2 = { x: x + size - 5, y: y + 5 };

            if (direction.x === -1) {
                eye1 = { x: x + 5, y: y + 5 };
                eye2 = { x: x + 5, y: y + size - 5 };
            } else if (direction.x === 1) {
                eye1 = { x: x + size - 5, y: y + 5 };
                eye2 = { x: x + size - 5, y: y + size - 5 };
            } else if (direction.y === 1) {
                eye1 = { x: x + 5, y: y + size - 5 };
                eye2 = { x: x + size - 5, y: y + size - 5 };
            }

            ctx.beginPath();
            ctx.arc(eye1.x, eye1.y, 1.7, 0, Math.PI * 2);
            ctx.arc(eye2.x, eye2.y, 1.7, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Draw glowing food
function drawFood() {
    const centerX = food.x * CELL + CELL / 2;
    const centerY = food.y * CELL + CELL / 2;

    ctx.save();
    ctx.shadowColor = "#ff477e";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#ff477e";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Render everything
function render() {
    drawBoard();
    drawFood();
    drawSnake();
}

// Generate food outside the snake
function generateFood() {
    let position;

    do {
        position = {
            x: Math.floor(Math.random() * CELLS),
            y: Math.floor(Math.random() * CELLS)
        };
    } while (
        snake.some(segment =>
            segment.x === position.x &&
            segment.y === position.y
        )
    );

    food = position;
}

// Update score
function updateScore() {
    scoreDisplay.textContent = score;

    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        saveHighScore();
    }
}

// Set overlay content
function showOverlay(icon, title, message, buttonText) {
    overlayIcon.textContent = icon;
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    startButton.textContent = buttonText;
    overlay.classList.remove("hidden");
}

// Start a new game
function startGame() {
    clearInterval(gameLoop);

    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    scoreDisplay.textContent = score;

    generateFood();

    gameState = "running";
    overlay.classList.add("hidden");
    pauseButton.disabled = false;
    pauseButton.textContent = "⏸ Pause";

    render();

    gameLoop = setInterval(updateGame, 115);
}

// Pause or resume the game
function togglePause() {
    if (gameState === "running") {
        clearInterval(gameLoop);
        gameLoop = null;
        gameState = "paused";

        pauseButton.textContent = "▶ Resume";

        showOverlay(
            "⏸️",
            "Game Paused",
            "Take a break. Your score is " + score + ".",
            "▶ Resume Game"
        );
    } else if (gameState === "paused") {
        gameState = "running";
        overlay.classList.add("hidden");

        pauseButton.textContent = "⏸ Pause";
        gameLoop = setInterval(updateGame, 115);
    }
}

// Main game logic
function updateGame() {
    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    const eating = head.x === food.x && head.y === food.y;

    // Wall collision
    if (
        head.x < 0 ||
        head.x >= CELLS ||
        head.y < 0 ||
        head.y >= CELLS
    ) {
        endGame();
        return;
    }

    // Allow movement into the old tail position
    // when the snake is not eating.
    const body = eating ? snake : snake.slice(0, -1);

    const hitSelf = body.some(segment =>
        segment.x === head.x && segment.y === head.y
    );

    if (hitSelf) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        score += 10;
        updateScore();

        if (snake.length === CELLS * CELLS) {
            render();
            winGame();
            return;
        }

        generateFood();
    } else {
        snake.pop();
    }

    render();
}

// End game
function endGame() {
    clearInterval(gameLoop);
    gameLoop = null;
    gameState = "over";

    pauseButton.disabled = true;

    showOverlay(
        "💥",
        "Game Over!",
        "Your final score is " + score + ". Try again!",
        "↻ Play Again"
    );
}

// Win game
function winGame() {
    clearInterval(gameLoop);
    gameLoop = null;
    gameState = "over";

    pauseButton.disabled = true;

    showOverlay(
        "🏆",
        "You Won!",
        "Amazing! You filled the entire board!",
        "↻ Play Again"
    );
}

// Change direction without allowing a reverse move
function changeDirection(newDirection) {
    if (gameState !== "running") return;

    if (
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y
    ) {
        return;
    }

    nextDirection = newDirection;
}

// Keyboard controls
document.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();

    const keyDirections = {
        arrowup:    { x: 0, y: -1 },
        w:          { x: 0, y: -1 },
        arrowdown:  { x: 0, y: 1 },
        s:          { x: 0, y: 1 },
        arrowleft:  { x: -1, y: 0 },
        a:          { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d:          { x: 1, y: 0 }
    };

    if (keyDirections[key]) {
        event.preventDefault();

        if (gameState === "ready") {
            startGame();
        }

        changeDirection(keyDirections[key]);
    }

    if (key === " " || key === "escape") {
        event.preventDefault();
        togglePause();
    }
});

// Mobile controls
document.querySelectorAll("[data-direction]").forEach(button => {
    button.addEventListener("click", function() {
        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        if (gameState === "ready") {
            startGame();
        }

        changeDirection(directions[button.dataset.direction]);
    });
});

// Main buttons
startButton.addEventListener("click", function() {
    if (gameState === "paused") {
        togglePause();
    } else {
        startGame();
    }
});

pauseButton.addEventListener("click", togglePause);

restartButton.addEventListener("click", startGame);

// Initial screen
snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
];

direction = { x: 1, y: 0 };
nextDirection = { x: 1, y: 0 };

generateFood();
render();
