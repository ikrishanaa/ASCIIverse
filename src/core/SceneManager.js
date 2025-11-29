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

        this.raycaster = new THREE.Raycaster(); // Initialize Raycaster

        // Zoom smoothing properties
        this.targetCameraZ = 30; // Target zoom position
        this.zoomSpeed = 0.1; // Interpolation speed (0.05-0.5)
        this.minZoom = 10; // Closest zoom
        this.maxZoom = 100; // Farthest zoom

        // We don't append renderer.domElement to body because ASCIIRenderer will handle the output.
        // But for debugging/fallback, we might want to keep it available.

        this.initScene();
        this.initLights();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    initScene() {
        // Add Fog for depth perception (distant objects fade to black)
        // Reduced density to prevent large objects from fading out too much
        this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

        // Container for the model to handle centering and rotation
        this.modelContainer = new THREE.Group();
        this.scene.add(this.modelContainer);

        // Create a TorusKnot for testing
        const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            wireframe: false,
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);

        // Add to container instead of scene directly
        this.modelContainer.add(this.mesh);

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
        // Clear container
        while (this.modelContainer.children.length > 0) {
            this.modelContainer.remove(this.modelContainer.children[0]);
        }
        this.mesh = null; // We might have multiple meshes now, so this reference is less useful for single mesh manipulation, but we keep it null to be safe.

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
        this.setupModel(object);
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
        this.setupModel(mesh);
    }

    async loadGLTF(buffer) {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.parseAsync(buffer, '');
            this.setupModel(gltf.scene);
        } catch (error) {
            console.error("Error parsing GLTF:", error);
            throw error;
        }
    }

    setupModel(object) {
        // Traverse to apply materials to all meshes in the hierarchy
        object.traverse((child) => {
            if (child.isMesh) {
                // Ensure material is visible
                if (!child.material || Array.isArray(child.material)) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x00ff00,
                        wireframe: false,
                        side: THREE.DoubleSide,
                        roughness: 0.5,
                        metalness: 0.5
                    });
                } else {
                    // Update existing material to be more visible
                    child.material.wireframe = false;
                    child.material.side = THREE.DoubleSide;
                    if (child.material.roughness !== undefined) child.material.roughness = 0.5;
                    if (child.material.metalness !== undefined) child.material.metalness = 0.5;
                }
            }
        });

        // Add object to container
        this.modelContainer.add(object);
        this.currentObject = object; // Store reference for orientation fix

        // Center the object
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 20 / maxDim; // Scale to fit roughly in a 20 unit box

        this.baseScale = scale; // Store base scale

        object.scale.set(scale, scale, scale);

        // Center the object by offsetting its position relative to the container
        // We move the object so its center aligns with the container's origin (0,0,0)
        object.position.sub(center.multiplyScalar(scale));
    }

    setModelRotation(x, y, z) {
        if (this.currentObject) {
            this.currentObject.rotation.x = x * (Math.PI / 180);
            this.currentObject.rotation.y = y * (Math.PI / 180);
            this.currentObject.rotation.z = z * (Math.PI / 180);
        }
    }

    setModelScale(s) {
        if (this.currentObject && this.baseScale) {
            const newScale = this.baseScale * s;
            this.currentObject.scale.set(newScale, newScale, newScale);

            // Re-center if needed (though position offset might need adjustment if scale changes significantly relative to center)
            // For simplicity, we just scale in place. If the pivot is correct (centered), it should be fine.
        }
    }

    setOrientation(fix) {
        if (this.currentObject) {
            if (fix) {
                this.currentObject.rotation.x = -Math.PI / 2;
            } else {
                this.currentObject.rotation.x = 0;
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time, inputController, rotationSpeed = 1.0, animationController = null) {
        if (this.modelContainer) {

            // Gyroscope control (overrides auto-rotation)
            if (inputController && inputController.gyroEnabled) {
                const DEG_TO_RAD = Math.PI / 180;
                // Map device tilt to object rotation
                this.modelContainer.rotation.x = inputController.gyro.beta * DEG_TO_RAD * inputController.gyroSensitivity;
                this.modelContainer.rotation.y = inputController.gyro.gamma * DEG_TO_RAD * inputController.gyroSensitivity;
            } else {
                // Normal controls (drag, hover, auto-rotate)
                let isHovered = false;

                if (inputController) {
                    // Raycasting for hover detection
                    this.raycaster.setFromCamera(inputController.mouse, this.camera);
                    const intersects = this.raycaster.intersectObjects(this.modelContainer.children, true);

                    if (intersects.length > 0) {
                        isHovered = true;
                    }
                }

                if (inputController && inputController.isDragging) {
                    // Manual Rotation (Drag)
                    const sensitivity = 0.005;
                    this.modelContainer.rotation.y += inputController.delta.x * sensitivity;
                    this.modelContainer.rotation.x += inputController.delta.y * sensitivity;
                } else if (isHovered && inputController) {
                    // Hover Interaction: Stop auto-rotation, Look at mouse (Tilt)
                    // We add a subtle tilt based on mouse position relative to center
                    // Target rotation is current rotation + small offset

                    // Note: We don't want to snap, just add a small influence or stop spinning.
                    // User asked for "interactive also", usually means "look at me".

                    // Simple tilt:
                    this.modelContainer.rotation.x += inputController.mouse.y * 0.005;
                    this.modelContainer.rotation.y += inputController.mouse.x * 0.005;
                } else if (!animationController || !animationController.isPaused) {
                    // Auto rotation - Y axis only (turntable effect)
                    // Only when not dragging AND not hovering AND not paused
                    this.modelContainer.rotation.y += 0.01 * rotationSpeed;
                }
            }

            // Scroll interaction (smooth zoom)
            if (inputController) {
                // Calculate target zoom position
                this.targetCameraZ = 30 + inputController.scroll * 5;

                // Apply constraints
                this.targetCameraZ = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetCameraZ));

                // Smooth interpolation to target
                this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * this.zoomSpeed;
            }
        }
    }

    resetZoom() {
        this.targetCameraZ = 30;
        this.camera.position.z = 30;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
