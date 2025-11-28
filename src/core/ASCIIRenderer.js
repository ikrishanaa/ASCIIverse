export class ASCIIRenderer {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.charSet = " .:-=+*#%@";
        this.density = 0.15;
        this.enableRGB = false; // Toggle for RGB split

        // Container for all layers
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = 'black';
        document.body.appendChild(this.container);

        // Helper to create a layer
        const createLayer = (color, zIndex) => {
            const el = document.createElement('div');
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.color = color;
            el.style.fontFamily = 'monospace';
            el.style.whiteSpace = 'pre';
            el.style.lineHeight = '10px';
            el.style.fontSize = '10px';
            el.style.pointerEvents = 'none';
            el.style.mixBlendMode = 'screen'; // Additive blending
            el.style.zIndex = zIndex;
            this.container.appendChild(el);
            return el;
        };

        this.layerMain = createLayer('#00ff00', 1); // Default layer
        this.layerR = createLayer('#ff0000', 2);
        this.layerG = createLayer('#00ff00', 2);
        this.layerB = createLayer('#0000ff', 2);

        // Hide RGB layers initially
        this.layerR.style.display = 'none';
        this.layerG.style.display = 'none';
        this.layerB.style.display = 'none';

        // Canvas for reading pixels efficiently
        this.width = Math.floor(window.innerWidth * this.density);
        this.height = Math.floor(window.innerHeight * this.density);

        // Create a low-res render target
        // We will render the 3D scene to this target, read pixels, and map to ASCII
    }

    render() {
        // 1. Render 3D scene to the internal canvas (already handled by SceneManager's renderer, 
        // but we might want to render to a smaller target for performance)

        // For V1, let's try a simpler approach: 
        // We can't easily read pixels from the main canvas without performance hit if it's high res.
        // So we should resize the renderer or use a render target.

        // Let's assume SceneManager renders to its own canvas.
        // We will actually resize the renderer to match our ASCII grid size for 1:1 pixel mapping.

        // NOTE: This modifies the actual WebGL renderer size. 
        // If we want high-res 3D + ASCII overlay, we need a separate pass. 
        // But for "ASCII Art Engine", the 3D render IS the source of truth for the ASCII.

        // Set renderer to low res
        const width = Math.floor(window.innerWidth * this.density);
        const height = Math.floor(window.innerHeight * this.density);

        // Only resize if changed
        if (this.renderer.domElement.width !== width || this.renderer.domElement.height !== height) {
            this.renderer.setSize(width, height, false);
        }

        this.renderer.render(this.scene, this.camera);

        // Read pixels
        const gl = this.renderer.getContext();
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // Map to ASCII
        if (this.enableRGB) {
            let strR = '', strG = '', strB = '';
            for (let y = height - 1; y >= 0; y--) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];

                    strR += this.charSet[Math.floor((r / 255) * (this.charSet.length - 1))];
                    strG += this.charSet[Math.floor((g / 255) * (this.charSet.length - 1))];
                    strB += this.charSet[Math.floor((b / 255) * (this.charSet.length - 1))];
                }
                strR += '\n'; strG += '\n'; strB += '\n';
            }
            this.layerR.textContent = strR;
            this.layerG.textContent = strG;
            this.layerB.textContent = strB;

            // Apply offsets for effect
            this.layerR.style.transform = `translate(-2px, 0)`;
            this.layerG.style.transform = `translate(0, 0)`;
            this.layerB.style.transform = `translate(2px, 0)`;

        } else {
            let asciiStr = '';
            // Loop rows (inverse because WebGL is bottom-up)
            for (let y = height - 1; y >= 0; y--) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

                    const charIndex = Math.floor(brightness * (this.charSet.length - 1));
                    asciiStr += this.charSet[charIndex];
                }
                asciiStr += '\n';
            }
            this.layerMain.textContent = asciiStr;
        }
    }

    resize() {
        // Handle resize if needed
        this.width = Math.floor(window.innerWidth * this.density);
        this.height = Math.floor(window.innerHeight * this.density);
        // Better: just let CSS handle full width/height and font size fixed
    }

    updateDensity(density) {
        this.density = density;
        this.resize();
    }

    updateColor(color) {
        this.layerMain.style.color = color;
    }

    updateBackgroundColor(color) {
        this.container.style.backgroundColor = color;
    }

    updateCharSet(charSet) {
        this.charSet = charSet;
    }

    toggleRGB(enable) {
        this.enableRGB = enable;
        if (enable) {
            this.layerMain.style.display = 'none';
            this.layerR.style.display = 'block';
            this.layerG.style.display = 'block';
            this.layerB.style.display = 'block';
        } else {
            this.layerMain.style.display = 'block';
            this.layerR.style.display = 'none';
            this.layerG.style.display = 'none';
            this.layerB.style.display = 'none';
        }
    }
}
