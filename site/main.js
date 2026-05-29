import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

// import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';


const scene = new THREE.Scene();


// Fundo Estrelado

const textureLoader = new THREE.TextureLoader();

const skyTexture = textureLoader.load('./textures/stars.jpg');

scene.background = skyTexture;

// --

const skyGeometry = new THREE.SphereGeometry(10000, 64, 64);

const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide
});

skyTexture.colorSpace = THREE.SRGBColorSpace;

const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);

scene.add(skySphere);

// Terra

const earthTexture = textureLoader.load('./textures/earth.jpg');

const earthGeometry = new THREE.SphereGeometry(8, 32, 32);

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  emissive: 0x223344,
  emissiveIntensity: 0.35
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);

earth.position.set(-100, 30, -100);

scene.add(earth);

const earthGlowGeometry = new THREE.SphereGeometry(9, 32, 32);

const earthGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0x66aaff,
  transparent: true,
  opacity: 0.1
});

const earthGlow = new THREE.Mesh(earthGlowGeometry, earthGlowMaterial);

earthGlow.position.copy(earth.position);

scene.add(earthGlow);

// Sol

const sunTexture = textureLoader.load('./textures/sun.jpg');

const sunGeometry = new THREE.SphereGeometry(20, 32, 32);

const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture
});

const sun = new THREE.Mesh(sunGeometry, sunMaterial);

sun.position.set(-100, 50, -600);

scene.add(sun);

const sunGlowGeometry = new THREE.SphereGeometry(25, 32, 32);

const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa33,
  transparent: true,
  opacity: 0.18
});

const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);

sunGlow.position.copy(sun.position);

scene.add(sunGlow);


// Camera, iluminação, fog

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();

renderer.shadowMap.enabled = true;

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1;

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

camera.position.set(0, 50, 50);

camera.lookAt(0,0,0);

const light = new THREE.DirectionalLight(0xffffff, 2.5);

light.position.set(-200, 100, -100);

light.castShadow = true;

scene.add(light);

const ambient = new THREE.AmbientLight(0x404040, 0.5);

scene.add(ambient);

light.position.set(50, 50, 50);

scene.add(light);

const response = await fetch('../data/terrain.json');

const terrain = await response.json();


console.log(terrain);


skyMaterial.fog = false;
sunMaterial.fog = false;
sunGlowMaterial.fog = false;
earthMaterial.fog = false;
earthGlowMaterial.fog = false;
scene.fog = new THREE.Fog(0x000000, 200, 700);

// ---------------------------------- Lua

const moonTexture = textureLoader.load('./textures/moon.jpg');

// tamanho do mapa
const width = terrain.length;
const height = terrain[0].length;

let terrainMesh = null;

const CHUNK_SIZE = 128;

let chunkX = 0;
let chunkY = 0;

const viewport =
  document.getElementById('viewport');

const minimapSize = 220;

function generateChunk(startX, startY) {

  // remove chunk antigo
  if (terrainMesh) {
    scene.remove(terrainMesh);
    terrainMesh.geometry.dispose();
  }

  // geometria
  const geometry = new THREE.PlaneGeometry(
    300,
    300,
    CHUNK_SIZE - 1,
    CHUNK_SIZE - 1
  );

  const uvs = geometry.attributes.uv;

  const vertices = geometry.attributes.position;

  for (let i = 0; i < vertices.count; i++) {

    const localX = i % CHUNK_SIZE;
    const localY = Math.floor(i / CHUNK_SIZE);

    const mapX =
    (startX + localX + terrain.length)
    % terrain.length;

    const mapY =
    (startY + localY + terrain[0].length)
    % terrain[0].length;

    // evita sair do mapa
    if (
      mapX >= terrain.length ||
      mapY >= terrain[0].length
    ) continue;

    let h = terrain[mapX][mapY];

    vertices.setZ(i, h / 30);

  }

  for (let i = 0; i < uvs.count; i++) {

  const localX = i % CHUNK_SIZE;
  const localY = Math.floor(i / CHUNK_SIZE);

  const mapX = startX + localX;
  const mapY = startY + localY;

  // UV global
  const u = mapX / terrain.length;
  const v = mapY / terrain[0].length;

  uvs.setXY(i, u, v);

  }

  uvs.needsUpdate = true;

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 1,
    metalness: 0
  });

    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.RepeatWrapping;

  terrainMesh = new THREE.Mesh(geometry, material);

  terrainMesh.rotation.x = -Math.PI / 2;

  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;

  scene.add(terrainMesh);

}

function updateMinimap() {

  const mapWidth = terrain.length;
  const mapHeight = terrain[0].length;

  // posição EXATA do chunk
  const wrappedX =
  ((chunkX % mapWidth) + mapWidth)
  % mapWidth;

    const wrappedY =
    ((chunkY % mapHeight) + mapHeight)
    % mapHeight;

    const x =
    (wrappedX / mapWidth)
    * minimapSize;

    const y =
    (wrappedY / mapHeight)
    * minimapSize;

  // tamanho EXATO do chunk
  const w =
    (CHUNK_SIZE / mapWidth)
    * minimapSize;

  const h =
    (CHUNK_SIZE / mapHeight)
    * minimapSize;

  viewport.style.left = `${x}px`;

  viewport.style.top = `${y}px`;

  viewport.style.width = `${w}px`;

  viewport.style.height = `${h}px`;

}

generateChunk(0, 0);

camera.lookAt(
  terrainMesh.position.x,
  0,
  terrainMesh.position.z
);

// ----------------------------------

let isDragging = false;

let previousMousePosition = {
  x: 0,
  y: 0
};

let cameraAngleX = 0;
let cameraAngleY = 0;

let cameraDistance = 120;

animate();

function animate() {

  requestAnimationFrame(animate);

  camera.position.x =
    Math.sin(cameraAngleX)
    * cameraDistance;

  camera.position.z =
    Math.cos(cameraAngleX)
    * cameraDistance;

  camera.position.y =
    40 + Math.sin(cameraAngleY) * 80;

  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);

}



// Controles Mouse

window.addEventListener('mousedown', (event) => {

  if (event.button === 0) {

    isDragging = true;

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };

  }

});


window.addEventListener('mouseup', () => {

  isDragging = false;

});

window.addEventListener('mousemove', (event) => {

  if (!isDragging) return;

  const deltaX =
    event.clientX - previousMousePosition.x;

  const deltaY =
    event.clientY - previousMousePosition.y;

  cameraAngleX += deltaX * 0.005;

  cameraAngleY += deltaY * 0.005;

  cameraAngleY = Math.max(
    -1.4,
    Math.min(1.4, cameraAngleY)
  );

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };

});



// Controles Teclado

window.addEventListener('keydown', (event) => {

  if (event.key === 'ArrowUp') {
    chunkY -= 20;
  }

  if (event.key === 'ArrowDown') {
    chunkY += 20;
  }

  if (event.key === 'ArrowRight') {
    chunkX += 20;
  }

  if (event.key === 'ArrowLeft') {
    chunkX -= 20;
  }

  generateChunk(chunkX, chunkY);

  updateMinimap();
  

});

window.addEventListener('wheel', (event) => {

  cameraDistance += event.deltaY * 0.05;

    cameraDistance = Math.max(
    20,
    Math.min(300, cameraDistance)
    );

});

//const controls = new OrbitControls(camera, renderer.domElement);

//controls.enableDamping = true;


