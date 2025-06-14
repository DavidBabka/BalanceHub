import { Game } from './classes/Game.js';
import { io } from 'socket.io-client';
import { uri } from '../../main.js';

let currentGame = null;

export function startGame() {
    const canvas = document.getElementById("renderCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (currentGame) {
        currentGame.destroy();
        currentGame = null;
    }

    currentGame = new Game(canvas, ctx, io(uri));
    currentGame.start();
}

// shared utility: completely reset the canvas element
function resetCanvas() {
    const oldCanvas = document.getElementById("renderCanvas");
    const newCanvas = oldCanvas.cloneNode(false); // clones attributes (id, style) but no contexts or children
    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
  }
  

export function stopGame() {
    if (currentGame) {
        currentGame.destroy();
        currentGame = null;
    }
    resetCanvas();
}

window.addEventListener("beforeunload", () => {
    stopGame();
});