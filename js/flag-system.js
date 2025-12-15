class Flag {
    constructor(x, y, color, team = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.team = team;
        this.height = 40;
        this.flagWidth = 30;
        this.poleWidth = 4;
        this.poleHeight = 35;
        this.isDragging = false;
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#8B4513';

        const poleX = -this.poleWidth / 2;
        const poleY = -this.poleHeight;
        ctx.fillRect(poleX, poleY, this.poleWidth, this.poleHeight);

        ctx.fillStyle = this.color;
        ctx.beginPath();

        const flagTopX = 0;
        const flagTopY = -this.poleHeight;

        ctx.moveTo(flagTopX, flagTopY);
        ctx.lineTo(flagTopX + this.flagWidth, flagTopY + this.flagWidth / 2);
        ctx.lineTo(flagTopX, flagTopY + this.flagWidth);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;

        ctx.strokeRect(poleX, poleY, this.poleWidth, this.poleHeight);

        ctx.beginPath();
        ctx.moveTo(flagTopX, flagTopY);
        ctx.lineTo(flagTopX + this.flagWidth, flagTopY + this.flagWidth / 2);
        ctx.lineTo(flagTopX, flagTopY + this.flagWidth);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;

        if (dx * dx + dy * dy < 36) {
            return true;
        }

        const poleX = this.x - this.poleWidth / 2;
        const poleY = this.y - this.poleHeight;
        const poleWidth = this.poleWidth;
        const poleHeight = this.poleHeight;

        if (x >= poleX && x <= poleX + poleWidth &&
            y >= poleY && y <= poleY + poleHeight) {
            return true;
        }

        const flagTopX = this.x;
        const flagTopY = this.y - this.poleHeight;

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
            this.teams[Math.floor(Math.random() * 2)];

        const point = this.getRandomPointInShape(shape);
        if (point) {
            const flag = new Flag(point.x, point.y, team.color, team.id);
            this.flags.push(flag);
            return flag;
        }
        return null;
    }

    getRandomPointInShape(shape) {
        const bounds = this.getShapeBounds(shape);
        let attempts = 0;
        const maxAttempts = 1000;

        const flagHeight = 40;

        while (attempts < maxAttempts) {
            const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            const y = bounds.minY + flagHeight + Math.random() * (bounds.maxY - bounds.minY - flagHeight);

            if (shape.containsPoint(x, y)) {
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

    getFlagsByTeam(teamId) {
        return this.flags.filter(flag => flag.team === teamId);
    }

    getFlagsInShape(shape) {
        return this.flags.filter(flag => shape.containsPoint(flag.x, flag.y));
    }

    checkShapeForConflicts(shape) {
        const flagsInShape = this.getFlagsInShape(shape);
        if (flagsInShape.length <= 1) return null;

        const teamsInShape = new Set();
        for (const flag of flagsInShape) {
            teamsInShape.add(flag.team);
        }

        if (teamsInShape.size > 1) {
            return {
                shape: shape,
                flags: flagsInShape,
                teams: Array.from(teamsInShape),
                isConflict: true
            };
        }

        return null;
    }
}