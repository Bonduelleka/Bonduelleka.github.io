class EasyFlagMode extends FriendFoeMode {
    constructor() {
        super();
        this.name = 'Свой-чужой (Легкий)';
        this.gameState.level = 1;
    }

    completeLevel() {
        let levelScore = 150;

        const remainingCuts = this.gameState.maxCuts - this.gameState.cutsMade;
        levelScore += remainingCuts * 75;

        const teamBonus = (this.gameState.targetTeams - 1) * 50;
        levelScore += teamBonus;

        this.gameState.score += levelScore;

        if (window.uiManager) {
            const message = this.gameState.currentConflicts === 0 ?
                `Идеально! Уровень пройден! +${levelScore} очков` :
                `Уровень пройден! +${levelScore} очков`;
            window.uiManager.showMessage(message, 'success');
        }

        setTimeout(() => this.startLevel(), 1500);
    }
}

class HardFlagMode extends FriendFoeMode {
    constructor() {
        super();
        this.name = 'Свой-чужой (Сложный)';
        this.gameState.level = 2;
    }

    completeLevel() {
        let levelScore = 150;

        const remainingCuts = this.gameState.maxCuts - this.gameState.cutsMade;
        levelScore += remainingCuts * 75;

        const teamBonus = (this.gameState.targetTeams - 1) * 50;
        levelScore += teamBonus;

        this.gameState.score += levelScore;

        if (window.uiManager) {
            const message = this.gameState.currentConflicts === 0 ?
                `Идеально! Уровень пройден! +${levelScore} очков` :
                `Уровень пройден! +${levelScore} очков`;
            window.uiManager.showMessage(message, 'success');
        }

        setTimeout(() => this.startLevel(), 1500);
    }
}