class GameMode {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;
    }

    // Методы, которые должны быть реализованы в дочерних классах
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isActive = true;
        console.log(`Mode ${this.name} initialized`);
    }

    start() {
        throw new Error('Method start() must be implemented');
    }

    update() {
        throw new Error('Method update() must be implemented');
    }

    draw() {
        throw new Error('Method draw() must be implemented');
    }

    cleanup() {
        this.isActive = false;
        console.log(`Mode ${this.name} cleaned up`);
    }

    getInstructions() {
        return this.description;
    }
}