import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

// import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';


const scene = new THREE.Scene();


// Fundo Estrelado

const textureLoader = new THREE.TextureLoader();

const skyTexture = textureLoader.load('./textures/stars.jpg');

scene.background = skyTexture;

// --

const skyGeometry = new THREE.SphereGeometry(10000, 16, 16);

const skyMaterial = new THREE.MeshBasicMaterial({
  map: skyTexture,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false
});

skyTexture.colorSpace = THREE.SRGBColorSpace;

const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);

scene.add(skySphere);

// Terra

const earthTexture = textureLoader.load('./textures/earth.jpg');

const earthGeometry = new THREE.SphereGeometry(64, 32, 32);

const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  emissive: 0x223344,
  emissiveIntensity: 0.35
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);

earth.position.set(-600, 50, 600);

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

sun.position.set(500, 100, -700);

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

light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;

scene.add(light);

const ambient =
  new THREE.AmbientLight(
    0x8899aa,
    1.2
  );

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

const moonTexture = textureLoader.load('./textures/moon-8k.jpg');

moonTexture.colorSpace = THREE.SRGBColorSpace;

moonTexture.minFilter = THREE.LinearFilter;

//moonTexture.magFilter = THREE.NearestFilter;

moonTexture.generateMipmaps = false;

moonTexture.anisotropy =
  renderer.capabilities.getMaxAnisotropy();

// tamanho do mapa
const width = terrain.length;
const height = terrain[0].length;

let terrainMesh = null;

let CHUNK_HEIGHT = 256;
let CHUNK_WIDTH = 128;

let chunkX = Math.floor(terrain.length / 2);

let chunkY = Math.floor(terrain[0].length / 2);

const viewport =
  document.getElementById('viewport');

const minimapWidth = 320;
const minimapHeight = 160;


function wrap(value, max) {

  return ((value % max) + max) % max;

}

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
    CHUNK_WIDTH - 1,
    CHUNK_HEIGHT - 1
  );

  const uvs = geometry.attributes.uv;

  const vertices = geometry.attributes.position;

  for (let i = 0; i < vertices.count; i++) {

    const localX = i % CHUNK_WIDTH;

  const localY =
    Math.floor(i / CHUNK_WIDTH);

    const mapX =
    wrap(startX + localX, terrain.length);

    const mapY =
   wrap(startY + localY, terrain[0].length);

    

    let h = terrain[mapX][mapY];

    vertices.setZ(i, h / 15);

  }

  for (let i = 0; i < uvs.count; i++) {

  const localX = i % CHUNK_WIDTH;

  const localY =
    Math.floor(i / CHUNK_WIDTH);

  const mapX =
  wrap(startX + localX, terrain.length);

  const mapY =
  wrap(startY + localY, terrain[0].length);

  // UV global
  const u = mapX / terrain.length;
  const v = 1 -(mapY / terrain[0].length);

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
    * minimapWidth;

    const y =
    (wrappedY / mapHeight)
    * minimapHeight;

  // tamanho EXATO do chunk
  const w =
  (CHUNK_WIDTH / mapWidth)
  * minimapWidth;

const h =
  (CHUNK_HEIGHT / mapHeight)
  * minimapHeight;

  viewport.style.left = `${x}px`;

  viewport.style.top = `${y}px`;

  viewport.style.width = `${w}px`;

  viewport.style.height = `${h}px`;

}

generateChunk(chunkX, chunkY);

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

let introTime = 0;

let autoRotate = true;

let userInteracted = false;


window.changeChunkSize = function(size) {

  CHUNK_HEIGHT = size;

  CHUNK_WIDTH = Math.floor(size / 2);

  generateChunk(chunkX, chunkY);

  updateMinimap();

}


animate();

function animate() {

  requestAnimationFrame(animate);

  // INTRO AUTOMÁTICA

if (introTime < 3) {

  introTime += 0.016;

  cameraDistance +=
  (150 - cameraDistance) * 0.01;

  cameraAngleY +=
  (1.5 - cameraAngleY) * 0.01;

}

  skySphere.position.copy(camera.position);


  // rotação automática

if (autoRotate && !userInteracted) {

  cameraAngleX += 0.0015;

}

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

  userInteracted = true;

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

const keys = {};

window.addEventListener('keydown', (event) => {

  keys[event.key] = true;

  if (keys['ArrowUp'] || keys['w']) {
    chunkY -= 20;
  }

  if (keys['ArrowDown'] || keys['s']) {
    chunkY += 20;
  }

  if (keys['ArrowRight'] || keys['d']) {
    chunkX += 10;
  }

  if (keys['ArrowLeft'] || keys['a']) {
    chunkX -= 10;
  }

  generateChunk(chunkX, chunkY);

  updateMinimap();

});


window.addEventListener('keyup', (event) => {

  keys[event.key] = false;

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


