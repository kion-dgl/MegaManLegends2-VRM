import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { selectedCharacter } from "../stores/characterStore";
import { loadCharacter } from "../load/DashLoader";

const scene = new THREE.Scene();
const meshes: THREE.Mesh[] = [];
const canvas = document.getElementById("threejs-canvas");
if (!canvas) {
  throw new Error("canvas element not found");
}

const readBones = () => {
  const boneSrc = [
    {
      pos: {
        x: 0,
        y: 0.90625,
        z: -1.1098361617272889e-16,
      },
      name: "bone_000",
      parent: -1,
    },
    {
      pos: {
        x: 0,
        y: 0.2575,
        z: -3.153465507804434e-17,
      },
      name: "bone_001",
      parent: 0,
    },
    {
      pos: {
        x: -0.17500000000000002,
        y: 0.1625,
        z: -0.01250000000000002,
      },
      name: "bone_002",
      parent: 0,
    },
    {
      pos: {
        x: -0.025,
        y: -0.2,
        z: 2.4492935982947065e-17,
      },
      name: "bone_003",
      parent: 2,
    },
    {
      pos: {
        x: 0,
        y: -0.1525,
        z: 1.8675863686997135e-17,
      },
      name: "bone_004",
      parent: 3,
    },
    {
      pos: {
        x: 0.17500000000000002,
        y: 0.1625,
        z: -0.01250000000000002,
      },
      name: "bone_005",
      parent: 0,
    },
    {
      pos: {
        x: 0.025,
        y: -0.2,
        z: 2.4492935982947065e-17,
      },
      name: "bone_006",
      parent: 5,
    },
    {
      pos: {
        x: 0,
        y: -0.1525,
        z: 1.8675863686997135e-17,
      },
      name: "bone_007",
      parent: 6,
    },
    {
      pos: {
        x: 0,
        y: 0,
        z: 0,
      },
      name: "bone_008",
      parent: 0,
    },
    {
      pos: {
        x: -0.08125,
        y: -0.09125,
        z: 1.1174902042219598e-17,
      },
      name: "bone_009",
      parent: 8,
    },
    {
      pos: {
        x: 0,
        y: -0.28125,
        z: 3.444319122601931e-17,
      },
      name: "bone_010",
      parent: 9,
    },
    {
      pos: {
        x: 0,
        y: -0.34875,
        z: 4.2709557120263944e-17,
      },
      name: "bone_011",
      parent: 10,
    },
    {
      pos: {
        x: 0.08125,
        y: -0.09125,
        z: 1.1174902042219598e-17,
      },
      name: "bone_012",
      parent: 8,
    },
    {
      pos: {
        x: 0,
        y: -0.28125,
        z: 3.444319122601931e-17,
      },
      name: "bone_013",
      parent: 12,
    },
    {
      pos: {
        x: 0,
        y: -0.34875,
        z: 4.2709557120263944e-17,
      },
      name: "bone_014",
      parent: 13,
    },
  ];

  const bones: THREE.Bone[] = [];
  boneSrc.forEach((src) => {
    const bone = new THREE.Bone();

    bone.position.x = src.pos.x;
    bone.position.y = src.pos.y;
    bone.position.z = src.pos.z;
    bone.name = src.name;

    if (bones[src.parent]) {
      bones[src.parent].add(bone);
    }

    bones.push(bone);
  });

  bones.forEach((bone) => {
    bone.updateMatrix();
    bone.updateMatrixWorld();
  });

  const skel = new THREE.Skeleton(bones);
  const geo = new THREE.BufferGeometry();
  const skin = new THREE.SkinnedMesh(geo);
  const rootBone = skel.bones[0];
  skin.add(rootBone);
  return skin;
};

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

  const bodyMesh = await loadCharacter(character.file);

  while (meshes.length) {
    const m = meshes.pop();
    m && scene.remove(m);
  }

  scene.add(bodyMesh[0]);
  meshes.push(bodyMesh[0]);
  meshes.push(skin);
});

// Helper
const skin = readBones();
const helper = new THREE.SkeletonHelper(skin);
scene.add(helper);

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
