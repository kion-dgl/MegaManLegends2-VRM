import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as THREE from 'three';

declare global {
  interface HTMLElementTagNameMap {
    'threejs-canvas': ThreeJSCanvas;
  }
}

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
    }
  `;

  private scene: THREE.Scene | null = null;
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
    this.camera.position.z = 5;

    const canvas = this.renderRoot.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Add a basic cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

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