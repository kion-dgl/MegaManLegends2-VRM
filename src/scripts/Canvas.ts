import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { selectedCharacter } from "../stores/characterStore";
import { loadCharacter } from "../load/DashLoader";
import { loadTexture } from "../load/DashTexture"
// import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

const scene = new THREE.Scene();
const meshes: THREE.Mesh[] = [];
const canvas = document.getElementById("threejs-canvas");
if (!canvas) {
  throw new Error("canvas element not found");
}

// Initialize camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(2, 2, 5);

// Initialize renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add lights
(() => {
  const ambientLight = new THREE.AmbientLight("white", 0.4);
  const pointLight = new THREE.PointLight("white", 20, 100);
  pointLight.position.set(-2, 2, 2);
  pointLight.castShadow = true;
  pointLight.shadow.radius = 4;
  pointLight.shadow.camera.near = 0.5;
  pointLight.shadow.camera.far = 4000;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  scene.add(ambientLight);
  scene.add(pointLight);
})();

// Add cube
const sideLength = 1;
const cubeGeometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: "#f69f1f",
  metalness: 0.5,
  roughness: 0.7,
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.castShadow = true;
cube.position.y = 1;

// Add controls
const controls = new OrbitControls(camera, canvas);
controls.target = cube.position.clone();
controls.enableDamping = true;
controls.autoRotate = false;
controls.update();

// Add plane
const planeGeometry = new THREE.PlaneGeometry(3, 3);
const planeMaterial = new THREE.MeshLambertMaterial({
  color: "gray",
  emissive: "teal",
  emissiveIntensity: 0.2,
  side: 2,
  transparent: true,
  opacity: 0.4,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotateX(Math.PI / 2);
plane.receiveShadow = true;

// Add objects to scene
scene.add(cube);
meshes.push(cube);
scene.add(plane);

// Add grid helper
const gridHelper = new THREE.GridHelper(20, 20, "teal", "darkgray");
gridHelper.position.y = -0.01;
scene.add(gridHelper);

// Set up character subscription
selectedCharacter.subscribe(async (character) => {
  if (!character) return;

  const { file, texture } = character;
  const req = await fetch(`/MegaManLegends2-VRM/${texture}`);
  if (!req.ok) {
    // Handle HTTP errors
    throw new Error(
      `Failed to load ${texture}: ${req.status} ${req.statusText}`,
    );
  }
  const buffer = await req.arrayBuffer();

  const holder = document.createElement('div');
  holder.setAttribute('class', 'fixed right-10 top-10 z-100')

  const canvi = loadTexture(buffer);
  canvi.forEach(canvas => {
    holder.appendChild(canvas)
  })

  document.body.appendChild(holder)

  const group = await loadCharacter(file, canvi);

  while (meshes.length) {
    const m = meshes.pop();
    m && scene.remove(m);
  }

  // const exporter = new GLTFExporter();

  // // Export the group
  // exporter.parse(
  //   group,
  //   (result: any) => {
  //     // If result is a binary buffer
  //     const json = JSON.stringify(result, null, 2);
  //     const blob = new Blob([json], { type: 'application/json' });
  //     const link = document.createElement('a');
  //     link.href = URL.createObjectURL(blob);
  //     link.download = 'model.gltf';
  //     link.click();
  //   },
  //   // Optional options for GLTFExporter
  //   {
  //     binary: false, // Set to true if you want a binary .glb file, false for .gltf
  //   }
  // );


  scene.add(group);
});

// Helper
// const skin = readBones();


// Handle window resize
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
animate();

const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener("resize", handleResize);
