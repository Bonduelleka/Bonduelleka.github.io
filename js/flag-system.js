class Flag {
    constructor(x, y, color, team = 1) {
        this.x = x;          // X координата точки идентификации (ножка флага)
        this.y = y;          // Y координата точки идентификации (ножка флага)
        this.color = color;
        this.team = team;    // 1 - синие, 2 - красные, 3+ - другие команды
        this.height = 40;    // Высота всего флага (от точки идентификации до верха)
        this.flagWidth = 30; // Ширина флажка
        this.poleWidth = 4;  // Ширина древка
        this.poleHeight = 35; // Высота древка
        this.isDragging = false;
    }

    draw(ctx) {
        // Сохраняем контекст
        ctx.save();

        // Перемещаем к точке идентификации (ножке флага)
        ctx.translate(this.x, this.y);

        // 1. Рисуем древко флага (идёт ВВЕРХ от точки)
        ctx.fillStyle = '#8B4513'; // Коричневый цвет древка

        // Древко - вертикальная линия вверх
        const poleX = -this.poleWidth / 2;
        const poleY = -this.poleHeight; // Отрицательное значение - рисуем вверх
        ctx.fillRect(poleX, poleY, this.poleWidth, this.poleHeight);

        // 2. Рисуем флажок (треугольник) на вершине древка
        ctx.fillStyle = this.color;
        ctx.beginPath();

        // Вершина флажка (верхняя точка древка)
        const flagTopX = 0;
        const flagTopY = -this.poleHeight;

        // Точки треугольника флажка
        ctx.moveTo(flagTopX, flagTopY); // Верх древка
        ctx.lineTo(flagTopX + this.flagWidth, flagTopY + this.flagWidth / 2); // Правая точка
        ctx.lineTo(flagTopX, flagTopY + this.flagWidth); // Нижняя точка
        ctx.closePath();
        ctx.fill();

        // 3. Основание (точка идентификации) - рисуем в исходной точке (0,0)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2); // Чуть больше точка для лучшей видимости
        ctx.fill();

        // 4. Декоративное утолщение в основании флага
        ctx.fillStyle = '#5D4037'; // Тёмно-коричневый
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // 5. Небольшая тень/обводка для лучшей видимости
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;

        // Обводка древка
        ctx.strokeRect(poleX, poleY, this.poleWidth, this.poleHeight);

        // Обводка флажка
        ctx.beginPath();
        ctx.moveTo(flagTopX, flagTopY);
        ctx.lineTo(flagTopX + this.flagWidth, flagTopY + this.flagWidth / 2);
        ctx.lineTo(flagTopX, flagTopY + this.flagWidth);
        ctx.closePath();
        ctx.stroke();

        // Восстанавливаем контекст
        ctx.restore();
    }

    containsPoint(x, y) {
        // Проверяем, находится ли точка в пределах флага
        // Учитываем и флажок, и древко, и точку идентификации
        const dx = x - this.x;
        const dy = y - this.y;

        // Проверяем точку идентификации (радиус 6px)
        if (dx * dx + dy * dy < 36) { // 6^2 = 36
            return true;
        }

        // Проверяем древко (прямоугольник от точки идентификации вверх)
        const poleX = this.x - this.poleWidth / 2;
        const poleY = this.y - this.poleHeight;
        const poleWidth = this.poleWidth;
        const poleHeight = this.poleHeight;

        if (x >= poleX && x <= poleX + poleWidth &&
            y >= poleY && y <= poleY + poleHeight) {
            return true;
        }

        // Проверяем флажок (треугольник)
        const flagTopX = this.x;
        const flagTopY = this.y - this.poleHeight;

        // Используем barycentric coordinates для проверки точки в треугольнике
        const v0 = [flagTopX + this.flagWidth - flagTopX, (flagTopY + this.flagWidth / 2) - flagTopY];
        const v1 = [flagTopX - flagTopX, (flagTopY + this.flagWidth) - flagTopY];
        const v2 = [x - flagTopX, y - flagTopY];

        const dot00 = v0[0] * v0[0] + v0[1] * v0[1];
        const dot01 = v0[0] * v1[0] + v0[1] * v1[1];
        const dot02 = v0[0] * v2[0] + v0[1] * v2[1];
        const dot11 = v1[0] * v1[0] + v1[1] * v1[1];
        const dot12 = v1[0] * v2[0] + v1[1] * v2[1];

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
}

class FlagSystem {
    constructor() {
        this.flags = [];
        this.teams = [
            { id: 1, name: 'Синие', color: '#3B82F6' },
            { id: 2, name: 'Красные', color: '#EF4444' },
            { id: 3, name: 'Зелёные', color: '#10B981' },
            { id: 4, name: 'Жёлтые', color: '#F59E0B' }
        ];
    }

    addRandomFlag(shape, teamId = null) {
        const team = teamId ?
            this.teams.find(t => t.id === teamId) :
            this.teams[Math.floor(Math.random() * 2)]; // По умолчанию только синие/красные

        // Генерируем случайную точку внутри фигуры
        const point = this.getRandomPointInShape(shape);
        if (point) {
            const flag = new Flag(point.x, point.y, team.color, team.id);
            this.flags.push(flag);
            return flag;
        }
        return null;
    }

    getRandomPointInShape(shape) {
        // Используем rejection sampling для нахождения случайной точки внутри фигуры
        const bounds = this.getShapeBounds(shape);
        let attempts = 0;
        const maxAttempts = 1000;

        // Получаем высоту флага для учёта при размещении
        const flagHeight = 40; // Примерная высота флага

        while (attempts < maxAttempts) {
            // Генерируем точку с учётом того, что флаг рисуется вверх
            // Нам нужно, чтобы вся высота флага помещалась в фигуре
            const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            const y = bounds.minY + flagHeight + Math.random() * (bounds.maxY - bounds.minY - flagHeight);

            // Проверяем, что точка идентификации и область выше неё внутри фигуры
            if (shape.containsPoint(x, y)) {
                // Дополнительно проверяем несколько точек выше (по древку)
                const testPoints = [
                    {x: x, y: y - flagHeight * 0.25},
                    {x: x, y: y - flagHeight * 0.5},
                    {x: x, y: y - flagHeight * 0.75}
                ];

                let allPointsInside = true;
                for (const point of testPoints) {
                    if (!shape.containsPoint(point.x, point.y)) {
                        allPointsInside = false;
                        break;
                    }
                }

                if (allPointsInside) {
                    return new Point(x, y);
                }
            }
            attempts++;
        }

        // Если не нашли подходящую точку, возвращаем просто центр
        const center = shape.center;
        return new Point(center.x, center.y);
    }

    getShapeBounds(shape) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const point of shape.points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        return { minX, minY, maxX, maxY };
    }

    clear() {
        this.flags = [];
    }

    draw(ctx) {
        for (const flag of this.flags) {
            flag.draw(ctx);
        }
    }

    // Получить флаги по команде
    getFlagsByTeam(teamId) {
        return this.flags.filter(flag => flag.team === teamId);
    }

    // Получить флаги внутри фигуры
    getFlagsInShape(shape) {
        return this.flags.filter(flag => shape.containsPoint(flag.x, flag.y));
    }

    // Проверить, есть ли конфликты в фигуре
    checkShapeForConflicts(shape) {
        const flagsInShape = this.getFlagsInShape(shape);
        if (flagsInShape.length <= 1) return null; // Нет конфликтов

        // Собираем ID команд в фигуре
        const teamsInShape = new Set();
        for (const flag of flagsInShape) {
            teamsInShape.add(flag.team);
        }

        // Если больше одной команды - конфликт
        if (teamsInShape.size > 1) {
            return {
                shape: shape,
                flags: flagsInShape,
                teams: Array.from(teamsInShape),
                isConflict: true
            };
        }

        return null; // Все флаги одной команды - конфликта нет
    }
}