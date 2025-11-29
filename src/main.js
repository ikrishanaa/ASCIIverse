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

  // Delegate update to SceneManager
  sceneManager.update(time * 0.001, inputController, rotationSpeed);

  asciiRenderer.render();

  stats.end();
}

animate(0);
