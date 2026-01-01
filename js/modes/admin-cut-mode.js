class EasyCutMode extends CutMode {
    constructor() {
        super();
        this.name = 'Разрежь на части (Легкий)';
        this.gameState.level = 1;
    }

    completeLevel() {
        this.gameState.score += 100;

        if (window.uiManager) {
            window.uiManager.showMessage(`Уровень ${this.gameState.level} пройден!`);
        }

        setTimeout(() => this.startLevel(), 1500);
    }
}

class HardCutMode extends CutMode {
    constructor() {
        super();
        this.name = 'Разрежь на части (Сложный)';
        this.gameState.level = 2;
    }

    completeLevel() {
        this.gameState.score += 100;

        if (window.uiManager) {
            window.uiManager.showMessage(`Уровень ${this.gameState.level} пройден!`);
        }

        setTimeout(() => this.startLevel(), 1500);
    }
}

class ExtremeCutMode extends CutMode {
    constructor() {
        super();
        this.name = 'Разрежь на части (Экстремальный)';
        this.gameState.level = 3;
    }

    completeLevel() {
        this.gameState.score += 100;

        if (window.uiManager) {
            window.uiManager.showMessage(`Уровень ${this.gameState.level} пройден!`);
        }

        setTimeout(() => this.startLevel(), 1500);
    }
}