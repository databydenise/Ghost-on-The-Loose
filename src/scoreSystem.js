export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.bestScore = localStorage.getItem('ghost_best_score') || 0;
  }

  async calculateWinScore(gemsCollected, timeRemainingSeconds) {
    const gemBonus = gemsCollected * 100;
    const timeBonus = Math.max(0, Math.floor(timeRemainingSeconds)) * 10;
    
    this.score = gemBonus + timeBonus;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('ghost_best_score', this.bestScore);
    }

    // Submit stats to start.ng leaderboard
    try {
      await this.submitToStartNg({
        score: this.score, // <--- Add this line!
        gems: gemsCollected,
        time_left: Math.floor(timeRemainingSeconds)
      });
    } catch (e) {
      console.log("Leaderboard submission skipped (running locally)");
    }

    return {
      currentScore: this.score,
      bestScore: this.bestScore,
      gemBonus,
      timeBonus
    };
  }

  async submitToStartNg(stats) {
    const START_NG = 'https://start.ng';
    const el = document.createElement('iframe');
    el.src = `${START_NG}/connect`;
    el.hidden = true;
    document.body.append(el);

    await new Promise((resolve) => { el.onload = resolve; });

    return new Promise((resolve) => {
      const requestId = Math.random().toString(36).slice(2);
      const timer = setTimeout(() => { el.remove(); resolve(null); }, 3000);

      window.addEventListener('message', function onMsg(e) {
        if (e.origin !== START_NG) return;
        if (e.data?.type === 'startng:scoreSaved' && e.data.requestId === requestId) {
          clearTimeout(timer);
          window.removeEventListener('message', onMsg);
          el.remove();
          resolve(e.data);
        }
      });

      el.contentWindow.postMessage({ type: 'startng:score', stats, requestId }, START_NG);
    });
  }

  getBestScore() {
    return this.bestScore;
  }
}