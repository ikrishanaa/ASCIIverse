import './styles/index.css';
import { SceneManager } from './core/SceneManager.js';
import { ASCIIRenderer } from './core/ASCIIRenderer.js';
import { InputController } from './core/InputController.js';
import { ThemeManager } from './core/ThemeManager.js';
import Stats from 'stats.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

const sceneManager = new SceneManager();
const asciiRenderer = new ASCIIRenderer(sceneManager.renderer, sceneManager.scene, sceneManager.camera);
const inputController = new InputController();
const themeManager = new ThemeManager(asciiRenderer, sceneManager);

function animate(time) {
  requestAnimationFrame(animate);

  stats.begin();

  inputController.update();

  // Use rotation speed from theme manager
  const rotationSpeed = themeManager.params.rotationSpeed;

  if (sceneManager.mesh) {
    // Rotate based on speed
    sceneManager.mesh.rotation.x += 0.01 * rotationSpeed;
    sceneManager.mesh.rotation.y += 0.005 * rotationSpeed;

    // Add mouse interaction
    sceneManager.mesh.rotation.x += inputController.mouse.y * 0.05;
    sceneManager.mesh.rotation.y += inputController.mouse.x * 0.05;

    // Scroll interaction (zoom)
    sceneManager.camera.position.z = 30 + inputController.scroll * 5;
  }

  asciiRenderer.render();

  stats.end();
}

animate(0);
