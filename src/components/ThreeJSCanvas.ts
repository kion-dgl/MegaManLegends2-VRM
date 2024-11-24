import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';


@customElement('threejs-canvas')
class ThreeJSCanvas extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(0deg,#08a3a6,#4fa6a7d8 4%,#3d4f5ee2 30%,#111317);
    }
  `;

  private scene: THREE.Scene | null = null;
  private plane: THREE.Mesh | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private cube: THREE.Mesh | null = null;
  private animationFrameId: number | null = null;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer?.dispose();
  }



  private initThreeJS(): void {
    // Initialize scene
    this.scene = new THREE.Scene();
    
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(2, 2, 5)

    const canvas = this.renderRoot.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Add lights
    const ambientLight = new THREE.AmbientLight('white', 0.4)
    const pointLight = new THREE.PointLight('white', 20, 100)
    pointLight.position.set(-2, 2, 2)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    this.scene.add(ambientLight)
    this.scene.add(pointLight)

    // Add Objects
    const sideLength = 1;
    const cubeGeometry = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: '#f69f1f',
      metalness: 0.5,
      roughness: 0.7,
    });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.castShadow = true;
    this.cube.position.y = 1;

    // Controls
    const cameraControls = new OrbitControls(this.camera, canvas)
    cameraControls.target = this.cube.position.clone()
    cameraControls.enableDamping = true
    cameraControls.autoRotate = false
    cameraControls.update()

    // Plane
    const planeGeometry = new THREE.PlaneGeometry(3, 3);
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: 'gray',
      emissive: 'teal',
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4,
    });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.rotateX(Math.PI / 2);
    this.plane.receiveShadow = true;

    this.scene.add(this.cube);
    this.scene.add(this.plane);

    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 'teal', 'darkgray')
    gridHelper.position.y = -0.01
    this.scene.add(gridHelper)

    // Handle window resize
    const handleResize = (): void => {
      if (!this.camera || !this.renderer) return;
      
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = (): void => {
      if (!this.scene || !this.camera || !this.renderer || !this.cube) return;

      this.animationFrameId = requestAnimationFrame(animate);
      
      // Rotate cube
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
      
      cameraControls.update();
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }

  protected firstUpdated(): void {
    this.initThreeJS();
  }

  protected render() {
    return html`<canvas></canvas>`;
  }
}

export { ThreeJSCanvas };