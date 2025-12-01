import './styles/index.css';
import { SceneManager } from './core/SceneManager.js';
import { ASCIIRenderer } from './core/ASCIIRenderer.js';
import { InputController } from './core/InputController.js';
import { ThemeManager } from './core/ThemeManager.js';
import { AnimationController } from './core/AnimationController.js';
import Stats from 'stats.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

const sceneManager = new SceneManager();
const asciiRenderer = new ASCIIRenderer(sceneManager.renderer, sceneManager.scene, sceneManager.camera);
const inputController = new InputController();
const animationController = new AnimationController();
const themeManager = new ThemeManager(asciiRenderer, sceneManager, animationController, inputController);

// Connect tap handler to animation toggle
inputController.onTap = () => animationController.toggle();

// Connect keyboard shortcuts
inputController.onFrameObject = () => sceneManager.frameObject();
inputController.onToggleWireframe = () => {
  const wireframeEnabled = sceneManager.toggleWireframe();
  asciiRenderer.toggleWireframe();
};

// Initialize camera position
sceneManager.updateCameraPosition();

function animate(time) {
  requestAnimationFrame(animate);

  stats.begin();

  // Update input controller (smooth scroll, velocity decay)
  inputController.update();

  // Update scene with input
  sceneManager.update(time, inputController, 1.0, animationController);

  // Use rotation speed from theme manager
  const rotationSpeed = themeManager.params.rotationSpeed;

  // Update RGB split based on mouse velocity
  if (themeManager.params.enableRGB) {
    const velocityMagnitude = Math.sqrt(
      inputController.velocity.x ** 2 + inputController.velocity.y ** 2
    );
    asciiRenderer.rgbSplitIntensity = velocityMagnitude * 0.3; // Scale factor
  } else {
    asciiRenderer.rgbSplitIntensity = 0;
  }

  // Update cursor proximity effects
  if (asciiRenderer.cursorProximityEnabled) {
    const velocityMagnitude = Math.sqrt(
      inputController.velocity.x ** 2 + inputController.velocity.y ** 2
    );
    // Map velocity (0-100px/frame) to intensity (0-1)
    const targetIntensity = Math.min(velocityMagnitude / 50, 1.0);
    // Smooth interpolation
    asciiRenderer.proximityIntensity += (targetIntensity - asciiRenderer.proximityIntensity) * 0.15;
  } else {
    asciiRenderer.proximityIntensity = 0;
  }

  // Delegate update to SceneManager
  sceneManager.update(time * 0.001, inputController, rotationSpeed, animationController);

  // TODO: FPS monitoring for adaptive quality
  // Stats.js doesn't expose getFPS() directly - need custom FPS counter
  // const currentFPS = stats.getFPS();
  // if (currentFPS > 0) {
  //   asciiRenderer.adjustQuality(currentFPS);
  // }

  asciiRenderer.render();

  stats.end();
}

animate(0);
