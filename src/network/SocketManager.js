import { translations } from "../utils/translations.js";
import { getCurrentLang } from "../utils/translation-utils.js";

export class SocketManager {
    constructor(socket) {
        this.socket = socket;
        this.selectedController = null;
        this.setupSocketListeners();
    }

    setupSocketListeners() {

        this.socket.on("connect", () => {
            this.socket.emit("register", { role: "client", name: "Player 1" });
        });

        this.socket.on("availableControllers", availableControllers => {

            this.update();

            const controllerContainer = document.getElementById("availableControllers");
            controllerContainer.innerHTML = "";

            if (availableControllers.length === 0 && !this.selectedController) {
                const p = document.createElement("p");
                p.setAttribute("data-i18n", "noControllerInfo");
                p.innerHTML = translations[getCurrentLang()]["noControllerInfo"];
                controllerContainer.appendChild(p);
            }

            availableControllers.forEach(controller => {
                const btn = document.createElement("button");
                btn.innerText = "Controller: " + controller.name;
                btn.onclick = () => {
                    if (!this.selectedController) {
                        this.selectedController = controller;
                        this.selectedController.available = false;
                        this.socket.emit("selectController", controller.id);
                    }
                };
                controllerContainer.appendChild(btn);
            });
        });
    }

    update() {
        const controllerStatus = document.getElementById("controllerStatus");
        controllerStatus.innerHTML = "";
        if (this.selectedController) {
            const btn = document.createElement("button");
            btn.innerText = "Selected: " + this.selectedController.name;
            btn.classList.add("selected");
            btn.onclick = () => {
                this.socket.emit("deselectController", this.selectedController.id);
                this.selectedController = null;
                btn.classList.remove("selected");
            };
            controllerStatus.appendChild(btn);
        }
    }
}