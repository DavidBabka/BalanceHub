export class PopEffect {
    constructor(posX, posY, innerRadius, outerRadius, color = "black") {
        this.posX = posX;
        this.posY = posY;
        this.innerRadius = innerRadius;
        this.baseInnerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.color = color;
        this.visible = false;
        this.growing = true;
        this.alpha = 1;
    }

    activate() {
        this.visible = true;
        this.growing = true;
        this.innerRadius = this.baseInnerRadius;
        this.alpha = 1;
    }

    update() {
        if (this.visible) {
            if (this.growing) {
                this.innerRadius += (this.outerRadius - this.innerRadius) * 0.6;
                if (this.innerRadius >= this.outerRadius - 1) {
                    this.growing = false;
                }
            } else {
                this.alpha -= 0.05;
                if (this.alpha <= 0) {
                    this.visible = false;
                    this.innerRadius = this.baseInnerRadius;
                    this.alpha = 1;
                }
            }
        }
    }

    createGradient(ctx) {
        const gradient = ctx.createLinearGradient(
            this.posX - this.outerRadius,
            this.posY - this.outerRadius,
            this.posX + this.outerRadius,
            this.posY + this.outerRadius
        );
        gradient.addColorStop(0, "rgb(255, 0, 0)");
        gradient.addColorStop(0.3, "rgb(255, 140, 0)");
        gradient.addColorStop(0.6, "rgb(255, 255, 0)");
        gradient.addColorStop(1, "rgb(255, 20, 147)");
        return gradient;
    }

    draw(ctx) {
        if (!this.visible) return;

        const gradient = this.createGradient(ctx);

        ctx.beginPath();
        ctx.globalAlpha = this.alpha;
        ctx.filter = "blur(2px)";
        ctx.lineWidth = 10;
        ctx.strokeStyle = gradient;
        ctx.fillStyle = gradient;
        ctx.arc(this.posX, this.posY, this.innerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.filter = "none";

        ctx.lineWidth = 1;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(this.posX, this.posY, this.innerRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
    }
}
