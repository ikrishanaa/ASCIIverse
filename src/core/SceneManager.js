import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false for retro feel

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // We don't append renderer.domElement to body because ASCIIRenderer will handle the output.
        // But for debugging/fallback, we might want to keep it available.

        this.initScene();
        this.initLights();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initScene() {
        // Add Fog for depth perception (distant objects fade to black)
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        // Create a TorusKnot for testing
        const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: false });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.camera.position.z = 30;
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xff0000, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time, inputController) {
        if (this.mesh) {
            // Rotate based on time
            this.mesh.rotation.x = time * 0.2;
            this.mesh.rotation.y = time * 0.1;

            // Add mouse interaction
            if (inputController) {
                this.mesh.rotation.x += inputController.mouse.y * 0.5;
                this.mesh.rotation.y += inputController.mouse.x * 0.5;

                // Scroll interaction (zoom or rotate)
                this.camera.position.z = 30 + inputController.scroll * 5;
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
