class Snake {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.container.appendChild(this.canvas);
        
        this.blockSize = 20;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        
        this.score = 0;
        this.onScoreUpdate = null;
        
        this.init();
    }
    
    init() {
        this.snake = [{x: Math.floor(this.cols/2), y: Math.floor(this.rows/2)}];
        this.direction = {x: 1, y: 0};
        this.food = this.spawnFood();
        this.gameOver = false;
        this.speed = 150;
        this.lastUpdate = 0;
        
        this.bindControls();
        this.startGameLoop();
    }
    
    restart() {
        this.score = 0;
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.init();
    }
    
    destroy() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        window.removeEventListener('keydown', this.handleKeyDown);
    }
    
    spawnFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }
    
    update(timestamp) {
        if (this.gameOver) return;
        
        if (timestamp - this.lastUpdate > this.speed) {
            const head = {
                x: this.snake[0].x + this.direction.x,
                y: this.snake[0].y + this.direction.y
            };
            
            // Check collision with walls or border
            if (head.x <= 0 || head.x >= this.cols - 1 || head.y <= 0 || head.y >= this.rows - 1) {
                this.gameOver = true;
                return;
            }
            
            // Check collision with self
            if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                this.gameOver = true;
                return;
            }
            
            this.snake.unshift(head);
            
            // Check if food is eaten
            if (head.x === this.food.x && head.y === this.food.y) {
                this.food = this.spawnFood();
                this.score += 100;
                if (this.onScoreUpdate) {
                    this.onScoreUpdate(this.score);
                }
                // Increase speed
                this.speed = Math.max(50, 150 - Math.floor(this.score / 500) * 10);
            } else {
                this.snake.pop();
            }
            
            this.lastUpdate = timestamp;
        }
        
        this.draw();
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }
    
    draw() {
        // Clear canvas with a lighter background
        this.ctx.fillStyle = '#2d2d2d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw border
        this.ctx.fillStyle = '#1a1a1a';
        // Top border
        this.ctx.fillRect(0, 0, this.canvas.width, this.blockSize);
        // Bottom border
        this.ctx.fillRect(0, this.canvas.height - this.blockSize, this.canvas.width, this.blockSize);
        // Left border
        this.ctx.fillRect(0, 0, this.blockSize, this.canvas.height);
        // Right border
        this.ctx.fillRect(this.canvas.width - this.blockSize, 0, this.blockSize, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach(segment => {
            // Only draw if not in border area
            if (segment.x > 0 && segment.x < this.cols - 1 && segment.y > 0 && segment.y < this.rows - 1) {
                this.ctx.fillRect(
                    segment.x * this.blockSize,
                    segment.y * this.blockSize,
                    this.blockSize - 1,
                    this.blockSize - 1
                );
            }
        });
        
        // Draw food (only if not in border)
        if (this.food.x > 0 && this.food.x < this.cols - 1 && this.food.y > 0 && this.food.y < this.rows - 1) {
            this.ctx.fillStyle = '#FF5252';
            this.ctx.fillRect(
                this.food.x * this.blockSize,
                this.food.y * this.blockSize,
                this.blockSize - 1,
                this.blockSize - 1
            );
        } else {
            // If food spawned in border, respawn it
            this.food = this.spawnFood();
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    bindControls() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        switch(e.keyCode) {
            case 37: // Left
                if (this.direction.x === 0) {
                    this.direction = {x: -1, y: 0};
                }
                break;
            case 38: // Up
                if (this.direction.y === 0) {
                    this.direction = {x: 0, y: -1};
                }
                break;
            case 39: // Right
                if (this.direction.x === 0) {
                    this.direction = {x: 1, y: 0};
                }
                break;
            case 40: // Down
                if (this.direction.y === 0) {
                    this.direction = {x: 0, y: 1};
                }
                break;
            case 82: // R
                this.restart();
                break;
        }
    }
    
    startGameLoop() {
        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }
}

let snakeGame = null;

function initSnake() {
    const container = document.getElementById('gameContainer');
    snakeGame = new Snake(container);
}

function handleSnakeKeyPress(e) {
    if (!snakeGame || snakeGame.gameOver) return;
    
    switch(e.keyCode) {
        case 37: // Left
            if (snakeGame.direction.x === 0) {
                snakeGame.direction = {x: -1, y: 0};
            }
            break;
        case 38: // Up
            if (snakeGame.direction.y === 0) {
                snakeGame.direction = {x: 0, y: -1};
            }
            break;
        case 39: // Right
            if (snakeGame.direction.x === 0) {
                snakeGame.direction = {x: 1, y: 0};
            }
            break;
        case 40: // Down
            if (snakeGame.direction.y === 0) {
                snakeGame.direction = {x: 0, y: 1};
            }
            break;
    }
}
