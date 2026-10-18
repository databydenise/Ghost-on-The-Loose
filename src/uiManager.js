export class UIManager {
  constructor(totalGems) {
    this.totalGems = totalGems;
    
    // 1. Timer HUD (Upper Left)
    this.timerHud = document.createElement('div');
    this.timerHud.style.cssText = `
      position: fixed; top: 20px; left: 20px; color: #ff55ff; 
      font-family: sans-serif; font-size: 1.5rem; font-weight: bold;
      text-shadow: 0 0 10px #ff55ff; pointer-events: none; z-index: 10; display: none;
    `;
    this.timerHud.textContent = `Time: 60s`;
    document.body.appendChild(this.timerHud);

    // 2. Gem HUD (Upper Right)
    this.gemHud = document.createElement('div');
    this.gemHud.style.cssText = `
      position: fixed; top: 20px; right: 20px; color: #00ffff; 
      font-family: sans-serif; font-size: 1.5rem; font-weight: bold;
      text-shadow: 0 0 10px #00ffff; pointer-events: none; z-index: 10; display: none;
    `;
    this.gemHud.textContent = `Gems: 0 / ${this.totalGems}`;
    document.body.appendChild(this.gemHud);
  }

  showHUD() {
    this.timerHud.style.display = 'block';
    this.gemHud.style.display = 'block';
  }

  updateTimer(secondsLeft) {
    this.timerHud.textContent = `Time: ${Math.ceil(secondsLeft)}s`;
  }

  updateGems(currentGems) {
    this.gemHud.textContent = `Gems: ${currentGems} / ${this.totalGems}`;
  }

  // --- Tutorial Cards & Countdown ---
  showTutorialModal(onStartGame) {
    const cards = [
      {
        title: "GHOST ON THE LOOSE",
        text: "Collect all 5 glowing gems scattered across the maze before time runs out, then head straight to the finish portal!"
      },
      {
        title: "TIGHT CORNERS",
        text: "The hedge pathways can be narrow. Use precise W-A-S-D controls to wiggle through tight spaces and avoid getting stuck!"
      }
    ];

    let currentCardIndex = 0;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(20, 10, 35, 0.95); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 100; font-family: sans-serif;
    `;

    const cardContainer = document.createElement('div');
    cardContainer.style.cssText = `
      background: #23113c; border: 2px solid #ff55ff; border-radius: 12px;
      padding: 35px; width: 420px; max-width: 85vw; text-align: center;
      box-shadow: 0 0 30px rgba(255, 85, 255, 0.4); margin-bottom: 20px;
    `;
    
    // Append to DOM immediately so querySelector works smoothly
    overlay.appendChild(cardContainer);
    document.body.appendChild(overlay);

    const renderCard = () => {
      const card = cards[currentCardIndex];
      cardContainer.innerHTML = `
        <h2 style="color: #ff55ff; margin-top: 0; font-size: 1.8rem; text-shadow: 0 0 10px #ff55ff;">${card.title}</h2>
        <p style="color: #ffffff; font-size: 1.15rem; line-height: 1.6; margin-bottom: 25px;">${card.text}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #8877aa; font-size: 0.9rem;">Card ${currentCardIndex + 1} of ${cards.length}</span>
          <button id="next-card-btn" style="
            background: #ff00aa; color: #ffffff; border: none; padding: 10px 25px;
            font-size: 1.1rem; font-weight: bold; border-radius: 8px; cursor: pointer;
            box-shadow: 0 0 12px #ff00aa;
          ">${currentCardIndex === cards.length - 1 ? "Ready! ➔" : "Next ➔"}</button>
        </div>
      `;

      cardContainer.querySelector('#next-card-btn').addEventListener('click', () => {
        currentCardIndex++;
        if (currentCardIndex < cards.length) {
          renderCard();
        } else {
          runCountdown(overlay, onStartGame);
        }
      });
    };

    const runCountdown = (container, callback) => {
      let count = 3;
      container.innerHTML = `
        <h1 id="countdown-num" style="color: #33ffcc; font-size: 6rem; text-shadow: 0 0 30px #33ffcc; margin: 0;">${count}</h1>
        <p style="color: #ffffff; font-size: 1.3rem; margin-top: 15px; letter-spacing: 2px;">GET READY...</p>
      `;

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          const numEl = container.querySelector('#countdown-num');
          if (numEl) numEl.textContent = count;
        } else if (count === 0) {
          const numEl = container.querySelector('#countdown-num');
          if (numEl) {
            numEl.textContent = "GO!";
            numEl.style.color = "#ff55ff";
            numEl.style.textShadow = "0 0 30px #ff55ff";
          }
        } else {
          clearInterval(interval);
          container.remove();
          callback();
        }
      }, 1000);
    };

    renderCard();
  }

  showGameOverOverlay() {
    this.createOverlay("TIME'S UP!", "#ff3333", "The shadows consumed you...", "Try Again");
  }

  showVictoryOverlay(scoreResults) {
    const subtitle = `Score: ${scoreResults.currentScore}<br>Gems: +${scoreResults.gemBonus} | Time Bonus: +${scoreResults.timeBonus}<br><br><b>Best Score: ${scoreResults.bestScore}</b>`;
    this.createOverlay("VICTORY!", "#33ffcc", subtitle, "Play Again");
  }

  createOverlay(title, color, message, buttonText) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(20, 10, 35, 0.85); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 100; font-family: sans-serif;
    `;
    overlay.innerHTML = `
      <h1 style="color: ${color}; font-size: 3rem; text-shadow: 0 0 20px ${color}; margin-bottom: 10px;">${title}</h1>
      <p style="color: #ffffff; font-size: 1.2rem; text-align: center; margin-bottom: 25px; line-height: 1.5;">${message}</p>
      <button id="restart-btn" style="
        background: ${color}; color: #1a0b2e; border: none; padding: 12px 30px;
        font-size: 1.2rem; font-weight: bold; border-radius: 8px; cursor: pointer;
        box-shadow: 0 0 15px ${color};
      ">${buttonText}</button>
    `;
    document.body.appendChild(overlay);

    document.getElementById('restart-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }
}