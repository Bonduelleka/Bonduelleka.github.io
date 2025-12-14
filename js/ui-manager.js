class UIManager {
    constructor() {
        this.elements = {
            timer: document.getElementById('gameTimer'),
            level: document.getElementById('currentLevel'),
            partsCounter: document.getElementById('partsCounter'),
            cutsCounter: document.getElementById('cutsCounter'),
            overlay: document.getElementById('gameOverlay'),
            resultTitle: document.getElementById('gameResultTitle'),
            finalScore: document.getElementById('finalScore'),
            finalLevels: document.getElementById('finalLevels'),
            finalTime: document.getElementById('finalTime')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Кнопка сброса уровня
        const restartBtn = document.getElementById('restartLevel');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (confirm('Начать уровень заново?')) {
                    if (window.gameManager) {
                        window.gameManager.restartLevel();
                    }
                }
            });
        }

        // Кнопка возврата в меню
        const backBtn = document.getElementById('backToMenu');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Вернуться в главное меню? Текущая игра будет завершена.')) {
                    window.location.href = 'index.html';
                }
            });
        }

        // Кнопки оверлея
        const playAgainBtn = document.getElementById('playAgain');
        const backToMenuBtn = document.getElementById('backToMenuBtn');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                // Перезапускаем игру
                location.reload();
            });
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    updateTimer(seconds) {
        if (!this.elements.timer) return;

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.elements.timer.textContent =
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Предупреждение при малом времени
        if (seconds <= 30) {
            this.elements.timer.classList.add('warning');
        } else {
            this.elements.timer.classList.remove('warning');
        }
    }

    updateTask(currentParts, targetParts, currentCuts, maxCuts) {
        if (this.elements.partsCounter) {
            this.elements.partsCounter.textContent = `${currentParts}/${targetParts}`;
        }
        if (this.elements.cutsCounter) {
            this.elements.cutsCounter.textContent = `${currentCuts}/${maxCuts}`;
        }
    }

    setModeInfo(name, description) {
        const modeTitle = document.querySelector('.mode-title');
        const modeDesc = document.querySelector('.mode-description');

        if (modeTitle) modeTitle.textContent = name;
        if (modeDesc) modeDesc.innerHTML = `<p>${description}</p>`;
    }

    showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `game-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            background: ${type === 'success' ? '#48bb78' : '#e53e3e'};
            color: white;
            border-radius: 10px;
            font-weight: 600;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 2000);
    }

    showResults(title, score, levels, timeSeconds) {
        if (this.elements.resultTitle) this.elements.resultTitle.textContent = title;
        if (this.elements.finalScore) this.elements.finalScore.textContent = score;
        if (this.elements.finalLevels) this.elements.finalLevels.textContent = levels;

        if (this.elements.finalTime) {
            const minutes = Math.floor(timeSeconds / 60);
            const seconds = timeSeconds % 60;
            this.elements.finalTime.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (this.elements.overlay) {
            this.elements.overlay.classList.add('active');
        }
    }
}