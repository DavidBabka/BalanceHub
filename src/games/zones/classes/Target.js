import { parseColor, lerpColor } from '../utils/color-utils.js';

export class Target {
    constructor(posX, posY, innerRadius, outerRadius, baseInnerColor, baseOuterColor, changeColorTo) {
        this.posX = posX;
        this.posY = posY;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.baseOuterRadius = outerRadius;
        this.baseInnerColor = baseInnerColor;
        this.color = baseOuterColor;
        this.baseOuterColor = baseOuterColor;
        this.changeColorTo = parseColor(changeColorTo);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "black";
        ctx.arc(this.posX, this.posY, this.outerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
        ctx.fillStyle = this.baseInnerColor;
        ctx.strokeStyle = "black";
        ctx.arc(this.posX, this.posY, this.innerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    changeColor() {
        let a = parseColor(this.color);
        a[0] = Math.floor(a[0] + (this.changeColorTo[0] - a[0]) * 0.02);
        a[1] = Math.floor(a[1] + (this.changeColorTo[1] - a[1]) * 0.02);
        a[2] = Math.floor(a[2] + (this.changeColorTo[2] - a[2]) * 0.02);
        this.color = `rgb(${a[0]}, ${a[1]}, ${a[2]})`;
    }

    updateOuterRadius() {
        this.outerRadius -= Math.max(0.5, this.outerRadius * 0.001);
        this.changeColor();
    }

    restoreOuterRadius() {
        this.outerRadius = this.baseOuterRadius;
        this.color = this.baseOuterColor;
    }

    spawnRandom(canvas) {
        let attempts = 10;
        while (attempts-- > 0) {
            let angle = Math.random() * Math.PI * 2;
            let newX = this.posX + Math.cos(angle) * 300;
            let newY = this.posY + Math.sin(angle) * 300;
            if (newX - 100 >= 0 && newY - 100 >= 0 && newX + 100 <= canvas.width && newY + 100 <= canvas.height) {
                this.posX = newX;
                this.posY = newY;
                break;
            }
        }
    }
}
