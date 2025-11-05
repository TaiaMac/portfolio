// main.js

class YatzyEngine {
  constructor() {
    this.dice = [0,0,0,0,0];
    this.held = [false,false,false,false,false];
    this.rollsLeft = 3;
    this.currentRound = 1;
    this.scores = this.resetScores();
  }

  resetScores() {
    return {
      ones:null, twos:null, threes:null, fours:null, fives:null, sixes:null,
      three_of_a_kind:null, four_of_a_kind:null, full_house:null,
      small_straight:null, large_straight:null, chance:null, yatzy:null,
      sum:0, bonus:0, total_score:0
    };
  }

  rollDice() {
    if (this.rollsLeft <= 0) return;
    this.dice = this.dice.map((d,i) => this.held[i] ? d : Math.floor(Math.random()*6)+1);
    this.rollsLeft--;
    this.autoScore();
    return this.dice;
  }

  toggleHold(index) {
    if (typeof index !== 'number') return;
    this.held[index] = !this.held[index];
  }

  nextRound() {
    this.rollsLeft = 3;
    this.held = [false,false,false,false,false];
    this.currentRound++;
    this.dice = [0,0,0,0,0];
  }

  reset() {
    this.dice = [0,0,0,0,0];
    this.held = [false,false,false,false,false];
    this.rollsLeft = 3;
    this.currentRound = 1;
    this.scores = this.resetScores();
  }

  autoScore() {
    const names = ['ones','twos','threes','fours','fives','sixes'];
    for (let i=1;i<=6;i++) {
      this.scores[names[i-1]] = this.dice.filter(d => d===i).reduce((a,b)=>a+b,0);
    }

    const counts = {};
    this.dice.forEach(d => counts[d] = (counts[d]||0)+1);
    const sum = this.dice.reduce((a,b)=>a+b,0);

    this.scores.three_of_a_kind = Object.values(counts).some(v=>v>=3) ? sum : 0;
    this.scores.four_of_a_kind = Object.values(counts).some(v=>v>=4) ? sum : 0;
    this.scores.full_house = (Object.values(counts).includes(3) && Object.values(counts).includes(2)) ? 25 : 0;

    const uniqueSorted = [...new Set(this.dice)].sort((a,b)=>a-b);
    const smallSets = [[1,2,3,4],[2,3,4,5],[3,4,5,6]];
    const largeSets = [[1,2,3,4,5],[2,3,4,5,6]];
    this.scores.small_straight = smallSets.some(s => s.every(n => uniqueSorted.includes(n))) ? 30 : 0;
    this.scores.large_straight = largeSets.some(s => s.every(n => uniqueSorted.includes(n))) ? 40 : 0;

    this.scores.chance = sum;
    this.scores.yatzy = Object.values(counts).includes(5) ? 50 : 0;

    this.scores.sum = names.reduce((a,c)=>a+(this.scores[c]||0),0);
    this.scores.bonus = this.scores.sum >= 63 ? 35 : 0;
    this.scores.total_score = Object.values(this.scores).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);
  }
}

class YatzyGame {
  constructor() {
    this.MAX_ROUNDS = 13;
    this.engine = new YatzyEngine();

    // Elements
    this.diceDivs = [1,2,3,4,5].map(i => document.getElementById(`die0${i}`));
    this.roller = document.getElementById("roller");
    this.endTurnBtn = document.getElementById("endTurnBtn");
    this.newGameBtn = document.getElementById("newGameBtn");
    this.message = document.getElementById("message");
    this.rollsLeftDisplay = document.getElementById("rollsLeft");
    this.roundInfo = document.getElementById("roundInfo");
    this.scoreCells = {
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

    // Initialize
    this.loadGame();
    this.renderDice();
    this.renderScoreboard();
    this.setupEventListeners();
  }

  // ---------- Overlay helpers ----------
  showOverlay(text, duration=4000){
    const overlay = document.getElementById('overlayMessage');
    const textBox = document.getElementById('overlayText');
    if(!overlay || !textBox) return;
    textBox.textContent = text;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    clearTimeout(this._overlayTimeout);
    if(duration){
      this._overlayTimeout = setTimeout(()=>this.hideOverlay(), duration);
    }
  }

  hideOverlay(){
    const overlay = document.getElementById('overlayMessage');
    if(!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    clearTimeout(this._overlayTimeout);
  }

  renderDice(){
    const dotPositions = {
      1: ["pos1"],
      2: ["pos2","pos3"],
      3: ["pos2","pos1","pos3"],
      4: ["pos2","pos3","pos4","pos5"],
      5: ["pos2","pos3","pos4","pos5","pos1"],
      6: ["pos2","pos3","pos4","pos5","pos6","pos7"]
    };

    this.diceDivs.forEach((dieDiv,i)=>{
      dieDiv.innerHTML = "";
      const val = this.engine.dice[i] || 0;
      dieDiv.className = "die" + (this.engine.held[i]?" held":"");
      const positions = dotPositions[val] || [];
      positions.forEach(pos=>{
        const dot = document.createElement("div");
        dot.className = `dot ${pos}`;
        dieDiv.appendChild(dot);
      });
    });
  }

  renderScoreboard(){
    Object.keys(this.scoreCells).forEach(key=>{
      this.scoreCells[key].textContent = this.engine.scores[key];
    });
  }

  saveGame(){
    const state = {
      dice: this.engine.dice,
      held: this.engine.held,
      rollsLeft: this.engine.rollsLeft,
      currentRound: this.engine.currentRound,
      scores: this.engine.scores
    };
    localStorage.setItem("yatzyGameState", JSON.stringify(state));
  }

  loadGame(){
    const saved = localStorage.getItem("yatzyGameState");
    if(!saved) return;
    const state = JSON.parse(saved);
    Object.assign(this.engine, state);
    this.rollsLeftDisplay.textContent = `Rolls left: ${this.engine.rollsLeft}`;
    this.roundInfo.textContent = `Round ${this.engine.currentRound}/13`;
    this.message.textContent = "Welcome back! Game restored.";
  }

  endGame(){
    const finalScore = this.engine.scores.total_score || 0;
    this.message.textContent = `Game Over! Final Score: ${finalScore}`;
    this.showOverlay(`Game Over! Your final score is ${finalScore}`, 5000);

    const history = JSON.parse(localStorage.getItem("yatzyHistory")) || [];
    history.push({date:new Date().toLocaleString(), score:finalScore});
    localStorage.setItem("yatzyHistory", JSON.stringify(history));
    localStorage.removeItem("yatzyGameState");
    this.engine.reset();
    this.renderDice();
    this.renderScoreboard();
    this.rollsLeftDisplay.textContent = `Rolls left: ${this.engine.rollsLeft}`;
    this.roundInfo.textContent = `Round ${this.engine.currentRound}/13`;
  }

  setupEventListeners(){
    // Roll Dice
    this.roller.addEventListener("click", ()=>{
      if(this.engine.rollsLeft <= 0){
        this.message.textContent = "No rolls left! End your turn.";
        return;
      }

      // Add animation
      this.diceDivs.forEach(d=>{
        d.classList.add("rolling");
        d.style.animationDelay = `${Math.random()*0.2}s`;
        d.style.animationDuration = `${0.8 + Math.random()*0.4}s`;
      });

      setTimeout(()=>{
        this.engine.rollDice();
        this.renderDice();
        this.renderScoreboard();
        this.rollsLeftDisplay.textContent = `Rolls left: ${this.engine.rollsLeft}`;
        this.message.textContent = "Click dice to hold them!";
        this.saveGame();
        this.diceDivs.forEach(d=>d.classList.remove("rolling"));
      }, 800);
    });

    // Toggle hold
    this.diceDivs.forEach((dieDiv,i)=>{
      dieDiv.addEventListener("click", ()=>{
        this.engine.toggleHold(i);
        this.renderDice();
      });
    });

    // End Turn
    this.endTurnBtn.addEventListener("click", ()=>{
      if(this.engine.currentRound >= this.MAX_ROUNDS){
        this.endGame();
        return;
      }
      this.engine.nextRound();
      this.renderDice();
      this.renderScoreboard();
      this.rollsLeftDisplay.textContent = `Rolls left: ${this.engine.rollsLeft}`;
      this.roundInfo.textContent = `Round ${this.engine.currentRound}/13`;
      this.message.textContent = "Roll dice to continue!";
      this.showOverlay(`Round ${this.engine.currentRound}/13`, 1200);
      this.saveGame();
    });

    // New Game
    this.newGameBtn.addEventListener("click", ()=>{
      if(!confirm("Start a new game?")) return;
      this.engine.reset();
      this.renderDice();
      this.renderScoreboard();
      this.rollsLeftDisplay.textContent = `Rolls left: ${this.engine.rollsLeft}`;
      this.roundInfo.textContent = `Round ${this.engine.currentRound}/13`;
      this.message.textContent = "Click 'Roll Dice' to start!";
      this.showOverlay("New Game Started!", 2000);
      this.saveGame();
    });
  }
}

// Instantiate game
window.addEventListener('DOMContentLoaded', ()=>{
  window._yatzy = new YatzyGame();
});
