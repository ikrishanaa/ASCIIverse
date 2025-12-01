import html2canvas from 'html2canvas';

export class ASCIIRenderer {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.charSet = " .:-=+*#%@";
        this.density = 0.15;
        this.enableRGB = false; // Toggle for RGB split
        this.rgbSplitIntensity = 0; // Dynamic RGB split (0 to 10+)
        this.cursorProximityEnabled = false; // Toggle for cursor effects
        this.proximityIntensity = 0; // Current blur/glow intensity (0 to 1)

        // Adaptive quality system
        this.adaptiveQuality = false; // Toggle for adaptive performance
        this.targetFPS = 30; // Minimum target FPS
        this.baseDensity = 0.15; // Original density (saved for recovery)
        this.minDensity = 0.05; // Minimum quality fallback

        // Wireframe mode
        this.showWireframe = false;

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

            // Apply offsets for effect (dynamic based on intensity)
            const offset = this.rgbSplitIntensity;
            this.layerR.style.transform = `translate(${-offset}px, 0)`;
            this.layerG.style.transform = `translate(0, 0)`;
            this.layerB.style.transform = `translate(${offset}px, 0)`;

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

        // Apply cursor proximity effects
        if (this.cursorProximityEnabled && this.proximityIntensity > 0) {
            const blur = this.proximityIntensity * 2; // 0-2px blur
            const brightness = 1 + (this.proximityIntensity * 0.5); // 1.0-1.5 brightness
            const shadowIntensity = this.proximityIntensity * 10; // 0-10px glow

            this.container.style.filter = `blur(${blur}px) brightness(${brightness})`;

            // Add glow effect
            const glowColor = this.enableRGB ? 'rgba(0, 255, 200, 0.8)' : this.layerMain.style.color || '#00ff00';
            this.container.style.textShadow = `0 0 ${shadowIntensity}px ${glowColor}`;
        } else {
            this.container.style.filter = 'none';
            this.container.style.textShadow = 'none';
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

    adjustQuality(currentFPS) {
        if (!this.adaptiveQuality) return;

        if (currentFPS < this.targetFPS) {
            // Performance is poor, reduce quality
            const newDensity = Math.max(this.minDensity, this.density * 0.9);
            if (newDensity !== this.density) {
                this.density = newDensity;
                console.log(`[Adaptive] Reduced density to ${this.density.toFixed(3)} (FPS: ${currentFPS.toFixed(1)})`);
            }
        } else if (currentFPS > this.targetFPS + 10 && this.density < this.baseDensity) {
            // Performance is good, can increase quality
            const newDensity = Math.min(this.baseDensity, this.density * 1.05);
            if (newDensity !== this.density) {
                this.density = newDensity;
                console.log(`[Adaptive] Increased density to ${this.density.toFixed(3)} (FPS: ${currentFPS.toFixed(1)})`);
            }
        }
    }

    toggleWireframe() {
        this.showWireframe = !this.showWireframe;

        // Toggle ASCII container visibility
        this.container.style.display = this.showWireframe ? 'none' : 'block';

        console.log(`[ASCII] ${this.showWireframe ? 'Hidden (Wireframe)' : 'Visible'}`);
        return this.showWireframe;
    }

    async exportToPNG() {
        try {
            console.log('[Export] Capturing ASCII art...');

            const canvas = await html2canvas(this.container, {
                backgroundColor: null,
                scale: 2, // Higher quality (2x resolution)
                logging: false
            });

            // Convert to blob and trigger download
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `asciiverse_${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);

                console.log('[Export] PNG downloaded successfully');
            });
        } catch (error) {
            console.error('[Export] Failed:', error);
        }
    }
}
