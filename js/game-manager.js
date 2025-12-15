class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.currentMode = null;
        this.modes = {};
        this.timer = null;
        this.timeLeft = 40;

        this.setupCanvas();

        window.addEventListener('resize', () => this.handleResize());

        this.registerModes();
        this.setupKeyboard();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        this.resizeCanvas();

        this.canvas.style.display = 'block';
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerStyle = window.getComputedStyle(container);
        const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
        const paddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);

        const maxWidth = container.clientWidth - paddingX;
        const maxHeight = container.clientHeight - paddingY;

        const targetAspectRatio = 4/3;
        const currentAspectRatio = maxWidth / maxHeight;

        let width, height;

        if (currentAspectRatio > targetAspectRatio) {
            height = maxHeight;
            width = height * targetAspectRatio;
        } else {
            width = maxWidth;
            height = width / targetAspectRatio;
        }

        this.canvas.width = Math.floor(width);
        this.canvas.height = Math.floor(height);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        console.log(`Canvas resized to: ${width}x${height}`);

        if (this.currentMode && this.currentMode.onResize) {
            this.currentMode.onResize(width, height);
        }
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch(e.key.toLowerCase()) {
                case 'r':
                    this.handleRestartKey();
                    break;
                case 'm':
                    this.toggleSound();
                    break;
                case 'escape':
                    this.handleEscape();
                    break;
            }
        });
    }

    handleRestartKey() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay && overlay.classList.contains('active')) return;

        if (window.audioManager) {
            window.audioManager.play('click');
        }

        if (confirm('Перезапустить уровень? (R)')) {
            this.restartLevel();
        }
    }

    toggleSound() {
        if (window.audioManager) {
            const isMuted = window.audioManager.toggleMute();
            if (window.uiManager) {
                window.uiManager.showMessage(
                    isMuted ? 'Звук выключен' : 'Звук включен',
                    'info'
                );
            }
        }
    }

    handleEscape() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay && overlay.classList.contains('active')) {
            window.location.href = 'index.html';
        } else {
            if (confirm('Вернуться в главное меню? (ESC)')) {
                window.location.href = 'index.html';
            }
        }
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.resizeCanvas();
        }, 250);
    }

    registerModes() {
        this.modes = {
            'cut': CutMode,
            'friend-foe': FriendFoeMode
        };
    }

    startGame(modeName) {
        console.log(`Starting game mode: ${modeName}`);

        if (this.currentMode) {
            this.currentMode.cleanup();
        }

        const ModeClass = this.modes[modeName];
        if (!ModeClass) {
            console.error(`Mode ${modeName} not found!`);
            return;
        }

        this.currentMode = new ModeClass();
        this.currentMode.init(this.canvas, this.canvas.width, this.canvas.height);
        this.currentMode.start();

        this.startTimer();
    }

    startTimer() {
        clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeLeft--;

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.finishGame('Время вышло!');
            }

            if (window.uiManager) {
                window.uiManager.updateTimer(this.timeLeft);
            }
        }, 1000);
    }

    finishGame(reason) {
        clearInterval(this.timer);

        if (this.currentMode) {
            const score = this.currentMode.gameState.score;
            const level = this.currentMode.gameState.level;

            const ratingSystem = new RatingSystem();
            const nickname = localStorage.getItem('game_nickname');
            ratingSystem.saveRating('cut', nickname, score);

            if (window.uiManager) {
                window.uiManager.showResults(reason, score, level, 300 - this.timeLeft);
            }
        }
    }

    restartLevel() {
        if (this.currentMode && this.currentMode.restartLevel) {
            this.currentMode.restartLevel();
        }
    }

    cleanup() {
        if (this.currentMode) {
            this.currentMode.cleanup();
        }
        clearInterval(this.timer);
    }
}