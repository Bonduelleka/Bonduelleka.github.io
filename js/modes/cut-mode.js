class CutMode extends GameMode {
    constructor() {
        super(
            'Разрежь на части', 
            'Раздели фигуру на заданное количество частей за ограниченное число разрезов'
        );
        
        this.cuttingSystem = null;
        this.shapeGenerator = null;
        this.gameState = {
            level: 1,
            score: 0,
            cutsMade: 0,
            maxCuts: 3,
            targetPieces: 4,
            currentPieces: 1,
            timeLeft: 300,
            isComplete: false
        };
    }

    init(canvas) {
        super.init(canvas);
        
        this.cuttingSystem = new CuttingSystem(canvas);
        this.shapeGenerator = new ShapeGenerator(canvas.width, canvas.height);
        
        // Настраиваем колбэки
        this.cuttingSystem.setOnCutCallback(this.onCutMade.bind(this));
        
        // Генерируем первую фигуру
        this.startLevel();
    }

    start() {
        console.log('CutMode started');
        this.animate();
    }

    startLevel() {
        this.gameState.cutsMade = 0;
        this.gameState.currentPieces = 1;
        
        // Генерация параметров уровня
        this.generateLevelParameters();
        
        // Генерация фигуры
        const shape = this.shapeGenerator.generateRandomShape(this.gameState.level);
        this.cuttingSystem.setShapes([shape]);
    }

    generateLevelParameters() {
        this.gameState.targetPieces = Math.floor(3 + this.gameState.level * 1.5);
        this.gameState.maxCuts = Math.max(2, 5 - Math.floor(this.gameState.level / 2));
    }

    onCutMade(cutsMade, newShapeCount) {
        this.gameState.cutsMade++;
        this.gameState.currentPieces = newShapeCount;
        
        // Проверка завершения уровня
        if (this.gameState.currentPieces >= this.gameState.targetPieces) {
            this.completeLevel();
        } else if (this.gameState.cutsMade >= this.gameState.maxCuts) {
            this.failLevel();
        }
        
        // Обновляем UI через глобальный UI менеджер
        if (window.uiManager) {
            window.uiManager.updateTask(
                this.gameState.currentPieces,
                this.gameState.targetPieces,
                this.gameState.cutsMade,
                this.gameState.maxCuts
            );
        }
    }

    completeLevel() {
        this.gameState.level++;
        this.gameState.score += 100;
        
        // Показываем сообщение
        if (window.uiManager) {
            window.uiManager.showMessage(`Уровень ${this.gameState.level-1} пройден!`);
        }
        
        // Запускаем следующий уровень через 1.5 секунды
        setTimeout(() => this.startLevel(), 1500);
    }

    failLevel() {
        if (window.uiManager) {
            window.uiManager.showMessage('Закончились разрезы!', 'error');
        }
        
        // Перезапускаем уровень через 1.5 секунды
        setTimeout(() => this.startLevel(), 1500);
    }

    animate() {
        if (!this.isActive) return;
        
        // Рисуем через cutting system (он уже имеет свою анимацию)
        // Но можем добавить дополнительную отрисовку здесь
        
        requestAnimationFrame(() => this.animate());
    }

    draw() {
        // Дополнительная отрисовка, если нужна
    }

    update() {
        // Обновление логики
    }

    cleanup() {
        super.cleanup();
        if (this.cuttingSystem) {
            this.cuttingSystem.clear();
        }
    }

    getGameState() {
        return {
            level: this.gameState.level,
            score: this.gameState.score,
            parts: `${this.gameState.currentPieces}/${this.gameState.targetPieces}`,
            cuts: `${this.gameState.cutsMade}/${this.gameState.maxCuts}`
        };
    }
}