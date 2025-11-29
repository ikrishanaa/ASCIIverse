import GUI from 'lil-gui';
import { THEMES } from '../themes/ThemePresets.js';

export class ThemeManager {
    constructor(asciiRenderer, sceneManager, animationController, inputController) {
        this.asciiRenderer = asciiRenderer;
        this.sceneManager = sceneManager;
        this.animationController = animationController;
        this.inputController = inputController;

        this.params = {
            currentTheme: 'Default',
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

        // Theme Preset Selector (at top for visibility)
        folder.add(this.params, 'currentTheme', Object.keys(THEMES))
            .name('🎨 Theme')
            .onChange(themeName => this.applyTheme(themeName));

        // Export button with visual feedback
        const exportButton = folder.add({
            export: async () => {
                const btn = exportButton.domElement.querySelector('input');
                const originalText = btn.value;
                btn.value = 'Exporting...';
                btn.disabled = true;

                await this.asciiRenderer.exportToPNG();

                btn.value = '✅ Exported!';
                setTimeout(() => {
                    btn.value = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        }, 'export').name('📸 Export PNG');

        folder.add(this.params, 'density', 0.05, 0.5).name('Resolution').onChange(v => {
            this.asciiRenderer.updateDensity(v);
        });

        folder.add(this.params, 'enableRGB').name('Enable RGB').onChange(v => {
            this.asciiRenderer.toggleRGB(v);
        });

        this.params.cursorProximity = false; // Initialize before adding to GUI
        folder.add(this.params, 'cursorProximity').name('Cursor Proximity').onChange(v => {
            this.asciiRenderer.cursorProximityEnabled = v;
        });

        folder.addColor(this.params, 'color').name('Font Color').onChange(v => {
            this.asciiRenderer.updateColor(v);
        });

        folder.addColor(this.params, 'backgroundColor').name('Background').onChange(v => {
            this.asciiRenderer.updateBackgroundColor(v);
        });

        // Performance controls
        this.params.adaptiveQuality = false;
        folder.add(this.params, 'adaptiveQuality').name('Adaptive Quality').onChange(v => {
            this.asciiRenderer.adaptiveQuality = v;
            if (v) {
                this.asciiRenderer.baseDensity = this.asciiRenderer.density;
            }
        });

        this.params.targetFPS = 30;
        folder.add(this.params, 'targetFPS', 20, 60, 5).name('Target FPS').onChange(v => {
            this.asciiRenderer.targetFPS = v;
        });

        folder.add(this.params, 'charSet').name('Char Set').onChange(v => {
            this.asciiRenderer.updateCharSet(v);
        });

        const sceneFolder = this.gui.addFolder('Scene');
        sceneFolder.add(this.params, 'rotationSpeed', 0, 5).name('Rotation Speed');

        this.params.zoomSpeed = 0.1;
        sceneFolder.add(this.params, 'zoomSpeed', 0.05, 0.5).name('Zoom Speed').onChange(v => {
            this.sceneManager.zoomSpeed = v;
        });

        sceneFolder.add({ resetZoom: () => this.sceneManager.resetZoom() }, 'resetZoom').name('Reset Zoom');

        // Animation control
        sceneFolder.add({ togglePause: () => this.animationController.toggle() }, 'togglePause').name('⏯️ Pause/Play');

        // Auto-rotation checkbox (Blender-style)
        this.params.autoRotation = true;
        sceneFolder.add(this.params, 'autoRotation').name('Auto-Rotation').onChange(v => {
            this.sceneManager.autoRotationEnabled = v;
        });

        // Frame object button (F key)
        sceneFolder.add({ frame: () => this.sceneManager.frameObject() }, 'frame').name('🎯 Frame Object (F)');

        // Gyroscope control (mobile only)
        this.params.gyroEnabled = false;
        sceneFolder.add(this.params, 'gyroEnabled').name('Enable Gyroscope').onChange(v => {
            this.inputController.gyroEnabled = v;
        });

        this.params.gyroSensitivity = 0.005;
        sceneFolder.add(this.params, 'gyroSensitivity', 0.001, 0.02, 0.001).name('Gyro Sensitivity').onChange(v => {
            this.inputController.gyroSensitivity = v;
        });

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

    applyTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;

        console.log(`[Theme] Applying "${themeName}" theme`);

        // Update parameters
        this.params.color = theme.color;
        this.params.backgroundColor = theme.backgroundColor;
        this.params.charSet = theme.charSet;
        this.params.enableRGB = theme.enableRGB;
        this.params.cursorProximity = theme.cursorProximity || false;

        // Apply to renderer
        this.asciiRenderer.updateColor(theme.color);
        this.asciiRenderer.updateBackgroundColor(theme.backgroundColor);
        this.asciiRenderer.updateCharSet(theme.charSet);
        this.asciiRenderer.toggleRGB(theme.enableRGB);
        this.asciiRenderer.cursorProximityEnabled = theme.cursorProximity || false;

        // Refresh GUI display to show updated values
        this.gui.updateDisplay();
    }
}
