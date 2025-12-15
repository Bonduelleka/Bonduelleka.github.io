class MainMenu {
    constructor() {
        this.currentMode = 'cut';
        this.nickname = localStorage.getItem('game_nickname') || '';
        this.ratingSystem = new RatingSystem();

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRating();
        this.updateUI();
    }

    bindEvents() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () =>
            {
                if (window.audioManager) window.audioManager.play('click');
                this.selectMode(btn.dataset.mode)
            });
        });

        document.getElementById('saveNickname').addEventListener('click', () => {
            if (window.audioManager) window.audioManager.play('click');
            this.saveNickname();
        });
        document.getElementById('nickname').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveNickname();
        });

        document.getElementById('startGame').addEventListener('click', () => {
            if (window.audioManager) window.audioManager.play('click');
            this.startGame();
        });

        document.getElementById('nickname').addEventListener('input', () => {
            this.updateStartButton();
        });
    }

    selectMode(mode) {
        if (mode === 'coming-soon') return;

        this.currentMode = mode;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const modeNames = {
            'cut': 'Разрежь на части',
            'future': 'Будущий режим'
        };

        document.getElementById('ratingMode').textContent = modeNames[mode] || mode;
        document.querySelector('.selected-mode').textContent = `(${modeNames[mode] || mode})`;

        this.loadRating();
        this.updateStartButton();
    }

    getModeName(mode) {
        const modes = {
            'cut': 'Разрежь на части',
            'friend-foe': 'Свой-чужой',
            'coming-soon': 'Скоро...'
        };
        return modes[mode] || 'Неизвестный режим';
    }

    saveNickname() {
        const input = document.getElementById('nickname');
        const nickname = input.value.trim();

        if (!nickname) {
            this.showStatus('Введите никнейм', 'error');
            return;
        }

        if (nickname.length < 3) {
            this.showStatus('Никнейм должен быть минимум 3 символа', 'error');
            return;
        }

        if (nickname.length > 20) {
            this.showStatus('Никнейм должен быть не более 20 символов', 'error');
            return;
        }

        this.nickname = nickname;
        localStorage.setItem('game_nickname', nickname);
        this.showStatus('Никнейм сохранён!', 'success');
        this.updateStartButton();

        setTimeout(() => this.loadRating(), 500);
    }

    showStatus(message, type) {
        const status = document.getElementById('nicknameStatus');
        status.textContent = message;
        status.className = `status ${type}`;

        setTimeout(() => {
            status.textContent = '';
            status.className = 'status';
        }, 3000);
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGame');
        const nickname = document.getElementById('nickname').value.trim() || this.nickname;
        startBtn.disabled = !nickname || !this.currentMode;

        if (!startBtn.disabled) {
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
        }
    }

    updateUI() {
        if (this.nickname) {
            document.getElementById('nickname').value = this.nickname;
        }
        this.updateStartButton();
    }

    loadRating() {
        const ratings = this.ratingSystem.getRatings(this.currentMode);
        const tbody = document.querySelector('#ratingTable tbody');
        tbody.innerHTML = '';

        if (ratings.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" style="text-align: center; padding: 20px; color: #718096;">Рейтинг пуст</td>';
            tbody.appendChild(row);
            return;
        }

        ratings.forEach((rating, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${rating.nickname}</td>
                <td>${rating.score.toLocaleString()}</td>
            `;

            if (rating.nickname === this.nickname) {
                row.style.backgroundColor = '#ebf8ff';
                row.style.fontWeight = '500';
            }

            tbody.appendChild(row);
        });
    }

    startGame() {
        if (!this.nickname) {
            this.showStatus('Сначала сохраните никнейм', 'error');
            return;
        }

        localStorage.setItem('game_mode', this.currentMode);

        window.location.href = 'game.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MainMenu();
});