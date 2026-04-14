/**
 * Client entry: boot SceneController.
 */
import { SceneController } from './control/SceneController.js';

const root = document.getElementById('game-container');
if (root) {
    const scenes = new SceneController(root);
    scenes.init().catch((err) => {
        console.error(err);
        root.textContent = `Fatal: ${err.message}`;
    });
}