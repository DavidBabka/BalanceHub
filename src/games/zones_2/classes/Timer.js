import { CONFIG } from '../config/config.js';
import { translations } from '../../../utils/translations.js';
import { getCurrentLang } from '../../../utils/translation-utils.js';

export class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.running = false;
    }

    start() {
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.running = true;
    }

    update(ctx) {
        if (this.running) {
            const newElapsed = (performance.now() - this.startTime) / 1000;
            this.elapsedTime = parseFloat(newElapsed.toFixed(2));
        }

        const displayTime = this.elapsedTime.toFixed(2).padEnd(5, "0");

        ctx.save();
        ctx.font = "20px monospace";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
            translations[getCurrentLang()]["canvasTime"] +
                displayTime +
                translations[getCurrentLang()]["canvasSeconds"],
            10,
            10
        );
        ctx.restore();
    }

    stop() {
        this.running = false;
    }

    getTime() {
        return this.elapsedTime;
    }
}
