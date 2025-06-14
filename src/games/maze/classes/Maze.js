export class Maze {
    constructor(
      scene,
      rows = 5,
      cols = 5,
      cellSize = 4,
      shadowGen,
      thickness = 0.3,
      wallHeight = 2
    ) {
      this.scene = scene;
      this.rows = rows;
      this.cols = cols;
      this.cellSize = cellSize;
      this.shadowGen = shadowGen;
      this.thickness = thickness;
      this.wallHeight = wallHeight;
  
      this.parent = new BABYLON.TransformNode("mazeParent", scene);
      this.tiltX = 0;
      this.tiltZ = 0;
      this.maxTilt = BABYLON.Tools.ToRadians(25);
  
      this.startSphere = null;
      this.finishBox = null;
    }
  
    createMaze() {
      const { rows, cols, cellSize, scene, parent, shadowGen, thickness, wallHeight } = this;
      const width = cols * cellSize;
      const height = rows * cellSize;
  
      const ground = BABYLON.MeshBuilder.CreateGround("ground", { width, height }, scene);
      ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.8, friction: 0.1 },
        scene
      );

      const mat = new BABYLON.StandardMaterial('groundMat', scene);
      mat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
      mat.specularColor = new BABYLON.Color3(0, 0, 0);   // ✨ no specular highlights (removes gloss)
      ground.material = mat;

      ground.parent = parent;
      shadowGen.addShadowCaster(ground);
  
      const roof = BABYLON.MeshBuilder.CreateGround("roof", { width, height }, scene);
      roof.physicsImpostor = new BABYLON.PhysicsImpostor(
        roof,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.8, friction: 0.1 },
        scene
      );
      roof.position.set(0, wallHeight + 1, 0);
      roof.isVisible = false;
      roof.parent = parent;
  
      const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
      const hWalls = Array.from({ length: rows + 1 }, () => Array(cols).fill(true));
      const vWalls = Array.from({ length: rows }, () => Array(cols + 1).fill(true));
  
      const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  
      (function carve(r, c) {
        visited[r][c] = true;
        for (const [dr, dc, type, wr, wc] of shuffle([
          [1, 0, 'h', r + 1, c],
          [-1, 0, 'h', r, c],
          [0, 1, 'v', r, c + 1],
          [0, -1, 'v', r, c]
        ])) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
            if (type === 'h') hWalls[wr][wc] = false;
            else vWalls[wr][wc] = false;
            carve(nr, nc);
          }
        }
      })(0, 0);
  
      this.startSphere = (() => {
        const s = BABYLON.MeshBuilder.CreateSphere('start', { diameter: cellSize / 2 }, scene);
        s.position.set(-width / 2 + cellSize / 2, 2, -height / 2 + cellSize / 2);
        const mat = new BABYLON.StandardMaterial('startMat', scene);
        mat.diffuseColor = BABYLON.Color3.Red();
        s.material = mat;
        s.physicsImpostor = new BABYLON.PhysicsImpostor(
          s,
          BABYLON.PhysicsImpostor.SphereImpostor,
          { mass: 0.1, restitution: 0.9, friction: 0.02 },
          scene
        );
        s.parent = parent;
        shadowGen.addShadowCaster(s);
        return s;
      })();
  
      const finish = BABYLON.MeshBuilder.CreateBox(
        'finish',
        { size: cellSize * 0.5 },
        scene
      );
      finish.position.set(
        width / 2 - cellSize / 2,
        wallHeight / 2,
        height / 2 - cellSize / 2
      );
      const finishMat = new BABYLON.StandardMaterial('finishMat', scene);
      finishMat.diffuseColor = BABYLON.Color3.Green();
      finishMat.alpha = 0.8;
      finish.material = finishMat;
      finish.physicsImpostor = new BABYLON.PhysicsImpostor(
        finish,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0 },
        scene
      );
      
      finish.parent = parent;
      this.finishBox = finish;
  
      const wallMeshes = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (hWalls[r][c]) {
            const w = BABYLON.MeshBuilder.CreateBox(
              `h${r}_${c}`,
              { width: cellSize+thickness, height: wallHeight, depth: thickness },
              scene
            );
            w.position.set(
              c * cellSize - width / 2 + cellSize / 2,
              wallHeight / 2,
              r * cellSize - height / 2
            );
            w.parent = parent;
            wallMeshes.push(w);
          }
        }
      }
  
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= cols; c++) {
          if (vWalls[r][c]) {
            const w = BABYLON.MeshBuilder.CreateBox(
              `v${r}_${c}`,
              { width: thickness, height: wallHeight, depth: cellSize+thickness },
              scene
            );
            w.position.set(
              c * cellSize - width / 2,
              wallHeight / 2,
              r * cellSize - height / 2 + cellSize / 2
            );
            w.parent = parent;
            wallMeshes.push(w);
          }
        }
      }
  
      const merged = BABYLON.Mesh.MergeMeshes(wallMeshes, true, true, undefined, false, true);
      merged.physicsImpostor = new BABYLON.PhysicsImpostor(
        merged,
        BABYLON.PhysicsImpostor.MeshImpostor,
        { mass: 0, restitution: 0.1, friction: 0.1 },
        scene
      );
      merged.parent = parent;
      const matW = new BABYLON.StandardMaterial('wallMat', scene);
      matW.diffuseColor = BABYLON.Color3.Blue();
      matW.specularColor = new BABYLON.Color3(0, 0, 0);   // ✨ no specular highlights (removes gloss)
      merged.material = matW;
      shadowGen.addShadowCaster(merged);
    }
  
    tilt(dx, dy) {
      const targetZ = BABYLON.Scalar.Clamp(dx * this.maxTilt, -this.maxTilt, this.maxTilt);
      const targetX = BABYLON.Scalar.Clamp(dy * this.maxTilt, -this.maxTilt, this.maxTilt);
  
      const lerpSpeed = 0.1;
      this.tiltZ = BABYLON.Scalar.Lerp(this.tiltZ, targetZ, lerpSpeed);
      this.tiltX = BABYLON.Scalar.Lerp(this.tiltX, targetX, lerpSpeed);
  
      this.parent.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(
        0,
        this.tiltZ,
        this.tiltX
      );
    }
  }
  