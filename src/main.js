import * as THREE from 'three';
import { GhostSprite } from './ghostSprite.js';
import { ScoreSystem } from './scoreSystem.js';
import { UIManager } from './uiManager.js';

// ---------------------------------------------
// 0. FULL-SCREEN CSS FIX
// ---------------------------------------------
const style = document.createElement('style');
style.innerHTML = `
  body { margin: 0; padding: 0; overflow: hidden; background-color: #2d1b4e; }
  canvas { display: block; width: 100vw; height: 100vh; }
`;
document.head.appendChild(style);

// ---------------------------------------------
// 1. SCENE & CAMERA SETUP
// ---------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2d1b4e);

const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 16;
const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2, (frustumSize * aspect) / 2,
  frustumSize / 2, frustumSize / -2, 0.1, 1000
);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---------------------------------------------
// 2. MAZE & COLLISION SETUP
// ---------------------------------------------
const mazeWidth = 24; 
const mazeHeight = 18; 

const mazeImg = new Image();
mazeImg.src = '/maze.jpg';

let collisionCanvas, collisionCtx;
mazeImg.onload = () => {
  collisionCanvas = document.createElement('canvas');
  collisionCanvas.width = mazeImg.width;
  collisionCanvas.height = mazeImg.height;
  collisionCtx = collisionCanvas.getContext('2d', { willReadFrequently: true });
  collisionCtx.drawImage(mazeImg, 0, 0);
};

const textureLoader = new THREE.TextureLoader();
const mazeTexture = textureLoader.load('/maze.jpg');
mazeTexture.colorSpace = THREE.SRGBColorSpace;

const mazeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(mazeWidth, mazeHeight),
  new THREE.MeshBasicMaterial({ map: mazeTexture })
);
scene.add(mazeMesh);

function isWalkable(x, y) {
  if (!collisionCtx) return true; 
  const u = (x + mazeWidth / 2) / mazeWidth;
  const v = 1 - (y + mazeHeight / 2) / mazeHeight;
  const px = Math.floor(u * collisionCanvas.width);
  const py = Math.floor(v * collisionCanvas.height);

  if (px < 0 || px >= collisionCanvas.width || py < 0 || py >= collisionCanvas.height) return false;

  const pixel = collisionCtx.getImageData(px, py, 1, 1).data;
  return pixel[0] > 120 && pixel[1] > 120 && pixel[2] < 100;
}

// ---------------------------------------------
// 3. GAME SYSTEMS & UI INITIALIZATION
// ---------------------------------------------
const gemCount = 5;
const scoreSystem = new ScoreSystem();
const uiManager = new UIManager(gemCount);

let collectedGemsCount = 0;
let timeLeft = 90.0;
let gameOver = false;
let gameStarted = false; // Pauses game until tutorial/countdown finishes

// Trigger the interactive instruction card carousel & countdown
uiManager.showTutorialModal(() => {
  gameStarted = true;
  uiManager.showHUD();
  lastTime = performance.now(); // Reset clock so timer starts fresh on "GO!"
});

// Finish Portal (Shifted slightly left to -0.8)
const finishGeo = new THREE.CircleGeometry(0.5, 16);
const finishMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.6 });
const finishMesh = new THREE.Mesh(finishGeo, finishMat);
finishMesh.position.set(-0.8, 6.8, 0.3); 
scene.add(finishMesh);

// Gem Spawner (Balanced inner bounds)
const gems = [];
function spawnGemsWhenReady() {
  if (!collisionCtx) {
    setTimeout(spawnGemsWhenReady, 100);
    return;
  }

  for (let i = 0; i < gemCount; i++) {
    let placed = false;
    let rx, ry;

    while (!placed) {
      rx = (Math.random() - 0.5) * (mazeWidth * 0.75); 
      ry = (Math.random() - 0.5) * (mazeHeight * 0.75);

      if (isWalkable(rx, ry)) {
        placed = true;
      }
    }

    const gemGeo = new THREE.CircleGeometry(0.3, 16);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.set(rx, ry, 0.3);
    
    scene.add(gemMesh);
    gems.push({ mesh: gemMesh, collected: false });
  }
}
setTimeout(spawnGemsWhenReady, 500);

// ---------------------------------------------
// 4. GHOST & INPUT LISTENERS
// ---------------------------------------------
const ghost = new GhostSprite(scene);
ghost.mesh.position.set(0, -7.2, 0.5);

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.addEventListener('resize', () => {
  const newAspect = window.innerWidth / window.innerHeight;
  camera.left = (frustumSize * newAspect) / -2;
  camera.right = (frustumSize * newAspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = frustumSize / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------
// 5. ANIMATION LOOP
// ---------------------------------------------
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // Only run gameplay loop after tutorial modal and countdown complete
  if (gameStarted && !gameOver) {
    // Reduced speed (3.5) for better cornering in narrow hedge spaces
    const speed = 3.5;
    let moveX = 0;
    let moveY = 0;

    if (keys.KeyW || keys.ArrowUp) moveY += speed * delta;
    if (keys.KeyS || keys.ArrowDown) moveY -= speed * delta;
    if (keys.KeyA || keys.ArrowLeft) moveX -= speed * delta;
    if (keys.KeyD || keys.ArrowRight) moveX += speed * delta;

    const currentPos = ghost.mesh.position;
    const targetX = currentPos.x + moveX;
    const targetY = currentPos.y + moveY;

    let isMoving = false;
    if (moveX !== 0 && isWalkable(targetX, currentPos.y)) {
      currentPos.x = targetX;
      isMoving = true;
    }
    if (moveY !== 0 && isWalkable(currentPos.x, targetY)) {
      currentPos.y = targetY;
      isMoving = true;
    }

    // Gem Collection
    gems.forEach(gem => {
      if (!gem.collected && ghost.mesh.position.distanceTo(gem.mesh.position) < 0.6) {
        gem.collected = true;
        scene.remove(gem.mesh);
        collectedGemsCount++;
        uiManager.updateGems(collectedGemsCount);
      }
    });

    // Timer & Game Over Check
    timeLeft -= delta;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver = true;
      uiManager.updateTimer(0);
      uiManager.showGameOverOverlay();
    } else {
      uiManager.updateTimer(timeLeft);
    }

    // Finish Portal Unlock & Win Condition
    if (collectedGemsCount >= gemCount) {
      finishMat.color.set(0xff00aa);
      finishMat.opacity = 0.9;
      
      if (ghost.mesh.position.distanceTo(finishMesh.position) < 0.6) {
        gameOver = true;
        const results = scoreSystem.calculateWinScore(collectedGemsCount, timeLeft);
        uiManager.showVictoryOverlay(results);
      }
    }

    ghost.update(delta, isMoving);
  }

  renderer.render(scene, camera);
}

animate(performance.now());