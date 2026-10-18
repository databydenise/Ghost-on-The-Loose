// ---------------------------------------------
// SCORE & STATS SYSTEM (Adapted for Ghost on the Loose)
// ---------------------------------------------

export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.bestScore = localStorage.getItem('ghost_best_score') || 0;
  }

  calculateWinScore(gemsCollected, timeRemainingSeconds) {
    const gemBonus = gemsCollected * 100;
    const timeBonus = Math.max(0, Math.floor(timeRemainingSeconds)) * 10;
    
    this.score = gemBonus + timeBonus;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('ghost_best_score', this.bestScore);
    }

    return {
      currentScore: this.score,
      bestScore: this.bestScore,
      gemBonus,
      timeBonus
    };
  }

  getBestScore() {
    return this.bestScore;
  }
}