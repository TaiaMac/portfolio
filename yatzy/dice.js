export default class Dice {
  constructor(numDice = 5) {
    this.numDice = numDice;
    this.values = new Array(numDice).fill(0);
  }

  roll() {
    this.values = Array.from({ length: this.numDice }, () => Math.floor(Math.random() * 6) + 1);
    return this.values;
  }

  getValues() {
    return this.values;
  }
}
