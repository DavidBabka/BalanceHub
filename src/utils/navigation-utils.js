import { translations } from "./translations.js";
import { getCurrentLang } from "./translation-utils.js";
const gameModules = import.meta.glob('../games/*/game.js');

let currentGameModule = null;

function navigateTo(state) {
    document.querySelectorAll('.state').forEach(el => el.classList.add('hidden'));
    document.getElementById(state)?.classList.remove('hidden');
}

export function addButtonListeners() {
    document.getElementById("connect-controller-btn")?.addEventListener("click", () => {
        navigateTo("controllers");
    });
    document.getElementById("about-btn")?.addEventListener("click", () => {
        navigateTo("about");
    });
    document.getElementById("games-btn")?.addEventListener("click", () => {
        navigateTo("games");
    });
    document.getElementById("game-back-btn")?.addEventListener("click", () => {
        stopCurrentGame();
        navigateTo("games");
    });
    document.querySelectorAll(".menu-back-btn").forEach(el =>
        el.addEventListener("click", () => {
            stopCurrentGame();
            navigateTo("home");
        })
    );

    // Zones / Moving-walls / Zones-2 reuse loadGame…
    document.getElementById("zones-btn")?.addEventListener("click", () => loadGame("zones"));
    document.getElementById("moving-walls-btn")?.addEventListener("click", () => loadGame("moving-walls"));
    document.getElementById("zones-2-btn")?.addEventListener("click", () => loadGame("zones_2"));
    document.getElementById("maze-btn")?.addEventListener("click", () => loadGame("maze"));
    document.getElementById("pingpong-btn")?.addEventListener("click", () => loadGame("pingpong"));

}

async function loadGame(name) {
    // stop whatever was running
    stopCurrentGame();


    // make sure the canvas is visible again
    const canvas = document.getElementById("renderCanvas");
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const path = `../games/${name}/game.js`;
    const importer = gameModules[path];

    try {
        const mod = await importer();
        currentGameModule = mod;
        // mod.startGame();
        // mod.gameLoop();
        currentGameModule.startGame();
        // currentGameModule.gameLoop();
        navigateTo("game");
    } catch (err) {
        console.error("Failed to load", name, err);
    }
}


function stopCurrentGame() {
    if (currentGameModule?.stopGame) {
        currentGameModule.stopGame();
        currentGameModule = null;
    }
}

window.addEventListener("beforeunload", stopCurrentGame);
// make sure to call addButtonListeners() once on startup:
addButtonListeners();
