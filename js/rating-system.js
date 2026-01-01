class RatingSystem {
    constructor() {
        this.storageKey = 'game_ratings';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const defaultRatings = {
                'cut': this.generateSampleRatings(),
                'friend-foe': this.generateSampleRatings()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(defaultRatings));
        }
    }

    generateSampleRatings() {
        return [
            { nickname: 'Профи', score: 12500 },
            { nickname: 'Мастер', score: 9800 },
            { nickname: 'Новичок', score: 6500 },
            { nickname: 'Игрок', score: 4200 },
            { nickname: 'Начинающий', score: 2500 },
            { nickname: 'Тестер', score: 1800 },
            { nickname: 'Гость', score: 1200 },
            { nickname: 'Ученик', score: 800 },
            { nickname: 'Посетитель', score: 500 },
            { nickname: 'Новичок', score: 200 }
        ].sort((a, b) => b.score - a.score);
    }

    getRatings(mode) {
        try {
            const ratings = JSON.parse(localStorage.getItem(this.storageKey));
            return ratings[mode] || [];
        } catch (error) {
            console.error('Error loading ratings:', error);
            return [];
        }
    }

    saveRating(mode, nickname, score) {
        try {
            const ratings = JSON.parse(localStorage.getItem(this.storageKey)) || {};

            if (!ratings[mode]) {
                ratings[mode] = [];
            }

            const existingIndex = ratings[mode].findIndex(item => item.nickname === nickname);

            if (existingIndex !== -1) {
                if (score > ratings[mode][existingIndex].score) {
                    ratings[mode][existingIndex].score = score;
                    ratings[mode][existingIndex].date = new Date().toISOString();
                }
            } else {
                ratings[mode].push({
                    nickname: nickname,
                    score: score,
                    date: new Date().toISOString()
                });
            }

            ratings[mode].sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(b.date) - new Date(a.date);
            });

            ratings[mode] = ratings[mode].slice(0, 10);

            localStorage.setItem(this.storageKey, JSON.stringify(ratings));
            return true;
        } catch (error) {
            console.error('Error saving rating:', error);
            return false;
        }
    }

    getPlayerBestScore(mode, nickname) {
        const ratings = this.getRatings(mode);
        const playerRating = ratings.find(r => r.nickname === nickname);
        return playerRating ? playerRating.score : 0;
    }

    clearRatings() {
        localStorage.removeItem(this.storageKey);
        this.initStorage();
    }
}