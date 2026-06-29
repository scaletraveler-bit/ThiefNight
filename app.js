console.log("盗賊ゲーム 運営補助ツール Ver.0.2");

// 画面
const setupScreen = document.getElementById("setupScreen");
const roundScreen = document.getElementById("roundScreen");
const resultScreen = document.getElementById("resultScreen");
const finalScreen = document.getElementById("finalScreen");

// ボタン
const startGameButton = document.getElementById("startGameButton");
const calculateResultButton = document.getElementById("calculateResultButton");
const nextRoundButton = document.getElementById("nextRoundButton");
const resetGameButton = document.getElementById("resetGameButton");

// 入力欄
const roundCountInput = document.getElementById("roundCount");

// 表示欄
const roundDisplay = document.getElementById("roundDisplay");
const roundStatusLabel = document.getElementById("roundStatusLabel");

// ゲーム状態
let currentRound = 1;
let maxRound = 3;

// 指定した画面だけ表示する
function showScreen(targetScreen) {
  setupScreen.classList.remove("active");
  roundScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  finalScreen.classList.remove("active");

  targetScreen.classList.add("active");
}

// ラウンド表示を更新する
function updateRoundDisplay() {
  roundDisplay.textContent = currentRound + " / " + maxRound;
  roundStatusLabel.textContent = "第" + currentRound + "ラウンド";
}

// ゲーム開始
startGameButton.addEventListener("click", function () {
  currentRound = 1;
  maxRound = Number(roundCountInput.value);

  if (maxRound < 1) {
    maxRound = 1;
  }

  updateRoundDisplay();
  showScreen(roundScreen);
});

// 結果計算
calculateResultButton.addEventListener("click", function () {
  showScreen(resultScreen);
});

// 次のラウンドへ
nextRoundButton.addEventListener("click", function () {
  currentRound++;

  if (currentRound > maxRound) {
    showScreen(finalScreen);
  } else {
    updateRoundDisplay();
    showScreen(roundScreen);
  }
});

// 新しいゲームを始める
resetGameButton.addEventListener("click", function () {
  currentRound = 1;
  showScreen(setupScreen);
});
