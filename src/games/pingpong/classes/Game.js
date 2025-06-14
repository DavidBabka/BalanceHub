import { socket as mainSocket } from '../../../main';
import { translations } from '../../../utils/translations.js';
import { getCurrentLang } from '../../../utils/translation-utils.js';


export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.socket = mainSocket;

        this.side = null;
        this.game = null;
        this.config = {
            width: 600,
            height: 400,
            paddleWidth: 10,
            paddleHeight: 80,
            ballRadius: 10,
            maxScore: 10
        };

        this.moveUp = false;
        this.moveDown = false;
        this.playerSpeed = 6;
        this.renderedY = 0;
        this.running = false;
        this.awaitingRestart = false;

        this._bindEvents();
        this._initSocket();
        this._resizeCanvas();
    }

    _bindEvents() {
        window.addEventListener('resize', () => this._resizeCanvas());
        document.addEventListener('keydown', e => this._onKeyDown(e));
        document.addEventListener('keyup', e => this._onKeyUp(e));
    }

    _resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    _onKeyDown(e) {
        if (e.key === 'w') this.moveUp = true;
        if (e.key === 's') this.moveDown = true;
    }

    _onKeyUp(e) {
        if (e.key === 'w') this.moveUp = false;
        if (e.key === 's') this.moveDown = false;
    }

    _initSocket() {
        this.socket.emit('start');

        this.socket.on('player-assign', data => {
            this.side = data.side;
        });

        this.socket.on('waiting', () => {
            const lang = getCurrentLang();
            const t = translations[lang];
            this._drawOverlay(t.canvasWaiting);
        });

        this.socket.on('full', () => this._drawOverlay('Game is full. Try again later.'));

        this.socket.on('game-state', data => {
            this.game = data;
            if (data.config) this.config = data.config;

            // 💡 Set renderedY to match real paddle on first assignment
            if (this.side && typeof data.paddles?.[this.side] === 'number') {
                this.renderedY = data.paddles[this.side];
            }

            // game over
            if (!data.running && !this.awaitingRestart) {
                this.running = false;
                this._drawGameOver();
            }

            // restarted
            if (data.running && this.awaitingRestart) {
                this.awaitingRestart = false;
                this.running = true;
                this._loop();
            }
        });

    }

    start() {
        this.running = true;
        this._loop();
    }

    stop() {
        this.running = false;
    }

    destroy() {
        this.socket.emit('leave');
        this.stop();
    }

    _loop() {
        if (!this.running) return;
        this._update();
        this._draw();
        requestAnimationFrame(() => this._loop());
    }

    _update() {
        if (!this.game || !this.side || !this.game.running) return;

        let currentY = this.game.paddles[this.side];
        let newY = currentY;

        if (this.moveUp) newY -= this.playerSpeed;
        if (this.moveDown) newY += this.playerSpeed;

        newY = Math.max(0, Math.min(this.config.height - this.config.paddleHeight, newY));

        if (newY !== currentY) {
            this.socket.emit('paddle-move', { y: newY });
            this.game.paddles[this.side] = newY;
        }

        if (this.side) {
            this.renderedY += (this.game.paddles[this.side] - this.renderedY) * 0.3;
        }
    }

    _draw() {
        if (!this.game) return;

        const { width, height, paddleWidth, paddleHeight, ballRadius } = this.config;
        const scaleX = this.canvas.width / width;
        const scaleY = this.canvas.height / height;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(
            this.game.ballX * scaleX,
            this.game.ballY * scaleY,
            ballRadius * scaleX,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // paddles
        ctx.fillStyle = '#fff';

        const leftY = this.side === 'left' ? this.renderedY : this.game.paddles.left;
        ctx.fillRect(
            0,
            leftY * scaleY,
            paddleWidth * scaleX,
            paddleHeight * scaleY
        );

        const rightY = this.side === 'right' ? this.renderedY : this.game.paddles.right;
        ctx.fillRect(
            this.canvas.width - paddleWidth * scaleX,
            rightY * scaleY,
            paddleWidth * scaleX,
            paddleHeight * scaleY
        );

        // score
        ctx.fillStyle = '#fff';
        ctx.font = `${30 * scaleY}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.game.score.left}:${this.game.score.right}`,
            this.canvas.width / 2,
            50 * scaleY
        );
    }

    _drawGameOver() {
        const ctx = this.ctx;
        const lang = getCurrentLang();
        const t = translations[lang];

        let message = t.canvasDraw || 'Draw!';
        if (this.game.score.left > this.game.score.right && this.side === 'left') {
            message = t.canvasWin;
        } else if (this.game.score.right > this.game.score.left && this.side === 'right') {
            message = t.canvasWin;
        } else if (this.game.score.left !== this.game.score.right) {
            message = t.canvasLose;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 60);

        ctx.fillStyle = 'yellow';
        ctx.font = '30px Arial';
        ctx.fillText(t.canvasRestart, this.canvas.width / 2, this.canvas.height / 2 + 20);

        this._waitForRestartClick();
    }


    _waitForRestartClick() {
        this.awaitingRestart = true;

        const lang = getCurrentLang();
        const t = translations[lang];

        const handler = () => {
            this.canvas.removeEventListener('click', handler);
            this.socket.emit('restart-request');
            this._drawOverlay(t.canvasWaiting);
        };

        this.canvas.addEventListener('click', handler);
    }


    _drawOverlay(text) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        const lines = text.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 + i * 30);
        });
    }

}
