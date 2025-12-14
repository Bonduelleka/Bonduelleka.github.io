class ShapeGenerator {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
    }

    generateRegularPolygon(sides, radius, offsetX = 0, offsetY = 0) {
        const points = [];
        const angleStep = (Math.PI * 2) / sides;

        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep;
            const x = this.centerX + offsetX + radius * Math.cos(angle);
            const y = this.centerY + offsetY + radius * Math.sin(angle);
            points.push(new Point(x, y));
        }

        return new Shape(points);
    }

    generateRandomShape(level = 1) {
        switch(level) {
            case 1:
                return this.generateLevel1Shape();
            case 2:
                return this.generateLevel2Shape();
            case 3:
                return this.generateLevel3Shape();
            default:
                return this.generateLevel1Shape();
        }
    }

    generateLevel1Shape() {
        // (треугольник, квадрат, пятиугольник)
        const types = [3, 4, 5];
        const sides = types[Math.floor(Math.random() * types.length)];
        const radius = 100 + Math.random() * 50;

        // Небольшое случайное смещение от центра
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        return this.generateRegularPolygon(sides, radius, offsetX, offsetY);
    }

    generateLevel2Shape() {
        // (шестиугольники, восьмиугольники)
        const types = [6, 7, 8];
        const sides = types[Math.floor(Math.random() * types.length)];
        const radius = 120 + Math.random() * 60;

        const shape = this.generateRegularPolygon(sides, radius);
        this.deformShape(shape, 15);

        return shape;
    }

    generateLevel3Shape() {
        // неправильные фигуры
        const sides = 7 + Math.floor(Math.random() * 4);
        const radius = 140 + Math.random() * 70;

        if (Math.random() > 0.5) {
            return this.generateStarShape(sides, radius);
        } else {
            const shape = this.generateRegularPolygon(sides, radius);
            this.deformShape(shape, 25);
            return shape;
        }
    }

    generateStarShape(points, outerRadius, innerRadiusRatio = 0.5) {
        const shapePoints = [];
        const innerRadius = outerRadius * innerRadiusRatio;

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;

            const x = this.centerX + radius * Math.cos(angle);
            const y = this.centerY + radius * Math.sin(angle);
            shapePoints.push(new Point(x, y));
        }

        return new Shape(shapePoints);
    }

    deformShape(shape, maxDeformation) {
        for (let i = 0; i < shape.points.length; i++) {
            shape.points[i].x += (Math.random() - 0.5) * maxDeformation * 2;
            shape.points[i].y += (Math.random() - 0.5) * maxDeformation * 2;
        }
    }

    // для обучения
    generateTutorialShapes() {
        return [
            this.generateRegularPolygon(3, 80, -150, 0),   // Треугольник
            this.generateRegularPolygon(4, 80, 0, 0),      // Квадрат
            this.generateRegularPolygon(5, 80, 150, 0)     // Пятиугольник
        ];
    }
}