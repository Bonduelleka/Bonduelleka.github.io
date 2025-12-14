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
            maxConflictsAllowed: 0, // Максимально допустимое количество конфликтных фигур
            isComplete: false,
            timeLeft: 300
        };
        this.conflictShapes = new Set(); // ID фигур с конфликтами
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

        this.cuttingSystem.clear();
        this.flagSystem.clear();
        this.conflictShapes.clear();
        this.gameState.cutsMade = 0;
        this.gameState.currentConflicts = 0;

        // Генерация параметров в зависимости от уровня
        this.generateLevelParameters();

        // Генерация фигуры
        const shape = this.shapeGenerator.generateRandomShape(Math.min(this.gameState.level, 3));
        this.cuttingSystem.setShapes([shape]);

        // Добавляем флаги
        this.addFlagsToShape(shape);

        // Проверяем начальное состояние
        this.updateConflicts();

        // Обновляем UI
        this.updateUI();
    }

    generateLevelParameters() {
        // Базовые параметры
        const baseCuts = 5;
        const baseTeams = 2;
        const baseConflictsAllowed = 1;

        // Увеличиваем сложность с уровнем
        this.gameState.maxCuts = Math.max(2, baseCuts - Math.floor(this.gameState.level / 2));
        this.gameState.targetTeams = Math.min(4, baseTeams + Math.floor((this.gameState.level - 1) / 3));
        this.gameState.maxConflictsAllowed = Math.max(0, baseConflictsAllowed - Math.floor(this.gameState.level / 4));

        console.log(`Level ${this.gameState.level}: teams=${this.gameState.targetTeams}, cuts=${this.gameState.maxCuts}, conflicts=${this.gameState.maxConflictsAllowed}`);
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

    onCutMade(cutsMade, newShapeCount) {
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
        // Уровень пройден, если:
        // 1. Нет конфликтов ИЛИ количество конфликтов в пределах допустимого
        // 2. Не превышено максимальное количество разрезов

        const conflictsOk = this.gameState.currentConflicts <= this.gameState.maxConflictsAllowed;
        const cutsOk = this.gameState.cutsMade <= this.gameState.maxCuts;

        if (conflictsOk && cutsOk) {
            // Дополнительная проверка: если все флаги изолированы по командам
            const allShapesOk = this.areAllShapesValid();

            if (allShapesOk || this.gameState.currentConflicts === 0) {
                this.completeLevel();
            }
        } else if (!cutsOk) {
            this.failLevel('Закончились разрезы!');
        }
    }

    areAllShapesValid() {
        // Проверяем, что в каждой фигуре флаги только одной команды
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

    completeLevel() {
        // Расчёт очков
        let levelScore = 150; // Базовые очки больше чем в обычном режиме

        // Бонус за оставшиеся разрезы
        const remainingCuts = this.gameState.maxCuts - this.gameState.cutsMade;
        levelScore += remainingCuts * 75;

        // Бонус за отсутствие конфликтов
        if (this.gameState.currentConflicts === 0) {
            levelScore += 100;
        }

        // Бонус за сложность (больше команд = сложнее)
        const teamBonus = (this.gameState.targetTeams - 1) * 50;
        levelScore += teamBonus;

        this.gameState.score += levelScore;
        this.gameState.level++;

        // Показываем сообщение
        if (window.uiManager) {
            const message = this.gameState.currentConflicts === 0 ?
                `Идеально! Уровень пройден! +${levelScore} очков` :
                `Уровень пройден! +${levelScore} очков`;
            window.uiManager.showMessage(message, 'success');
        }

        // Запускаем следующий уровень через 1.5 секунды
        setTimeout(() => this.startLevel(), 1500);
    }

    failLevel(reason) {
        if (window.uiManager) {
            window.uiManager.showMessage(reason, 'error');
        }

        // Перезапускаем уровень через 2 секунды
        setTimeout(() => this.startLevel(), 2000);
    }

    onShapeHover(shape) {
        // Подсвечиваем фигуру при наведении
        shape.isHovered = true;

        // Если есть конфликт, показываем информацию
        if (shape.hasConflict && shape.conflictTeams) {
            const teamNames = shape.conflictTeams.map(teamId => {
                const team = this.flagSystem.teams.find(t => t.id === teamId);
                return team ? team.name : `Команда ${teamId}`;
            }).join(' и ');

            // Можно добавить всплывающую подсказку
            console.log(`Конфликт: ${teamNames} на одной фигуре`);
        }
    }

    onShapeLeave() {
        // Убираем подсветку со всех фигур
        for (const shape of this.cuttingSystem.shapes) {
            shape.isHovered = false;
        }
    }

    animate() {
        if (!this.isActive) return;

        // Очищаем канвас
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем фон
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем фигуры через cutting system
        for (const shape of this.cuttingSystem.shapes) {
            // Модифицируем цвет для конфликтных фигур
            if (shape.hasConflict) {
                const originalColor = shape.color;
                // Делаем цвет более прозрачным и добавляем красный оттенок
                shape.color = originalColor.replace('0.7', '0.4');
                shape.draw(this.ctx);
                shape.color = originalColor; // Восстанавливаем цвет

                // Добавляем красную обводку для конфликтных фигур
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

        // Рисуем флаги поверх фигур
        this.flagSystem.draw(this.ctx);

        // Рисуем линию разреза (если есть)
        this.cuttingSystem.drawCutLine();

        // Запрашиваем следующий кадр
        requestAnimationFrame(() => this.animate());
    }

    updateUI() {
        if (!window.uiManager) return;

        window.uiManager.updateTask(
            this.gameState.currentConflicts,
            this.gameState.maxConflictsAllowed,
            this.gameState.cutsMade,
            this.gameState.maxCuts
        );

        // Обновляем уровень
        if (window.uiManager.elements.level) {
            window.uiManager.elements.level.textContent = `Уровень ${this.gameState.level}`;
        }

        // Показываем информацию о командах
        this.showTeamInfo();
    }

    showTeamInfo() {
        // Создаём или обновляем блок с информацией о командах
        let teamInfo = document.getElementById('teamInfo');
        if (!teamInfo) {
            teamInfo = document.createElement('div');
            teamInfo.id = 'teamInfo';
            teamInfo.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                font-size: 12px;
                z-index: 100;
            `;
            document.querySelector('.game-center').appendChild(teamInfo);
        }

        // Формируем информацию о командах
        let html = '<strong>Команды:</strong><br>';
        for (let i = 0; i < this.gameState.targetTeams; i++) {
            const team = this.flagSystem.teams[i];
            if (team) {
                const count = this.flagSystem.getFlagsByTeam(team.id).length;
                html += `<span style="color:${team.color}">● ${team.name}: ${count}</span><br>`;
            }
        }

        // Добавляем информацию о конфликтах
        if (this.gameState.currentConflicts > 0) {
            html += `<br><strong style="color:#EF4444">Конфликтов: ${this.gameState.currentConflicts}</strong>`;
        }

        teamInfo.innerHTML = html;
    }

    getGameState() {
        return {
            level: this.gameState.level,
            score: this.gameState.score,
            conflicts: `${this.gameState.currentConflicts}/${this.gameState.maxConflictsAllowed}`,
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

        // Удаляем блок с информацией о командах
        const teamInfo = document.getElementById('teamInfo');
        if (teamInfo) {
            teamInfo.remove();
        }
    }
}