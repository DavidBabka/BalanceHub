import { CONFIG } from '../config/config.js';
import { Player } from './Player.js';
import { SocketHandler } from './SocketHandler.js';
import { WallObstacle } from './WallObstacle.js';
import { translations } from '../../../utils/translations.js';
import { getCurrentLang } from '../../../utils/translation-utils.js';
import { startGame } from '../game.js';

export class Game {
    constructor(canvas, ctx, socket) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.player = new Player(
            canvas.width / 2,
            canvas.height - CONFIG.PLAYER.RADIUS * 2,
            CONFIG.PLAYER.RADIUS,
            "yellow"
        );

        this.obstacles = [];
        this.obstacles.push(new WallObstacle(70, 300).createWallObstacle(canvas));
        this.socketHandler = new SocketHandler(socket);

        this.running = false;
        this.lastTimestamp = 0;
        this.score = 0;
        this.destroyed = false;

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.restartHandler = null;

        this.bgImage = new Image();
        // this.bgImage.src = '/games/moving-walls/images/bg.png';
        this.bgImage.src = '/images/bg.png';
        this.pattern = null;

        this.bgImage.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 100;
            tempCanvas.height = 100;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(this.bgImage, 0, 0, 150, 150);
            this.pattern = this.ctx.createPattern(tempCanvas, 'repeat');
        };

        this.bgImage.onerror = () => {
            console.error('Failed to load wall image:', this.bgImage.src);
        };
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.player.posX = e.clientX - rect.left;
        this.player.posY = e.clientY - rect.top;
    }

    addMouseMovement() {
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
    }

    removeMouseMovement() {
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    }

    start() {
        if (this.destroyed) return;
        this.addMouseMovement();
        this.running = true;
        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    stop() {
        this.running = false;
    }

    destroy() {
        this.running = false;
        this.destroyed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.restartHandler) {
            this.canvas.removeEventListener("click", this.restartHandler);
            this.restartHandler = null;
        }

        this.removeMouseMovement();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.socketHandler?.socket) {
            const socket = this.socketHandler.socket;
            if (typeof socket.disconnect === 'function') socket.disconnect();
            else if (typeof socket.close === 'function') socket.close();
        }

        this.player = null;
        this.obstacles = [];
        this.socketHandler = null;
    }

    gameLoop(timestamp = 0) {
        if (!this.running || this.destroyed) return;

        this.lastTimestamp = timestamp;
        const { x: deltaX, y: deltaY } = this.socketHandler.getDeltas();

        this.update(deltaX, deltaY);
        this.render();

        this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaX, deltaY) {
        this.player.move(deltaX, deltaY);
    }

    render() {
        if (this.destroyed) return;

        this.ctx.globalAlpha = 1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.pattern) {
            this.ctx.fillStyle = this.pattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const r = this.player.radius;
        this.player.posX = Math.min(Math.max(this.player.posX, r), this.canvas.width - r);
        this.player.posY = Math.min(Math.max(this.player.posY, r), this.canvas.height - r);

        this.obstacles = this.obstacles.filter(wall => {
            wall.update(1);
            wall.draw(this.ctx);

            if (!wall.scored && (wall.posY + wall.height) > this.player.posY) {
                this.score++;
                wall.scored = true;
                wall.fadeOut();
            }

            if (this.checkCollision(this.player, wall)) {
                this.running = false;
                this.renderGameOver();
                return false;
            }

            return wall.posY + wall.height > 0;
        });

        this.player.draw(this.ctx);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px monospace";
        this.ctx.textAlign = "left";
        this.ctx.fillText(translations[getCurrentLang()]["canvasScore"] + this.score, 20, 30);

        if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].posY >= 200) {
            this.obstacles.push(new WallObstacle(70, 300).createWallObstacle(this.canvas));
        }

        if (!this.running) {
            this.renderGameOver();
        }
    }

    renderGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.font = "50px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(translations[getCurrentLang()]["canvasStartAgain"], this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.ctx.font = "30px Arial";
        this.ctx.fillStyle = "yellow";
        this.ctx.fillText(translations[getCurrentLang()]["canvasRestart"], this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.fillText(translations[getCurrentLang()]["canvasScore"] + this.score, this.canvas.width / 2, this.canvas.height / 2 + 70);

        this.addRestartHandler();
    }

    addRestartHandler() {
        if (this.restartHandler) {
            this.canvas.removeEventListener("click", this.restartHandler);
        }

        this.restartHandler = () => {
            this.canvas.removeEventListener("click", this.restartHandler);
            this.destroy();
            startGame();
        };

        this.canvas.addEventListener("click", this.restartHandler);
    }

    checkCollision(player, wall) {
        if (!wall.scored) {
            for (let segment of wall.walls) {
                const collidesHorizontally = player.posX + player.radius > segment.posX && player.posX - player.radius < segment.posX + segment.width;
                const collidesVertically = player.posY + player.radius > segment.posY && player.posY - player.radius < segment.posY + segment.height;
                if (collidesHorizontally && collidesVertically) {
                    return true;
                }
            }
        }
        return false;
    }
}
