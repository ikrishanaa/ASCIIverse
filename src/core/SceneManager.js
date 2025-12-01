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

        // Camera orbit system (Blender-style)
        this.cameraOrbit = {
            azimuth: Math.PI / 4,      // Horizontal rotation
            elevation: Math.PI / 3,    // Vertical rotation (30 degrees from horizontal)
            distance: 5,               // Distance from pivot
            pivot: new THREE.Vector3(0, 0, 0)  // Point to orbit around
        };

        // Auto-rotation
        this.autoRotationEnabled = true;
        this.autoRotationSpeed = 0.01;

        // Zoom smoothing properties
        this.targetCameraZ = 30; // Target zoom position
        this.zoomSpeed = 0.1; // Interpolation speed (0.05-0.5)
        this.minZoom = 2; // Closest zoom
        this.maxZoom = 20; // Farthest zoom

        // Wireframe mode
        this.wireframeMode = false;

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
            const sensitivity = 2; // Orbit sensitivity

            // Handle camera navigation modes
            if (inputController && inputController.navigationMode === 'orbit') {
                // MMB drag → Orbit camera
                this.orbitCamera(
                    inputController.velocity.x * 0.01,
                    inputController.velocity.y * 0.01
                );
            } else if (inputController && inputController.navigationMode === 'pan') {
                // Shift + MMB drag → Pan camera
                this.panCamera(
                    inputController.velocity.x,
                    inputController.velocity.y
                );
            } else if (this.autoRotationEnabled && (!animationController || !animationController.isPaused) && !inputController?.isDragging) {
                // Auto-rotation when idle
                this.cameraOrbit.azimuth += this.autoRotationSpeed * rotationSpeed;
                this.updateCameraPosition();
            }

            // Handle scroll zoom (change orbit distance)
            if (inputController && inputController.scroll !== 0) {
                const zoomDelta = inputController.scroll * 0.5;
                this.cameraOrbit.distance += zoomDelta;

                // Clamp distance
                this.cameraOrbit.distance = Math.max(this.minZoom, Math.min(this.maxZoom, this.cameraOrbit.distance));

                this.updateCameraPosition();
            }
        }
    }

    // Update camera position from spherical coordinates
    updateCameraPosition() {
        const theta = this.cameraOrbit.azimuth;
        const phi = this.cameraOrbit.elevation;
        const r = this.cameraOrbit.distance;

        // Clamp elevation to prevent gimbal lock
        const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        // Spherical to Cartesian
        this.camera.position.x = this.cameraOrbit.pivot.x + r * Math.sin(clampedPhi) * Math.cos(theta);
        this.camera.position.y = this.cameraOrbit.pivot.y + r * Math.cos(clampedPhi);
        this.camera.position.z = this.cameraOrbit.pivot.z + r * Math.sin(clampedPhi) * Math.sin(theta);

        this.camera.lookAt(this.cameraOrbit.pivot);
    }

    // Orbit camera around pivot
    orbitCamera(deltaAzimuth, deltaElevation) {
        this.cameraOrbit.azimuth += deltaAzimuth;
        this.cameraOrbit.elevation += deltaElevation;

        // Clamp elevation
        this.cameraOrbit.elevation = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraOrbit.elevation));

        this.updateCameraPosition();
    }

    // Pan camera (move pivot point)
    panCamera(deltaX, deltaY) {
        // Get camera right and up vectors
        const cameraRight = new THREE.Vector3();
        const cameraUp = new THREE.Vector3();

        this.camera.getWorldDirection(cameraRight);
        cameraRight.cross(this.camera.up).normalize();
        cameraUp.copy(this.camera.up).normalize();

        // Pan based on camera distance
        const panSpeed = this.cameraOrbit.distance * 0.001;

        this.cameraOrbit.pivot.add(cameraRight.multiplyScalar(-deltaX * panSpeed));
        this.cameraOrbit.pivot.add(cameraUp.multiplyScalar(deltaY * panSpeed));

        this.updateCameraPosition();
    }

    // Frame object in view (F key)
    frameObject() {
        if (!this.modelContainer) return;

        const box = new THREE.Box3().setFromObject(this.modelContainer);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Set pivot to object center
        this.cameraOrbit.pivot.copy(center);

        // Set distance to frame object nicely
        this.cameraOrbit.distance = size.length() * 1.5;
        this.cameraOrbit.azimuth = Math.PI / 4;
        this.cameraOrbit.elevation = Math.PI / 3;

        this.updateCameraPosition();
    }

    resetZoom() {
        this.targetCameraZ = 30;
        this.camera.position.z = 30;
    }

    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;

        // Toggle wireframe on all meshes
        this.modelContainer.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = this.wireframeMode;
            }
        });

        console.log(`[SceneManager] Wireframe ${this.wireframeMode ? 'ON' : 'OFF'}`);
        return this.wireframeMode;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
