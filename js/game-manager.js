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
        this.timeLeft = 300;

        // Инициализируем размеры
        this.setupCanvas();

        // Слушаем изменение размера окна
        window.addEventListener('resize', () => this.handleResize());

        this.registerModes();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        // Устанавливаем начальный размер
        this.resizeCanvas();

        // Гарантируем, что канвас виден
        this.canvas.style.display = 'block';
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        // Получаем доступное пространство
        const containerStyle = window.getComputedStyle(container);
        const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
        const paddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);

        const maxWidth = container.clientWidth - paddingX;
        const maxHeight = container.clientHeight - paddingY;

        // Сохраняем пропорции 4:3 (как в исходном дизайне 800x600)
        const targetAspectRatio = 4/3;
        const currentAspectRatio = maxWidth / maxHeight;

        let width, height;

        if (currentAspectRatio > targetAspectRatio) {
            // Шире чем нужно - ограничиваем по высоте
            height = maxHeight;
            width = height * targetAspectRatio;
        } else {
            // Уже чем нужно - ограничиваем по ширине
            width = maxWidth;
            height = width / targetAspectRatio;
        }

        // Устанавливаем размеры
        this.canvas.width = Math.floor(width);
        this.canvas.height = Math.floor(height);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        console.log(`Canvas resized to: ${width}x${height}`);

        // Если есть активный режим - сообщаем ему об изменении размера
        if (this.currentMode && this.currentMode.onResize) {
            this.currentMode.onResize(width, height);
        }
    }

    handleResize() {
        // Дебаунс ресайза для производительности
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.resizeCanvas();
        }, 250);
    }

    registerModes() {
        // Регистрируем все доступные режимы
        this.modes = {
            'cut': CutMode,
            'friend-foe': FriendFoeMode
            // 'future': FutureMode - добавишь позже
        };
    }

    startGame(modeName) {
        console.log(`Starting game mode: ${modeName}`);

        // Останавливаем предыдущий режим, если есть
        if (this.currentMode) {
            this.currentMode.cleanup();
        }

        // Создаём новый режим
        const ModeClass = this.modes[modeName];
        if (!ModeClass) {
            console.error(`Mode ${modeName} not found!`);
            return;
        }

        this.currentMode = new ModeClass();
        this.currentMode.init(this.canvas, this.canvas.width, this.canvas.height);
        this.currentMode.start();

        // Запускаем таймер
        this.startTimer();

        // Обновляем UI
        if (window.uiManager) {
            window.uiManager.setModeInfo(this.currentMode.name, this.currentMode.description);
            this.updateUIFromMode();
        }
    }

    startTimer() {
        clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeLeft--;

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.finishGame('Время вышло!');
            }

            // Обновляем таймер в UI
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

            // Сохраняем в рейтинг
            const ratingSystem = new RatingSystem();
            const nickname = localStorage.getItem('game_nickname');
            ratingSystem.saveRating('cut', nickname, score);

            // Показываем результаты
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

    updateUIFromMode() {
        if (!this.currentMode || !window.uiManager) return;

        const state = this.currentMode.getGameState();
        if (state) {
            window.uiManager.updateTask(
                state.currentPieces,
                state.targetPieces,
                state.cutsMade,
                state.maxCuts
            );

            if (state.level && window.uiManager.elements.level) {
                window.uiManager.elements.level.textContent = `Уровень ${state.level}`;
            }
        }
    }
}