class Tetris {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.container.appendChild(this.canvas);
        
        // Enable smooth scaling
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        
        this.score = 0;
        this.onScoreUpdate = null;
        
        this.colors = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#FFE138', // O
            '#FF8E0D', // S
            '#00E4FF', // T
            '#3877FF'  // Z
        ];
        
        this.pieces = [
            [[1, 1, 1, 1]], // I
            [[2, 0, 0], [2, 2, 2]], // J
            [[0, 0, 3], [3, 3, 3]], // L
            [[4, 4], [4, 4]], // O
            [[0, 5, 5], [5, 5, 0]], // S
            [[0, 6, 0], [6, 6, 6]], // T
            [[7, 7, 0], [0, 7, 7]]  // Z
        ];
        
        this.piece = null;
        this.piecePos = { x: 0, y: 0 };
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.spawnPiece();
        this.gameOver = false;
        this.paused = false;
        
        this.bindControls();
        this.update();
    }
    
    restart() {
        this.score = 0;
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
        this.init();
    }
    
    destroy() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        window.removeEventListener('keydown', this.handleKeyDown);
    }
    
    updateScore(points) {
        this.score += points;
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                this.grid.splice(row, 1);
                this.grid.unshift(Array(this.cols).fill(0));
                linesCleared++;
                row++; // Check the same row again
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800][linesCleared];
            this.updateScore(points);
        }
    }
    
    spawnPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.piece = this.pieces[pieceIndex];
        this.piecePos.x = Math.floor(this.cols / 2) - Math.floor(this.piece[0].length / 2);
        this.piecePos.y = 0;
        
        if (this.collision()) {
            this.gameOver = true;
        }
    }
    
    rotate() {
        const rotated = [];
        for (let i = 0; i < this.piece[0].length; i++) {
            const row = [];
            for (let j = this.piece.length - 1; j >= 0; j--) {
                row.push(this.piece[j][i]);
            }
            rotated.push(row);
        }
        
        const pos = this.piecePos.x;
        let offset = 1;
        this.piece = rotated;
        
        while (this.collision()) {
            this.piecePos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.piece[0].length) {
                this.piece = rotated;
                this.piecePos.x = pos;
                return;
            }
        }
    }
    
    collision() {
        for (let y = 0; y < this.piece.length; y++) {
            for (let x = 0; x < this.piece[y].length; x++) {
                if (this.piece[y][x] !== 0 &&
                    (this.grid[y + this.piecePos.y] &&
                    this.grid[y + this.piecePos.y][x + this.piecePos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge() {
        this.piece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.grid[y + this.piecePos.y][x + this.piecePos.x] = value;
                }
            });
        });
    }
    
    sweep() {
        this.clearLines();
    }
    
    drop() {
        this.piecePos.y++;
        if (this.collision()) {
            this.piecePos.y--;
            this.merge();
            this.sweep();
            this.spawnPiece();
        }
        this.dropCounter = 0;
    }
    
    move(dir) {
        this.piecePos.x += dir;
        if (this.collision()) {
            this.piecePos.x -= dir;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMatrix(this.grid, { x: 0, y: 0 });
        this.drawMatrix(this.piece, this.piecePos);
        
        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Score: ' + this.score, 10, 25);
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(
                        (x + offset.x) * this.blockSize,
                        (y + offset.y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    
                    // Draw block border
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.strokeRect(
                        (x + offset.x) * this.blockSize,
                        (y + offset.y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
            });
        });
    }
    
    update(time = 0) {
        if (this.gameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
        
        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }
    
    bindControls() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleKeyDown(e) {
        if (this.gameOver) return;
        
        switch(e.keyCode) {
            case 37: // Left
                this.move(-1);
                break;
            case 39: // Right
                this.move(1);
                break;
            case 40: // Down
                this.drop();
                break;
            case 38: // Up
                this.rotate();
                break;
            case 82: // R
                this.restart();
                break;
        }
    }
    
    getSaveState() {
        return {
            name: 'Tetris Save',
            grid: this.grid,
            score: this.score,
            piece: this.piece,
            piecePos: this.piecePos,
            timestamp: new Date().toISOString()
        };
    }
    
    loadSaveState(saveState) {
        this.grid = saveState.grid;
        this.score = saveState.score;
        this.piece = saveState.piece;
        this.piecePos = saveState.piecePos;
    }
}

let tetrisGame = null;

function initTetris() {
    const container = document.getElementById('gameContainer');
    tetrisGame = new Tetris(container);
}

function handleTetrisKeyPress(e) {
    if (!tetrisGame || tetrisGame.gameOver) return;
    
    switch(e.keyCode) {
        case 37: // Left
            tetrisGame.move(-1);
            break;
        case 39: // Right
            tetrisGame.move(1);
            break;
        case 40: // Down
            tetrisGame.drop();
            break;
        case 38: // Up
            tetrisGame.rotate();
            break;
    }
}
