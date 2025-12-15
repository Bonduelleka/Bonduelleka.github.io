class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;

        this.loadSounds();
    }

    loadSounds() {
        const soundFiles = {
            'cut': 'sounds/cut.mp3',
            'click': 'sounds/click.mp3',
            'success': 'sounds/success.mp3',
            'error': 'sounds/error.mp3',
            'levelComplete': 'sounds/level-complete.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio(path);
            this.sounds[name].volume = this.volume;
        }
    }

    play(name) {
        if (this.muted || !this.sounds[name]) return;

        const sound = this.sounds[name].cloneNode();
        sound.volume = this.volume;
        sound.play().catch(e => console.log(`Could not play sound ${name}:`, e));
    }

    playCutSound(velocity = 1) {
        if (this.muted) return;

        const sound = this.sounds['cut'].cloneNode();
        sound.volume = Math.min(0.7, this.volume * velocity);
        sound.playbackRate = Math.min(2, Math.max(0.5, velocity));
        sound.play().catch(e => console.log('Cut sound error:', e));
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('game_sound_muted', this.muted);
        return this.muted;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('game_sound_volume', this.volume);

        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.volume;
        }
    }

    loadSettings() {
        const savedMuted = localStorage.getItem('game_sound_muted');
        const savedVolume = localStorage.getItem('game_sound_volume');

        if (savedMuted !== null) this.muted = savedMuted === 'true';
        if (savedVolume !== null) this.setVolume(parseFloat(savedVolume));
    }
}

window.audioManager = new AudioManager();
window.audioManager.loadSettings();