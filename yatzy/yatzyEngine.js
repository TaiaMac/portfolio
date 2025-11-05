// yatzyEngine.js
export default class YatzyEngine {
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

  // rollDice rolls unheld dice
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
  }

  reset() {
    this.dice = [0,0,0,0,0];
    this.held = [false,false,false,false,false];
    this.rollsLeft = 3;
    this.currentRound = 1;
    this.scores = this.resetScores();
  }

  autoScore() {
    // Upper section
    const names = ['ones','twos','threes','fours','fives','sixes'];
    for (let i=1;i<=6;i++) {
      this.scores[names[i-1]] = this.dice.filter(d => d===i).reduce((a,b)=>a+b,0);
    }

    // counts and sums
    const counts = {};
    this.dice.forEach(d => counts[d] = (counts[d]||0) + 1);
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

    // totals
    this.scores.sum = ['ones','twos','threes','fours','fives','sixes'].reduce((a,c)=>a+(this.scores[c]||0),0);
    this.scores.bonus = this.scores.sum >= 63 ? 35 : 0;
    // total_score sum only numeric fields
    this.scores.total_score = Object.values(this.scores).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);
  }
}
