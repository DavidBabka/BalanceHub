class Wall {
    constructor(posX, posY, width, height) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    }

    update(deltaY) {
        this.posY += deltaY;
    }

    draw(ctx, image, opacity) {
        ctx.globalAlpha = opacity;

        // Draw the wall background
        ctx.fillStyle = 'gray';
        // ctx.fillRect(this.posX, this.posY, this.width, this.height);

        if (image && image.complete && image.naturalWidth !== 0) {
            const imgAspect = image.width / image.height;

            const drawHeight = this.height;
            const drawWidth = drawHeight * imgAspect;

            // Save context and set clipping region to keep image inside the wall
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.posX, this.posY, this.width, this.height);
            ctx.clip();

            const isLeftWall = this.posX === 0; // crude way to detect left wall

            if (isLeftWall) {
                // Right-to-left tiling
                let offsetX = this.posX + this.width - drawWidth;
                while (offsetX + drawWidth >= this.posX) {
                    ctx.drawImage(image, offsetX, this.posY, drawWidth, drawHeight);
                    offsetX -= drawWidth;
                }
            } else {
                // Left-to-right tiling
                let offsetX = this.posX;
                while (offsetX < this.posX + this.width) {
                    ctx.drawImage(image, offsetX, this.posY, drawWidth, drawHeight);
                    offsetX += drawWidth;
                }
            }

            ctx.restore(); // remove clipping
        }



        ctx.globalAlpha = 1;
    }


}

const sharedWallImage = new Image();
// sharedWallImage.src = '/games/moving-walls/images/asteroids_t.png';
sharedWallImage.src = '/images/asteroids_t.png';


export class WallObstacle {
    constructor(height, gap) {
        this.posX = 0;
        this.posY = -height;
        this.height = height;
        this.gap = gap;
        this.walls = [];
        this.scored = false;
        this.opacity = 1;

        this.wallImage = sharedWallImage;
    }

    createWallObstacle(canvas) {
        const gapPosition = Math.floor(Math.random() * (canvas.width - this.gap - 400));
        const leftWall = new Wall(this.posX, this.posY, gapPosition, this.height);
        const rightWall = new Wall(
            gapPosition + this.gap,
            this.posY,
            canvas.width - (gapPosition + this.gap),
            this.height
        );

        this.walls.push(leftWall, rightWall);
        return this;
    }

    update(deltaY) {
        this.posY += deltaY;
        this.walls.forEach(wall => wall.update(deltaY));
        if (this.opacity < 1) {
            this.opacity -= 0.02;
            if (this.opacity <= 0) this.opacity = 0;
        }
    }

    fadeOut() {
        this.opacity = 0.8;
    }

    draw(ctx) {
        this.walls.forEach(wall => wall.draw(ctx, this.wallImage, this.opacity));
    }
}
