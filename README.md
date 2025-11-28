# ASCIIverse

**ASCIIverse** is a high-performance web-based engine that converts live 3D scenes into dynamic ASCII art in real-time. It merges Three.js/WebGL 3D rendering with retro ASCII aesthetics, creating a nostalgic yet futuristic interactive experience.

Think of it as "real-time 3D art coded in text," blending retro aesthetics with modern GPU rendering.

## 🚀 Features

### ✅ Currently Implemented
- **Real-Time 3D to ASCII Rendering**: 
  - Uses Three.js for the 3D scene and maps pixels to ASCII characters based on brightness.
  - Optimized offscreen rendering for high performance (>60 FPS).
- **Interactive Controls**:
  - **Mouse/Cursor**: Rotates the object (parallax effect).
  - **Scroll**: Zooms in and out.
  - **Touch**: Mobile support for rotation.
  - **Gyroscope**: Tilt control for mobile devices.
- **Theming & Customization**:
  - **Live GUI**: Built-in control panel (lil-gui) to tweak settings in real-time.
  - **Resolution Scaling**: Adjust character density for performance or aesthetic.
  - **Color Palette**: Change font color and background color.
  - **Character Sets**: Switch between different ASCII character maps.
- **Visual Effects**:
  - **RGB Split**: Chromatic aberration effect using 3 layers of ASCII (Red, Green, Blue).
  - **Depth Fog**: Distant objects fade into the background, adding depth perception.

### 🔮 Future Roadmap
- [ ] **Custom Model Loading**: Support for dragging and dropping `.gltf` or `.obj` files to render your own 3D models.
- [ ] **Post-Processing Shaders**: Advanced effects like Bloom, Glitch, and CRT curvature.
- [ ] **Video Texture Support**: Play videos rendered as ASCII.
- [ ] **WebGPU Support**: Next-gen performance for massive ASCII grids.
- [ ] **Export Options**: Save the current frame as a PNG or text file.
- [ ] **Plugin System**: Allow developers to write custom ASCII mapping shaders.

## 🛠️ Installation & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/asciiverse.git
   cd asciiverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Visit `http://localhost:5173` to see the engine in action.

## 🎮 Controls

| Input | Action |
|-------|--------|
| **Mouse Move** | Rotate Object / Parallax |
| **Scroll** | Zoom In / Out |
| **Touch Drag** | Rotate Object |
| **Device Tilt** | Rotate Object (Gyroscope) |

## ⚙️ Configuration

Open the GUI panel in the top-right corner to adjust:
- **Resolution**: Lower for retro feel, higher for detail.
- **RGB Split**: Toggle for a cyberpunk/glitch effect.
- **Colors**: Customize the look.
- **Rotation Speed**: Control the auto-rotation.

## 📄 License

MIT License. Feel free to use and modify!
