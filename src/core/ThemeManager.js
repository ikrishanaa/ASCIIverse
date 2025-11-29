import GUI from 'lil-gui';

export class ThemeManager {
    constructor(asciiRenderer, sceneManager) {
        this.asciiRenderer = asciiRenderer;
        this.sceneManager = sceneManager;

        this.params = {
            density: 0.15,
            color: '#00ff00',
            backgroundColor: '#000000',
            charSet: " .:-=+*#%@",
            rotationSpeed: 1.0,
            enableRGB: false
        };

        this.gui = new GUI();
        this.initGUI();
    }

    initGUI() {
        const folder = this.gui.addFolder('ASCII Settings');

        folder.add(this.params, 'density', 0.05, 0.5).name('Resolution').onChange(v => {
            this.asciiRenderer.updateDensity(v);
        });

        folder.add(this.params, 'enableRGB').name('RGB Split').onChange(v => {
            this.asciiRenderer.toggleRGB(v);
        });

        folder.addColor(this.params, 'color').name('Font Color').onChange(v => {
            this.asciiRenderer.updateColor(v);
        });

        folder.addColor(this.params, 'backgroundColor').name('Background').onChange(v => {
            this.asciiRenderer.updateBackgroundColor(v);
        });

        folder.add(this.params, 'charSet').name('Char Set').onChange(v => {
            this.asciiRenderer.updateCharSet(v);
        });

        const sceneFolder = this.gui.addFolder('Scene');
        sceneFolder.add(this.params, 'rotationSpeed', 0, 5).name('Rotation Speed');

        this.params.modelScale = 1.0;
        this.params.rotX = 0;
        this.params.rotY = 0;
        this.params.rotZ = 0;

        const modelFolder = sceneFolder.addFolder('Model Adjustments');

        modelFolder.add(this.params, 'modelScale', 0.1, 5.0).name('Scale').onChange(v => {
            this.sceneManager.setModelScale(v);
        });

        modelFolder.add(this.params, 'rotX', -180, 180).name('Rotate X').onChange(v => {
            this.sceneManager.setModelRotation(this.params.rotX, this.params.rotY, this.params.rotZ);
        });
        modelFolder.add(this.params, 'rotY', -180, 180).name('Rotate Y').onChange(v => {
            this.sceneManager.setModelRotation(this.params.rotX, this.params.rotY, this.params.rotZ);
        });
        modelFolder.add(this.params, 'rotZ', -180, 180).name('Rotate Z').onChange(v => {
            this.sceneManager.setModelRotation(this.params.rotX, this.params.rotY, this.params.rotZ);
        });

        // File Upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.obj,.gltf,.glb,.stl';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        const uploadParams = {
            upload: () => {
                fileInput.click();
            }
        };

        sceneFolder.add(uploadParams, 'upload').name('Upload Model');

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const buffer = e.target.result;
                    const extension = file.name.split('.').pop().toLowerCase();
                    this.sceneManager.loadModel(buffer, extension);
                };
                reader.readAsArrayBuffer(file);
            }
        });
    }
}
