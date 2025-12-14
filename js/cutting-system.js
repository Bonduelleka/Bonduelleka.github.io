class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

class Shape {
    constructor(points = [], color = null) {
        this.points = points;
        this.color = color || this.generateColor();
        this.id = Date.now() + Math.random();
        this.isHovered = false;
    }

    generateColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsla(${hue}, 70%, 60%, 0.7)`;
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.closePath();

        if (this.isHovered) {
            ctx.fillStyle = this.color.replace('0.7', '0.9');
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 0;
        }

        ctx.fill();

        ctx.strokeStyle = this.color.replace('0.7', '0.9').replace('hsla', 'hsl');
        ctx.lineWidth = this.isHovered ? 4 : 2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    containsPoint(x, y) {
        // Алгоритм ray casting для проверки нахождения точки внутри полигона
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i].x, yi = this.points[i].y;
            const xj = this.points[j].x, yj = this.points[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    get center() {
        const sum = this.points.reduce((acc, p) => {
            acc.x += p.x;
            acc.y += p.y;
            return acc;
        }, { x: 0, y: 0 });

        return new Point(
            sum.x / this.points.length,
            sum.y / this.points.length
        );
    }

    get area() {
        let area = 0;
        const n = this.points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.points[i].x * this.points[j].y;
            area -= this.points[j].x * this.points[i].y;
        }

        return Math.abs(area) / 2;
    }

    static lineIntersection(p1, p2, p3, p4) {
        const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

        if (denominator === 0) return null;

        const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
        const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return new Point(
                p1.x + ua * (p2.x - p1.x),
                p1.y + ua * (p2.y - p1.y)
            );
        }

        return null;
    }
}

class CuttingSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.shapes = [];
        this.isCutting = false;
        this.cutStart = null;
        this.cutEnd = null;
        this.cutLine = null;
        this.onCutCallback = null;
        this.onShapeHover = null;
        this.onShapeLeave = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.animate();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isCutting = true;
        this.cutStart = new Point(x, y);
        this.cutEnd = this.cutStart;
        this.cutLine = { start: this.cutStart, end: this.cutEnd };
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Проверка наведения на фигуры
        let hoveredShape = null;
        for (const shape of this.shapes) {
            shape.isHovered = shape.containsPoint(x, y);
            if (shape.isHovered) {
                hoveredShape = shape;

                if (this.onShapeHover) {
                    this.onShapeHover(shape);
                }
            }
        }

        // Если ни одна фигура не под курсором
        if (!hoveredShape && this.onShapeLeave) {
            this.onShapeLeave();
        }

        // Обновление линии разреза
        if (this.isCutting) {
            this.cutEnd = new Point(x, y);
            this.cutLine.end = this.cutEnd;
        }
    }

    onMouseUp(e) {
        if (!this.isCutting) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.cutEnd = new Point(x, y);
        this.isCutting = false;

        // Выполняем разрез
        this.performCut();

        // Сбрасываем линию разреза
        setTimeout(() => {
            this.cutLine = null;
        }, 300);
    }

    onMouseLeave() {
        // Сбрасываем hover состояние всех фигур
        for (const shape of this.shapes) {
            shape.isHovered = false;
        }

        if (this.onShapeLeave) {
            this.onShapeLeave();
        }

        // Отменяем разрез, если мышь вышла за пределы канваса
        if (this.isCutting) {
            this.isCutting = false;
            this.cutLine = null;
        }
    }

    performCut() {
        if (!this.cutStart || !this.cutEnd) return;

        const newShapes = [];
        let totalCuts = 0;

        for (const shape of this.shapes) {
            const intersections = [];

            // Находим все пересечения разреза с ребрами фигуры
            for (let i = 0; i < shape.points.length; i++) {
                const p1 = shape.points[i];
                const p2 = shape.points[(i + 1) % shape.points.length];
                const intersection = Shape.lineIntersection(
                    this.cutStart,
                    this.cutEnd,
                    p1,
                    p2
                );

                if (intersection) {
                    intersections.push({
                        edgeIndex: i,
                        point: intersection
                    });
                }
            }

            // Если есть ровно 2 пересечения - делим фигуру
            if (intersections.length === 2) {
                totalCuts++;
                intersections.sort((a, b) => a.edgeIndex - b.edgeIndex);

                const [intersect1, intersect2] = intersections;
                const shape1Points = [];
                const shape2Points = [];

                // Первая фигура
                for (let i = 0; i <= intersect1.edgeIndex; i++) {
                    shape1Points.push(shape.points[i]);
                }
                shape1Points.push(intersect1.point);
                shape1Points.push(intersect2.point);
                for (let i = intersect2.edgeIndex + 1; i < shape.points.length; i++) {
                    shape1Points.push(shape.points[i]);
                }

                // Вторая фигура
                shape2Points.push(intersect1.point);
                for (let i = intersect1.edgeIndex + 1; i <= intersect2.edgeIndex; i++) {
                    shape2Points.push(shape.points[i]);
                }
                shape2Points.push(intersect2.point);

                // Создаём новые фигуры с сохранением цвета оригинала
                newShapes.push(new Shape(shape1Points, shape.color));
                newShapes.push(new Shape(shape2Points, shape.color));
            } else {
                // Если не 2 пересечения - оставляем фигуру как есть
                newShapes.push(shape);
            }
        }

        // Обновляем список фигур
        this.shapes = newShapes;

        // Вызываем колбэк с результатом разреза
        if (this.onCutCallback && totalCuts > 0) {
            this.onCutCallback(totalCuts, this.shapes.length);
        }

        return totalCuts;
    }

    setShapes(shapes) {
        this.shapes = shapes;
    }

    clear() {
        this.shapes = [];
        this.cutLine = null;
        this.isCutting = false;
    }

    drawCutLine() {
        if (!this.cutLine) return;

        const { start, end } = this.cutLine;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);

        this.ctx.strokeStyle = '#ff3333';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Точки начала и конца
        this.ctx.fillStyle = '#ff3333';
        this.ctx.beginPath();
        this.ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        // Очищаем канвас
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем фон
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем все фигуры
        for (const shape of this.shapes) {
            shape.draw(this.ctx);
        }

        // Рисуем линию разреза
        this.drawCutLine();

        // Запрашиваем следующий кадр
        requestAnimationFrame(() => this.animate());
    }

    setOnCutCallback(callback) {
        this.onCutCallback = callback;
    }

    setOnShapeHover(callback) {
        this.onShapeHover = callback;
    }

    setOnShapeLeave(callback) {
        this.onShapeLeave = callback;
    }
}