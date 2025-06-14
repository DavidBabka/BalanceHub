import { CONFIG } from '../config/config.js';
import { Player } from './Player.js';
import { Target } from './Target.js';
import { PopEffect } from './PopEffect.js';
import { collision, targetComplete } from '../utils/game-utils.js';
import { SocketHandler } from './SocketHandler.js';
import { Timer } from './Timer.js';
import { translations } from '../../../utils/translations.js';
import { getCurrentLang } from '../../../utils/translation-utils.js';
import { startGame } from '../game.js';

export class Game {
    constructor(canvas, ctx, socket) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.player = new Player(canvas.width / 2, canvas.height / 2, CONFIG.PLAYER.RADIUS, CONFIG.PLAYER.COLOR);

        this.target = new Target(
            this.player.posX,
            this.player.posY,
            CONFIG.TARGET.INNER_RADIUS,
            CONFIG.TARGET.OUTER_RADIUS,
            CONFIG.TARGET.BASE_INNER_COLOR,
            CONFIG.TARGET.BASE_OUTER_COLOR,
            CONFIG.TARGET.CHANGE_COLOR_TO
        );

        this.popEffect = new PopEffect(this.target.posX, this.target.posY, CONFIG.TARGET.INNER_RADIUS, CONFIG.TARGET.OUTER_RADIUS);
        this.socketHandler = new SocketHandler(socket);

        this.counter = 0;
        this.running = false;
        this.lastTimestamp = 0;
        this.timer = new Timer();

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.restartHandler = null;
        this.countdownInterval = null;

        this.bgImage = new Image();
        this.bgImage.src = '/images/bg_3.png';
        // this.bgImage.onload = () => {
        //     this.ctx.drawImage(this.bgImage, 0, 0);
        // };
    }

    renderGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = "white";
        this.ctx.font = "50px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(translations[getCurrentLang()]["canvasCongratulation"], this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = "30px Arial";
        this.ctx.fillStyle = "yellow";
        this.ctx.fillText(translations[getCurrentLang()]["canvasRestart"], this.canvas.width / 2, this.canvas.height / 2 + 30);

        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";
        this.ctx.fillText(
            translations[getCurrentLang()]["canvasTime"] + this.timer.getTime().toFixed(2) + translations[getCurrentLang()]["canvasSeconds"],
            this.canvas.width / 2,
            this.canvas.height / 2 + 70
        );

        this.addRestartHandler();
    }

    addRestartHandler() {
        this.restartHandler = () => {
            this.canvas.removeEventListener("click", this.restartHandler);
            this.destroy();
            startGame();
        };
        this.canvas.addEventListener("click", this.restartHandler);
    }

    startCountdown(duration, callback) {
        const fontSpec = "90px Bangers";
        const target = this.target;         // ← capture
        const player = this.player;         // ← you can do the same for player

        const loadAssets = Promise.all([
            document.fonts.load(fontSpec),
            new Promise(resolve => {
                if (this.bgImage.complete) resolve();
                else this.bgImage.onload = resolve;
            })
        ]);

        loadAssets.then(() => {
            let remainingTime = duration;

            const drawCountdown = () => {
                if (!target) return;            // in case someone destroyed before we start
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
                target.draw(this.ctx);          // ← use captured `target`
                player.draw(this.ctx);

                this.ctx.font = fontSpec;
                this.ctx.fillStyle = "white";
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(remainingTime, this.canvas.width / 2, this.canvas.height / 2);
                this.ctx.strokeStyle = "black";
                this.ctx.strokeText(remainingTime, this.canvas.width / 2, this.canvas.height / 2);
            };

            drawCountdown();

            this.countdownInterval = setInterval(() => {
                remainingTime--;
                if (remainingTime === 0) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                    // ← only fire if the Game still has a timer
                    if (callback && this.timer) {
                        callback();
                    }
                    return;
                }
                drawCountdown();
            }, 1000);
        });
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
        this.addMouseMovement();
        // console.log("started");
        // this.ctx.drawImage(this.bgImage, 0, 0);
        this.target.draw(this.ctx);
        this.player.draw(this.ctx);
        this.startCountdown(3, () => {
            this.running = true;
            this.timer.start();
            this.gameLoop();
        });
    }

    stop() {
        this.running = false;
        this.timer.update(this.ctx);
        this.timer.stop();
    }

    destroy() {
        this.running = false;
        // console.log("destryed");

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

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
        this.target = null;
        this.popEffect = null;
        this.timer = null;
        this.socketHandler = null;
    }

    gameLoop(timestamp = 0) {
        if (!this.running) return;

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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = CONFIG.SCENE.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);


        if (collision(this.player, this.target)) {
            this.target.updateOuterRadius();
            if (targetComplete(this.target)) {
                this.counter++;
                if (this.counter >= 5) {
                    this.stop();
                } else {
                    this.popEffect.posX = this.target.posX;
                    this.popEffect.posY = this.target.posY;
                    this.popEffect.activate();
                    this.target.spawnRandom(this.canvas);
                }
            }
        } else {
            this.target.restoreOuterRadius();
        }

        const r = this.player.radius;
        this.player.posX = Math.min(Math.max(this.player.posX, r), this.canvas.width - r);
        this.player.posY = Math.min(Math.max(this.player.posY, r), this.canvas.height - r);

        this.target.draw(this.ctx);
        this.player.draw(this.ctx);
        this.timer.update(this.ctx);
        this.popEffect.update();
        this.popEffect.draw(this.ctx);

        if (!this.running) {
            this.renderGameOver();
        }
    }
}
