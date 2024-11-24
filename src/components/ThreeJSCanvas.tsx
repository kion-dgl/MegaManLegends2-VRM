import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeJSCanvasProps {
  className?: string;
}

const ThreeJSCanvas = ({ className }: ThreeJSCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs to store Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize scene
    sceneRef.current = new THREE.Scene();
    
    // Initialize camera
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(2, 2, 5);

    // Initialize renderer
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: canvasRef.current
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);

    // Add lights
    const ambientLight = new THREE.AmbientLight('white', 0.4);
    const pointLight = new THREE.PointLight('white', 20, 100);
    pointLight.position.set(-2, 2, 2);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 4;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 4000;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    sceneRef.current.add(ambientLight);
    sceneRef.current.add(pointLight);

    // Add cube
    const sideLength = 1;
    const cubeGeometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: '#f69f1f',
      metalness: 0.5,
      roughness: 0.7,
    });
    cubeRef.current = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeRef.current.castShadow = true;
    cubeRef.current.position.y = 1;

    // Add controls
    controlsRef.current = new OrbitControls(cameraRef.current, canvasRef.current);
    controlsRef.current.target = cubeRef.current.position.clone();
    controlsRef.current.enableDamping = true;
    controlsRef.current.autoRotate = false;
    controlsRef.current.update();

    // Add plane
    const planeGeometry = new THREE.PlaneGeometry(3, 3);
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: 'gray',
      emissive: 'teal',
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4,
    });
    planeRef.current = new THREE.Mesh(planeGeometry, planeMaterial);
    planeRef.current.rotateX(Math.PI / 2);
    planeRef.current.receiveShadow = true;

    // Add objects to scene
    sceneRef.current.add(cubeRef.current);
    sceneRef.current.add(planeRef.current);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 'teal', 'darkgray');
    gridHelper.position.y = -0.01;
    sceneRef.current.add(gridHelper);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !cubeRef.current || !controlsRef.current) return;

      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Rotate cube
      cubeRef.current.rotation.x += 0.01;
      cubeRef.current.rotation.y += 0.01;
      
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(0deg,#08a3a6,#4fa6a7d8 4%,#3d4f5ee2 30%,#111317)'
      }}
    />
  );
};

export { ThreeJSCanvas };