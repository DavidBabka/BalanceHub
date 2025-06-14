import { SocketHandler } from "./SocketHandler.js";
import { Maze } from "./Maze.js";
import { startGame, stopGame } from "../game.js";
import { translations } from '../../../utils/translations.js';
import { getCurrentLang } from '../../../utils/translation-utils.js';
// import * as CANNON   from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';
import * as CANNON from 'cannon-es';
import * as BABYLON from 'babylonjs';

export class Game {
  constructor(canvas, socket, rows = 5, cols = 5, cellSize = 4) {
    this.canvas = canvas;
    this.socketHandler = new SocketHandler(socket);
    this.running = false;
    this.destroyed = false;
    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = null;
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.maze = null;

    this._onResize = () => this.engine.resize();
    this._onKeyDown = (e) => { if (this.keyMap) this.keyMap[e.code] = true; };
    this._onKeyUp = (e) => { if (this.keyMap) this.keyMap[e.code] = false; };
  }

  renderGameOverOverlay() {
    if (document.getElementById("gameOverOverlay")) return;
  
    const overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";
    Object.assign(overlay.style, {
      position:     "fixed",
      top:          "0",
      left:         "0",
      width:        "100%",
      height:       "100%",
      background:   "rgba(0, 0, 0, 0.5)",    // same 50% opacity
      display:      "flex",
      flexDirection:"column",               // stack the lines
      justifyContent:"center",
      alignItems:   "center",
      textAlign:    "center",
      cursor:       "pointer",
      zIndex:       "9999"
    });
  
    // 1) “Start Again” in white, 50px Arial
    const line1 = document.createElement("div");
    line1.innerText = translations[getCurrentLang()]["canvasCongratulation"];
    Object.assign(line1.style, {
      color:    "#fff",
      font:     "50px Arial",
      margin:   "0 0 20px"    // spacing to next line
    });
  
    // 2) “Restart” in yellow, 30px Arial
    const line2 = document.createElement("div");
    line2.innerText = translations[getCurrentLang()]["canvasRestart"];
    Object.assign(line2.style, {
      color:    "yellow",
      font:     "30px Arial",
      margin:   "0 0 20px"
    });
   
    overlay.append(line1, line2);
    overlay.addEventListener("click", () => {
      overlay.remove();
      stopGame();
      startGame();
    });
  
    document.body.appendChild(overlay);
  }
  

  createScene() {
    const scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    window.CANNON = CANNON;

    const gravity = new BABYLON.Vector3(0, -12, 0);
    // scene.enablePhysics(gravity, new BABYLON.CannonJSPlugin());
    const cannonPlugin = new BABYLON.CannonJSPlugin();
    cannonPlugin.world.add = cannonPlugin.world.addBody;
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
    // scene.enablePhysics(gravity, new BABYLON.OimoJSPlugin());

    const camera = new BABYLON.UniversalCamera(
      "UniversalCamera",
      new BABYLON.Vector3(0, 30, 0),
      scene
    );
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(this.canvas, true);
    camera.rotation.y = -BABYLON.Tools.ToRadians(90);

    const light1 = new BABYLON.DirectionalLight(
      "light1",
      new BABYLON.Vector3(1, -2, -1),
      scene
    );
    light1.position = new BABYLON.Vector3(30, 50, 30);
    light1.intensity = 0.4;
    
    // Directional light from back-right
    const light2 = new BABYLON.DirectionalLight(
      "light2",
      new BABYLON.Vector3(-1, -2, 1),
      scene
    );
    light2.position = new BABYLON.Vector3(-30, 50, -30);
    light2.intensity = 0.4;

    const dirLight = new BABYLON.DirectionalLight(
      "mainLight",
      new BABYLON.Vector3(0, -1, 0),  // Slight diagonal angle toward front
      scene
    );
    dirLight.position = new BABYLON.Vector3(0, 30, 0); // Behind and above the camera
    dirLight.intensity = 0.4;
    dirLight.shadowEnabled = true;

    const shadowGen = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;

    this.maze = new Maze(
      scene,
      this.rows,
      this.cols,
      this.cellSize,
      shadowGen
    );
    this.maze.createMaze();

    const ball = this.maze.startSphere;
    const finish = this.maze.finishBox;
    const onWin = () => {

      this.engine.stopRenderLoop();
      this.running = false;
      ball.physicsImpostor.unregisterOnPhysicsCollide(
        finish.physicsImpostor,
        onWin
      );
      this.renderGameOverOverlay();
    };
    ball.physicsImpostor.registerOnPhysicsCollide(
      finish.physicsImpostor,
      onWin
    );

    this.scene = scene;
    return scene;
  }

  start() {
    if (this.destroyed) return;
    this.createScene();

    this.keyMap = {};
    window.addEventListener("resize", this._onResize);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    this.engine.runRenderLoop(() => {
      if (this.destroyed || !this.running) {
        this.engine.stopRenderLoop();
        return;
      }
      const { x, y } = this.socketHandler.getDeltas();
      let kbX = 0, kbY = 0;
      if (this.keyMap["KeyA"]) kbX -= 1;
      if (this.keyMap["KeyD"]) kbX += 1;
      if (this.keyMap["KeyW"]) kbY += 1;
      if (this.keyMap["KeyS"]) kbY -= 1;
      const combinedX = -x + kbX;
      const combinedY = -y + kbY;
      if (this.maze) this.maze.tilt(combinedX, combinedY);
      this.scene.render();
    });

    this.running = true;
  }

  destroy() {
    this.destroyed = true;

    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

    this.engine.stopRenderLoop();
    this.engine.dispose();

    if (this.socketHandler.socket) {
      if (typeof this.socketHandler.socket.disconnect === "function")
        this.socketHandler.socket.disconnect();
      else if (typeof this.socketHandler.socket.close === "function")
        this.socketHandler.socket.close();
    }

    this.socketHandler = null;
    this.maze = null;
    this.keyMap = null;
  }
}
