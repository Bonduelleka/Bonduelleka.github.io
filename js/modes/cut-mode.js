class CutMode extends GameMode {

    static name = 'Разрежь на части';
    static description = 'Раздели фигуру на заданное количество частей за ограниченное число разрезов';

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
            timeLeft: 100,
            isComplete: false
        };
    }

    init(canvas) {
        super.init(canvas);
        
        this.cuttingSystem = new CuttingSystem(canvas);
        this.shapeGenerator = new ShapeGenerator(canvas.width, canvas.height);

        this.cuttingSystem.setOnCutCallback(this.onCutMade.bind(this));

        window.uiManager.setModeInfo(this.name, this.description);

        this.startLevel();
    }

    start() {
        console.log('CutMode started');
        this.animate();
    }

    startLevel() {
        this.gameState.cutsMade = 0;
        this.gameState.currentPieces = 1;

        this.generateLevelParameters();

        const shape = this.shapeGenerator.generateRandomShape(this.gameState.level / 4);
        this.cuttingSystem.setShapes([shape]);

        if (window.uiManager) {
            window.uiManager.updateTaskPlates({
                parts: {
                    label: 'Части:',
                    value: `${this.gameState.currentPieces}/${this.gameState.targetPieces}`,
                    type: 'parts'
                },
                cuts: {
                    label: 'Разрезы:',
                    value: `${this.gameState.cutsMade}/${this.gameState.maxCuts}`,
                    type: 'cuts'
                }
            });
        }
    }

    generateLevelParameters() {
        switch(this.gameState.level / 4)
        {
            case 1:
                this.gameState.targetPieces = 4;
                this.gameState.maxCuts = 3;
                break;
            case 2:
                this.gameState.targetPieces = 6;
                this.gameState.maxCuts = 4;
                break;
            case 3:
                this.gameState.targetPieces = 10;
                this.gameState.maxCuts = 4;
                break;
        }

    }

    onCutMade(newShapeCount) {
        this.gameState.cutsMade++;
        this.gameState.currentPieces = newShapeCount;

        if (this.gameState.currentPieces >= this.gameState.targetPieces) {
            this.completeLevel();
        } else if (this.gameState.cutsMade >= this.gameState.maxCuts) {
            this.failLevel();
        }

        window.uiManager.updateTaskPlates({
            parts: {
                label: 'Части:',
                value: `${this.gameState.currentPieces}/${this.gameState.targetPieces}`,
                type: 'parts'
            },
            cuts: {
                label: 'Разрезы:',
                value: `${this.gameState.cutsMade}/${this.gameState.maxCuts}`,
                type: 'cuts'
            }
        });

        if (window.uiManager.elements.level) {
            window.uiManager.elements.level.textContent = `Уровень ${this.gameState.level / 4}`;
        }
    }

    completeLevel() {
        this.gameState.level++;
        this.gameState.score += 100;

        if (window.uiManager) {
            window.uiManager.showMessage(`Этап ${this.gameState.level} пройден!`);
        }

        setTimeout(() => this.startLevel(), 1500);
    }

    failLevel() {
        if (window.uiManager) {
            window.uiManager.showMessage('Закончились разрезы!', 'error');
        }

        setTimeout(() => this.startLevel(), 1500);
    }

    animate() {
        if (!this.isActive) return;
        requestAnimationFrame(() => this.animate());
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