class Particle {
    constructor(posX, posY, radius, color) {
        this.posX = posX;
        this.posY = posY;
        this.radius = radius;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Player {
    constructor(posX, posY, radius, color) {
        this.posX = posX;
        this.posY = posY;
        this.radius = radius;
        this.color = color;

        this.effect = false;

        this.particles = [];
        for (let i = this.radius; i >= 1; i--) {
            this.particles.push(new Particle(this.posX, this.posY, i, this.color));
        }
    }

    move(deltaX, deltaY) {
        this.posX -= deltaX;
        this.posY += deltaY;

        this.particles[0].posX = this.posX;
        this.particles[0].posY = this.posY;

        for (let i = 1; i < this.particles.length; i++) {
            const smoothing = 0.5;
            this.particles[i].posX += (this.particles[i - 1].posX - this.particles[i].posX) * smoothing;
            this.particles[i].posY += (this.particles[i - 1].posY - this.particles[i].posY) * smoothing;
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
}
