// DOM Elements
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('.nav-btn');
const modal = document.getElementById('gameModal');
const closeBtn = document.querySelector('.close-btn');
const gameContainer = document.getElementById('gameContainer');
const restartBtn = document.getElementById('restartBtn');
const currentScoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');
const gameFileInput = document.getElementById('gameFileInput');

// Auth Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const username = document.getElementById('username');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Game State
let currentGame = null;
let currentUser = null;
let gameInstance = null;
let currentScore = 0;
let userGames = [];

// User Management
function loadUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        updateProgressUI();
        updateUserGames();
    }
}

function updateUserUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        username.textContent = currentUser.username;
        updateHighScore();
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userInfo.style.display = 'none';
        username.textContent = '';
    }
}

function updateProgressUI() {
    if (!currentUser) {
        document.getElementById('totalGamesPlayed').textContent = 'Total Games Played: 0';
        document.getElementById('totalScore').textContent = 'Total Score: 0';
        document.getElementById('tetrisPlayed').textContent = '0';
        document.getElementById('tetrisHighScore').textContent = '0';
        document.getElementById('tetrisLastPlayed').textContent = 'Never';
        document.getElementById('snakePlayed').textContent = '0';
        document.getElementById('snakeHighScore').textContent = '0';
        document.getElementById('snakeLastPlayed').textContent = 'Never';
        return;
    }

    const stats = currentUser.stats || {
        tetris: { played: 0, highScore: 0, lastPlayed: null },
        snake: { played: 0, highScore: 0, lastPlayed: null }
    };

    const totalGames = stats.tetris.played + stats.snake.played;
    const totalScore = stats.tetris.highScore + stats.snake.highScore;

    document.getElementById('totalGamesPlayed').textContent = `Total Games Played: ${totalGames}`;
    document.getElementById('totalScore').textContent = `Total Score: ${totalScore}`;

    document.getElementById('tetrisPlayed').textContent = stats.tetris.played;
    document.getElementById('tetrisHighScore').textContent = stats.tetris.highScore;
    document.getElementById('tetrisLastPlayed').textContent = stats.tetris.lastPlayed ? new Date(stats.tetris.lastPlayed).toLocaleDateString() : 'Never';

    document.getElementById('snakePlayed').textContent = stats.snake.played;
    document.getElementById('snakeHighScore').textContent = stats.snake.highScore;
    document.getElementById('snakeLastPlayed').textContent = stats.snake.lastPlayed ? new Date(stats.snake.lastPlayed).toLocaleDateString() : 'Never';
}

function login(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === userData.username && u.password === userData.password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUserUI();
        updateProgressUI();
        updateUserGames();
        closeAuthModals();
        return true;
    }
    return false;
}

function register(userData) {
    if (userData.password !== userData.confirmPassword) {
        return false;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.username === userData.username)) {
        return false;
    }
    
    const newUser = {
        username: userData.username,
        password: userData.password,
        scores: { tetris: 0, snake: 0 },
        stats: {
            tetris: { played: 0, highScore: 0, lastPlayed: null },
            snake: { played: 0, highScore: 0, lastPlayed: null }
        }
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    updateUserUI();
    updateProgressUI();
    updateUserGames();
    closeAuthModals();
    return true;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
}

// Score Management
function updateScore(score) {
    currentScore = score;
    if (currentScoreElement) {
        currentScoreElement.textContent = `Score: ${score}`;
    }

    if (currentUser && currentGame) {
        if (!currentUser.stats) {
            currentUser.stats = {
                tetris: { played: 0, highScore: 0, lastPlayed: null },
                snake: { played: 0, highScore: 0, lastPlayed: null }
            };
        }

        const gameStats = currentUser.stats[currentGame];
        gameStats.highScore = Math.max(gameStats.highScore, score);
        gameStats.lastPlayed = new Date().toISOString();
        gameStats.played++;

        // Update local storage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update UI
        updateProgressUI();
        updateHighScore();

        // Save to cloud (if user is logged in)
        if (currentUser) {
            const saves = JSON.parse(localStorage.getItem('gameSaves') || '[]');
            const newSave = {
                id: Date.now(),
                game: currentGame,
                score: score,
                date: new Date().toISOString(),
                user: currentUser.username
            };
            saves.push(newSave);
            localStorage.setItem('gameSaves', JSON.stringify(saves));
            updateSavesList(saves);
        }
    }
}

function updateHighScore() {
    if (currentUser && currentGame && highScoreElement) {
        const gameStats = currentUser.stats?.[currentGame] || { highScore: 0 };
        highScoreElement.textContent = `High Score: ${gameStats.highScore}`;
    } else {
        highScoreElement.textContent = 'High Score: 0';
    }
}

// Game Management
function startGame(gameType) {
    if (!currentUser) {
        alert('Please login to play games');
        return;
    }

    currentGame = gameType;
    gameContainer.className = gameType;
    openModal();
    updateHighScore();
    
    // Update game stats
    currentUser.stats = currentUser.stats || {
        tetris: { played: 0, highScore: 0, lastPlayed: null },
        snake: { played: 0, highScore: 0, lastPlayed: null }
    };
    
    currentUser.stats[gameType].played++;
    currentUser.stats[gameType].lastPlayed = new Date().toISOString();
    
    // Save updated stats
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    updateProgressUI();
    
    if (gameType === 'tetris') {
        gameInstance = new Tetris(gameContainer);
        gameInstance.onScoreUpdate = updateScore;
    } else if (gameType === 'snake') {
        gameInstance = new Snake(gameContainer);
        gameInstance.onScoreUpdate = updateScore;
    }
}

function restartGame() {
    if (gameInstance && gameInstance.restart) {
        gameInstance.restart();
        currentScoreElement.textContent = 0;
    }
}

// Modal Controls
function openModal() {
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    gameContainer.innerHTML = '';
    if (gameInstance && gameInstance.destroy) {
        gameInstance.destroy();
    }
    gameInstance = null;
}

function closeAuthModals() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    // Clear form inputs
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regConfirmPassword').value = '';
    // Return to games section
    navButtons.forEach(btn => btn.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    const gamesButton = document.querySelector('[data-section="games"]');
    const gamesSection = document.getElementById('games');
    gamesButton.classList.add('active');
    gamesSection.classList.add('active');
}

// Event Listeners
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetSection = button.dataset.section;
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetSection) {
                section.classList.add('active');
            }
        });
    });
});

closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

restartBtn.addEventListener('click', restartGame);

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

logoutBtn.addEventListener('click', logout);

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userData = {
        username: document.getElementById('loginUsername').value,
        password: document.getElementById('loginPassword').value
    };
    if (login(userData)) {
        loginForm.reset();
    } else {
        alert('Invalid username or password');
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userData = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        confirmPassword: document.getElementById('regConfirmPassword').value
    };
    if (register(userData)) {
        registerForm.reset();
    } else {
        alert('Registration failed. Please check your inputs.');
    }
});

gameFileInput.addEventListener('change', handleGameUpload);

// Add event listeners for auth modal close buttons
document.querySelectorAll('.auth-modal .close-btn').forEach(btn => {
    btn.addEventListener('click', closeAuthModals);
});

// Close auth modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal || e.target === registerModal) {
        closeAuthModals();
    }
});

// Game Upload and Management
function handleGameUpload(event) {
    if (!currentUser) {
        alert('Please log in to upload games');
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const gameCode = e.target.result;
        const gameName = file.name.replace('.js', '');
        
        // Store the game in local storage (simulating cloud storage)
        if (!currentUser.games) {
            currentUser.games = [];
        }

        const gameData = {
            id: Date.now(),
            name: gameName,
            code: gameCode,
            uploadDate: new Date().toISOString(),
            lastPlayed: null,
            highScore: 0
        };

        currentUser.games.push(gameData);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        updateUserGames();
        alert('Game uploaded successfully!');
    };

    reader.readAsText(file);
}

function updateUserGames() {
    if (!currentUser || !currentUser.games) return;

    const gamesContainer = document.querySelector('.user-games-container');
    if (!gamesContainer) {
        const gamesSection = document.createElement('div');
        gamesSection.className = 'user-games-container';
        gamesSection.innerHTML = `
            <h2>Your Uploaded Games</h2>
            <div class="user-games-grid"></div>
        `;
        document.querySelector('#games').appendChild(gamesSection);
    }

    const gamesGrid = document.querySelector('.user-games-grid');
    gamesGrid.innerHTML = '';

    currentUser.games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'user-game-card';
        gameCard.innerHTML = `
            <div class="user-game-info">
                <h3>${game.name}</h3>
                <p>Uploaded: ${new Date(game.uploadDate).toLocaleDateString()}</p>
                <p>High Score: ${game.highScore}</p>
            </div>
            <div class="user-game-actions">
                <button class="user-game-button play" onclick="playUserGame(${game.id})">Play</button>
                <button class="user-game-button delete" onclick="deleteUserGame(${game.id})">Delete</button>
            </div>
        `;
        gamesGrid.appendChild(gameCard);
    });
}

function playUserGame(gameId) {
    if (!currentUser || !currentUser.games) return;

    const game = currentUser.games.find(g => g.id === gameId);
    if (!game) return;

    // Create a temporary script element with the game code
    const script = document.createElement('script');
    script.textContent = game.code;
    document.body.appendChild(script);

    // Update last played
    game.lastPlayed = new Date().toISOString();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Start the game
    openModal();
    currentGame = game.name;
    if (typeof window[game.name] === 'function') {
        gameInstance = new window[game.name](gameContainer);
        if (gameInstance.onScoreUpdate) {
            gameInstance.onScoreUpdate = updateScore;
        }
    }
}

function deleteUserGame(gameId) {
    if (!currentUser || !currentUser.games) return;

    if (confirm('Are you sure you want to delete this game?')) {
        currentUser.games = currentUser.games.filter(g => g.id !== gameId);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        updateUserGames();
    }
}

// Save File Management
function uploadSave() {
    const fileInput = document.getElementById('saveFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to upload');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const saveData = JSON.parse(e.target.result);
            // Store save data (implement storage logic here)
            updateSavesList(saveData);
            alert('Save file uploaded successfully!');
        } catch (error) {
            alert('Error reading save file. Please ensure it is a valid JSON file.');
        }
    };
    reader.readAsText(file);
}

function updateSavesList(saveData) {
    const savesList = document.getElementById('savesList');
    const saveElement = document.createElement('div');
    saveElement.className = 'save-item';
    saveElement.innerHTML = `
        <span>${saveData.name || 'Unnamed Save'}</span>
        <button onclick="downloadSave(${JSON.stringify(saveData)})">Download</button>
        <button onclick="deleteSave(this)">Delete</button>
    `;
    savesList.appendChild(saveElement);
}

function downloadSave(saveData) {
    const dataStr = JSON.stringify(saveData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `${saveData.name || 'game'}_save.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

function deleteSave(element) {
    if (confirm('Are you sure you want to delete this save?')) {
        element.parentElement.remove();
    }
}

// Handle keyboard events for games
document.addEventListener('keydown', (e) => {
    if (currentGame === 'tetris') {
        handleTetrisKeyPress(e);
    } else if (currentGame === 'snake') {
        handleSnakeKeyPress(e);
    }
});

// Prevent space and arrow keys from scrolling the page during gameplay
window.addEventListener('keydown', (e) => {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1 && currentGame) {
        e.preventDefault();
    }
});

// Initialize
loadUser();
updateUserGames();
