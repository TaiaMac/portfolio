import YatzyEngine from './yatzyEngine.js';

const engine = new YatzyEngine();
const MAX_ROUNDS = 13;

// ---------- Overlay message helpers ----------
function showOverlay(text, duration = 4000) {
  const overlay = document.getElementById('overlayMessage');
  const textBox = document.getElementById('overlayText');
  if (!overlay || !textBox) return;
  textBox.textContent = text;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  clearTimeout(showOverlay._timeout);
  if (duration) {
    showOverlay._timeout = setTimeout(hideOverlay, duration);
  }
}

function hideOverlay() {
  const overlay = document.getElementById('overlayMessage');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  clearTimeout(showOverlay._timeout);
}

// Elements
const diceDivs = [1,2,3,4,5].map(i=>document.getElementById(`die0${i}`));
const roller = document.getElementById("roller");
const endTurnBtn = document.getElementById("endTurnBtn");
const newGameBtn = document.getElementById("newGameBtn");
const message = document.getElementById("message");
const rollsLeftDisplay = document.getElementById("rollsLeft");
const roundInfo = document.getElementById("roundInfo");

// Scoreboard
const scoreCells = {
  ones:document.getElementById("ones"),
  twos:document.getElementById("twos"),
  threes:document.getElementById("threes"),
  fours:document.getElementById("fours"),
  fives:document.getElementById("fives"),
  sixes:document.getElementById("sixes"),
  three_of_a_kind:document.getElementById("three_of_a_kind"),
  four_of_a_kind:document.getElementById("four_of_a_kind"),
  full_house:document.getElementById("full_house"),
  small_straight:document.getElementById("small_straight"),
  large_straight:document.getElementById("large_straight"),
  chance:document.getElementById("chance"),
  yatzy:document.getElementById("yatzy"),
  sum:document.getElementById("sum"),
  bonus:document.getElementById("bonus"),
  total:document.getElementById("total")
};

// Render dice faces (true pip layout)
function renderDice() {
  const dotPositions = {
    1: ["pos1"],
    2: ["pos2", "pos3"],
    3: ["pos2", "pos1", "pos3"],
    4: ["pos2", "pos3", "pos4", "pos5"],
    5: ["pos2", "pos3", "pos4", "pos5", "pos1"],
    6: ["pos2", "pos3", "pos4", "pos5", "pos6", "pos7"]
  };

  diceDivs.forEach((dieDiv,i)=>{
    dieDiv.innerHTML = "";
    const val = engine.dice[i] || 0;
    dieDiv.className = "die" + (engine.held[i]?" held":"");
    const positions = dotPositions[val] || [];
    positions.forEach(pos => {
      const dot = document.createElement("div");
      dot.className = `dot ${pos}`;
      dieDiv.appendChild(dot);
    });
  });
}

// Update scoreboard UI
function renderScoreboard() {
  Object.keys(scoreCells).forEach(key=>{
    scoreCells[key].textContent = engine.scores[key];
  });
}

// Save / Load / Clear Game
function saveGame() {
  const state = {
    dice: engine.dice,
    held: engine.held,
    rollsLeft: engine.rollsLeft,
    currentRound: engine.currentRound,
    scores: engine.scores
  };
  localStorage.setItem("yatzyGameState", JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem("yatzyGameState");
  if (!saved) return;
  const state = JSON.parse(saved);
  Object.assign(engine, state);
  renderDice();
  renderScoreboard();
  rollsLeftDisplay.textContent = `Rolls left: ${engine.rollsLeft}`;
  roundInfo.textContent = `Round ${engine.currentRound}/13`;
  message.textContent = "Welcome back! Game restored.";
}

function clearGame() {
  localStorage.removeItem("yatzyGameState");
}

// End Game & Save Score History
function endGame() {
  const finalScore = engine.scores.total_score || 0;
  message.textContent = ` Game Over! Final Score: ${finalScore}`;
  showOverlay(`Game Over! Your final score is ${finalScore} `, 5000);

  const history = JSON.parse(localStorage.getItem("yatzyHistory")) || [];
  history.push({ date: new Date().toLocaleString(), score: finalScore });
  localStorage.setItem("yatzyHistory", JSON.stringify(history));

  clearGame();
  engine.currentRound = 1;
}

// Roll dice
roller.addEventListener("click",()=>{
  if (engine.rollsLeft <= 0) {
    message.textContent = "No rolls left! End your turn.";
    return;
  }

  engine.rollDice();
  diceDivs.forEach(d=>{
    d.classList.add("rolling");
    d.style.animationDelay = `${Math.random() * 0.2}s`;
    d.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
    setTimeout(()=>d.classList.remove("rolling"),1000);
  });
  setTimeout(()=>{
    renderDice();
    renderScoreboard();
    rollsLeftDisplay.textContent=`Rolls left: ${engine.rollsLeft}`;
    message.textContent="Click dice to hold them!";
    saveGame();
  },500);
});

// Toggle hold
diceDivs.forEach((dieDiv,i)=>{
  dieDiv.addEventListener("click",()=>{
    engine.toggleHold(i);
    renderDice();
  });
});

// End Turn
endTurnBtn.addEventListener("click",()=>{
  if (engine.currentRound >= MAX_ROUNDS) {
    endGame();
    return;
  }
  engine.nextRound();
  engine.dice = [0,0,0,0,0];
  renderDice();
  renderScoreboard();
  rollsLeftDisplay.textContent=`Rolls left: ${engine.rollsLeft}`;
  roundInfo.textContent=`Round ${engine.currentRound}/13`;
  message.textContent="Roll dice to continue!";
  showOverlay(` Round ${engine.currentRound} / 13`, 1200);
  saveGame();
});

// New Game
newGameBtn.addEventListener("click",()=>{
  if (!confirm("Start a new game?")) return;
  clearGame();
  engine.dice=[0,0,0,0,0];
  engine.held=[false,false,false,false,false];
  engine.rollsLeft=3;
  engine.currentRound=1;
  engine.scores = engine.resetScores();
  rollsLeftDisplay.textContent=`Rolls left: 3`;
  roundInfo.textContent="Round 1";
  renderDice();
  renderScoreboard();
  message.textContent="Click 'Roll Dice' to start!";
  showOverlay(" New Game Started!", 2000);
});

// Initialize Game
window.addEventListener("load", () => {
  loadGame();
  renderDice();
  renderScoreboard();
});
