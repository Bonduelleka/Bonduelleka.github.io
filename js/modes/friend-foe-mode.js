class FriendFoeMode extends GameMode {
    constructor() {
        super(
            'Свой-чужой',
            'Раздели фигуру так, чтобы флаги разных команд не оказались на одной части'
        );

        this.cuttingSystem = null;
        this.shapeGenerator = null;
        this.flagSystem = null;
        this.gameState = {
            level: 1,
            score: 0,
            cutsMade: 0,
            maxCuts: 5,
            targetTeams: 2, // Количество команд на уровне
            currentConflicts: 0,
            isComplete: false,
            timeLeft: 300
        };
        this.conflictShapes = new Set(); // ID фигур с конфликтами
        this.initialShape = null;
        this.initialFlags = null;
    }

    init(canvas, width, height) {
        super.init(canvas);

        this.cuttingSystem = new CuttingSystem(canvas);
        this.shapeGenerator = new ShapeGenerator(width, height);
        this.flagSystem = new FlagSystem();

        // Настраиваем колбэки
        this.cuttingSystem.setOnCutCallback(this.onCutMade.bind(this));
        this.cuttingSystem.setOnShapeHover(this.onShapeHover.bind(this));
        this.cuttingSystem.setOnShapeLeave(this.onShapeLeave.bind(this));

        // Начинаем уровень
        this.startLevel();

        // Запускаем собственную анимацию для отрисовки флагов
        this.animate();
    }

    startLevel() {
        console.log(`Starting Friend-Foe mode level ${this.gameState.level}`);

        // Очищаем системы
        this.cuttingSystem.clear();
        this.flagSystem.clear();
        this.conflictShapes.clear();

        // Сбрасываем счётчики
        this.gameState.cutsMade = 0;
        this.gameState.currentConflicts = 0;
        this.gameState.isComplete = false;

        // Генерация параметров
        this.generateLevelParameters();

        // Генерация фигуры
        const shape = this.shapeGenerator.generateRandomShape(Math.min(this.gameState.level, 3));

        // СОХРАНЯЕМ КОПИЮ фигуры для восстановления
        this.initialShape = this.cloneShape(shape);

        // Устанавливаем фигуру
        this.cuttingSystem.setShapes([shape]);

        // Добавляем флаги
        this.addFlagsToShape(shape);

        // СОХРАНЯЕМ КОПИЮ флагов
        this.initialFlags = this.cloneFlags(this.flagSystem.flags);

        // Проверяем начальное состояние
        this.updateConflicts();

        // Обновляем UI
        this.updateUI();
    }

    cloneShape(shape) {
        return {
            points: shape.points.map(p => ({ x: p.x, y: p.y })),
            color: shape.color,
            id: shape.id
        };
    }

    cloneFlags(flags) {
        return flags.map(flag => ({
            x: flag.x,
            y: flag.y,
            color: flag.color,
            team: flag.team,
            height: flag.height,
            flagWidth: flag.flagWidth,
            poleWidth: flag.poleWidth,
            poleHeight: flag.poleHeight
        }));
    }

    generateLevelParameters() {
        // Базовые параметры
        const baseCuts = 5;
        const baseTeams = 2;

        // Увеличиваем сложность с уровнем
        this.gameState.maxCuts = Math.max(2, baseCuts - Math.floor(this.gameState.level / 2));
        this.gameState.targetTeams = Math.min(4, baseTeams + Math.floor((this.gameState.level - 1) / 3));
    }

    addFlagsToShape(shape) {
        // Количество флагов зависит от уровня и количества команд
        const minFlags = 3 + this.gameState.level;
        const maxFlags = 6 + this.gameState.level * 2;
        const numFlags = Math.floor(Math.random() * (maxFlags - minFlags + 1)) + minFlags;

        console.log(`Adding ${numFlags} flags for ${this.gameState.targetTeams} teams`);

        // Распределяем флаги по командам
        const flagsPerTeam = Math.ceil(numFlags / this.gameState.targetTeams);

        for (let teamId = 1; teamId <= this.gameState.targetTeams; teamId++) {
            const flagsToAdd = Math.min(flagsPerTeam, numFlags - ((teamId - 1) * flagsPerTeam));

            for (let i = 0; i < flagsToAdd; i++) {
                this.flagSystem.addRandomFlag(shape, teamId);
            }
        }

        // Перемешиваем флаги для случайного распределения
        this.flagSystem.flags.sort(() => Math.random() - 0.5);
    }

    onCutMade(newShapeCount) {
        if (!this.isActive) return;

        this.gameState.cutsMade++;

        // Обновляем проверку конфликтов после разреза
        this.updateConflicts();

        // Проверяем завершение уровня
        this.checkLevelCompletion();

        // Обновляем UI
        this.updateUI();
    }

    updateConflicts() {
        this.conflictShapes.clear();
        this.gameState.currentConflicts = 0;

        // Проверяем все фигуры на конфликты
        for (const shape of this.cuttingSystem.shapes) {
            const conflict = this.flagSystem.checkShapeForConflicts(shape);
            if (conflict && conflict.isConflict) {
                this.conflictShapes.add(shape.id);
                this.gameState.currentConflicts++;

                // Подсвечиваем конфликтные фигуры
                shape.hasConflict = true;
                shape.conflictTeams = conflict.teams;
            } else {
                shape.hasConflict = false;
                shape.conflictTeams = null;
            }
        }
    }

    checkLevelCompletion() {
        const conflictsOk = this.gameState.currentConflicts < 1;
        const cutsOk = this.gameState.cutsMade < this.gameState.maxCuts;

        if (this.gameState.currentConflicts < 1 && this.gameState.cutsMade <= this.gameState.maxCuts) {
            const allShapesOk = this.areAllShapesValid();

            if (allShapesOk || this.gameState.currentConflicts === 0) {
                this.completeLevel();
            } else if (this.gameState.cutsMade == this.gameState.maxCuts) {
                this.failLevel('Закончились разрезы!');
            }
        } else if (this.gameState.cutsMade == this.gameState.maxCuts) {
            this.failLevel('Закончились разрезы!');
        }
    }

    areAllShapesValid() {
        for (const shape of this.cuttingSystem.shapes) {
            const flagsInShape = this.flagSystem.getFlagsInShape(shape);
            if (flagsInShape.length > 0) {
                const firstTeam = flagsInShape[0].team;
                for (const flag of flagsInShape) {
                    if (flag.team !== firstTeam) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    restartLevel() {
        if (!this.initialShape || !this.initialFlags) {
            console.warn('No initial state to restore');
            this.startLevel();
            return;
        }

        console.log('Restarting current level');

        this.cuttingSystem.clear();
        this.flagSystem.clear();
        this.conflictShapes.clear();

        const restoredPoints = this.initialShape.points.map(p => new Point(p.x, p.y));
        const restoredShape = new Shape(restoredPoints, this.initialShape.color);
        restoredShape.id = this.initialShape.id;

        this.cuttingSystem.setShapes([restoredShape]);

        this.flagSystem.clear();
        for (const flagData of this.initialFlags) {
            const flag = new Flag(flagData.x, flagData.y, flagData.color, flagData.team);
            flag.height = flagData.height;
            flag.flagWidth = flagData.flagWidth;
            flag.poleWidth = flagData.poleWidth;
            flag.poleHeight = flagData.poleHeight;
            this.flagSystem.flags.push(flag);
        }

        this.gameState.cutsMade = 0;
        this.gameState.currentConflicts = 0;
        this.gameState.isComplete = false;

        this.updateConflicts();

        this.updateUI();

        if (window.uiManager) {
            window.uiManager.showMessage('Уровень сброшен', 'info');
        }
    }

    completeLevel() {
        let levelScore = 150;

        const remainingCuts = this.gameState.maxCuts - this.gameState.cutsMade;
        levelScore += remainingCuts * 75;

        const teamBonus = (this.gameState.targetTeams - 1) * 50;
        levelScore += teamBonus;

        this.gameState.score += levelScore;
        this.gameState.level++;

        if (window.uiManager) {
            const message = this.gameState.currentConflicts === 0 ?
                `Идеально! Уровень пройден! +${levelScore} очков` :
                `Уровень пройден! +${levelScore} очков`;
            window.uiManager.showMessage(message, 'success');
        }

        setTimeout(() => this.startLevel(), 1500);
    }

    failLevel(reason) {
        if (window.uiManager) {
            window.uiManager.showMessage(reason, 'error');
        }

        setTimeout(() => this.restartLevel(), 2000);
    }

    onShapeHover(shape) {
        shape.isHovered = true;

        if (shape.hasConflict && shape.conflictTeams) {
            const teamNames = shape.conflictTeams.map(teamId => {
                const team = this.flagSystem.teams.find(t => t.id === teamId);
                return team ? team.name : `Команда ${teamId}`;
            }).join(' и ');

            console.log(`Конфликт: ${teamNames} на одной фигуре`);
        }
    }

    onShapeLeave() {
        for (const shape of this.cuttingSystem.shapes) {
            shape.isHovered = false;
        }
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const shape of this.cuttingSystem.shapes) {
            if (shape.hasConflict) {
                const originalColor = shape.color;
                shape.color = originalColor.replace('0.7', '0.4');
                shape.draw(this.ctx);
                shape.color = originalColor;

                this.ctx.strokeStyle = '#EF4444';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            } else {
                shape.draw(this.ctx);
            }
        }
        this.flagSystem.draw(this.ctx);

        this.cuttingSystem.drawCutLine();

        requestAnimationFrame(() => this.animate());
    }

    updateUI() {
        if (!window.uiManager) return;

        window.uiManager.updateTaskPlates({
            cuts: {
                label: 'Разрезы:',
                value: `${this.gameState.cutsMade}/${this.gameState.maxCuts}`,
                type: 'cuts'
            },
            conflicts: {
                label: 'Конфликты:',
                value: `${this.gameState.currentConflicts}`,
                type: 'conflicts'
            },
            teams: {
                label: 'Команд:',
                value: this.gameState.targetTeams,
                type: 'teams'
            }
        });

        if (window.uiManager.elements.level) {
            window.uiManager.elements.level.textContent = `Уровень ${this.gameState.level}`;
        }
    }

    getGameState() {
        return {
            level: this.gameState.level,
            score: this.gameState.score,
            cuts: `${this.gameState.cutsMade}/${this.gameState.maxCuts}`,
            teams: this.gameState.targetTeams
        };
    }

    cleanup() {
        super.cleanup();
        if (this.cuttingSystem) {
            this.cuttingSystem.clear();
        }
        if (this.flagSystem) {
            this.flagSystem.clear();
        }

        const teamInfo = document.getElementById('teamInfo');
        if (teamInfo) {
            teamInfo.remove();
        }
    }
}