import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

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

        this.camera.position.z = 30;
    }

    initLights() {
        // Increased Ambient Light for better base visibility
        const ambientLight = new THREE.AmbientLight(0x808080);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xff0000, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        // Headlight (Light attached to camera)
        // This ensures the object is always illuminated from the viewer's angle
        const headlight = new THREE.DirectionalLight(0xffffff, 0.8);
        headlight.position.set(0, 0, 1);
        this.camera.add(headlight);
        this.scene.add(this.camera); // Camera must be added to scene for its children to work
    }

    async loadModel(buffer, extension) {
        // Remove existing mesh
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        try {
            switch (extension) {
                case 'obj':
                    this.loadOBJ(buffer);
                    break;
                case 'stl':
                    this.loadSTL(buffer);
                    break;
                case 'gltf':
                case 'glb':
                    await this.loadGLTF(buffer);
                    break;
                default:
                    console.error('Unsupported file extension:', extension);
                    alert('Unsupported file format: ' + extension);
            }
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Error loading model. See console for details.');
        }
    }

    loadOBJ(buffer) {
        const loader = new OBJLoader();
        const text = new TextDecoder().decode(buffer);
        const object = loader.parse(text);

        // Find the first mesh
        let newMesh = null;
        object.traverse((child) => {
            if (child.isMesh && !newMesh) {
                newMesh = child;
            }
        });

        if (newMesh) {
            this.setupMesh(newMesh);
        } else {
            console.error("No mesh found in OBJ");
        }
    }

    loadSTL(buffer) {
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            wireframe: false,
            side: THREE.DoubleSide, // Ensure backfaces are visible
            roughness: 0.5,
            metalness: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.setupMesh(mesh);
    }

    async loadGLTF(buffer) {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.parseAsync(buffer, '');

            let newMesh = null;
            gltf.scene.traverse((child) => {
                if (child.isMesh && !newMesh) {
                    newMesh = child;
                }
            });

            if (newMesh) {
                this.setupMesh(newMesh);
            } else {
                console.error("No mesh found in GLTF/GLB");
            }
        } catch (error) {
            console.error("Error parsing GLTF:", error);
            throw error;
        }
    }

    setupMesh(mesh) {
        this.mesh = mesh;

        // Normalize scale and position
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 20 / maxDim; // Scale to fit roughly in a 20 unit box

        this.mesh.scale.set(scale, scale, scale);
        // Center the mesh by offsetting its position
        // Note: We need to be careful if the mesh already has a position or if the geometry is offset.
        // The safest way is to wrap it in a group or just adjust position relative to center.
        // Here we adjust the mesh position directly.
        this.mesh.position.sub(center.multiplyScalar(scale));

        // Ensure material is visible
        if (!this.mesh.material || Array.isArray(this.mesh.material)) {
            this.mesh.material = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                wireframe: false,
                side: THREE.DoubleSide,
                roughness: 0.5,
                metalness: 0.5
            });
        } else {
            // Update existing material to be more visible
            this.mesh.material.wireframe = false;
            this.mesh.material.side = THREE.DoubleSide;
            if (this.mesh.material.roughness !== undefined) this.mesh.material.roughness = 0.5;
            if (this.mesh.material.metalness !== undefined) this.mesh.material.metalness = 0.5;
        }

        this.scene.add(this.mesh);
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
