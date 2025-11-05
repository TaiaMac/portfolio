// main.js
import YatzyGame from './yatzyGame.js';

window.addEventListener('DOMContentLoaded', () => {
  // instantiate the game controller which wires engine + UI
  window._yatzy = new YatzyGame();
});
