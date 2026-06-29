console.log("盗賊ゲーム 運営補助ツール Ver.0.3");

// 画面
const setupScreen = document.getElementById("setupScreen");
const roundScreen = document.getElementById("roundScreen");
const resultScreen = document.getElementById("resultScreen");
const finalScreen = document.getElementById("finalScreen");

// 設定入力
const playerCountInput = document.getElementById("playerCount");
const initialPointsInput = document.getElementById("initialPoints");
const roundCountInput = document.getElementById("roundCount");
const playerNameInputs = document.getElementById("playerNameInputs");

// ボタン
const startGameButton = document.getElementById("startGameButton");
const calculateResultButton = document.getElementById("calculateResultButton");
const nextRoundButton = document.getElementById("nextRoundButton");
const resetGameButton = document.getElementById("resetGameButton");

// 表示エリア
const roundDisplay = document.getElementById("roundDisplay");
const roundStatusLabel = document.getElementById("roundStatusLabel");
const actionTable = document.getElementById("actionTable");
const roundResultText = document.getElementById("roundResultText");
const roundLogList = document.getElementById("roundLogList");
const currentRankingList = document.getElementById("currentRankingList");
const finalRankingList = document.getElementById("finalRankingList");

// ゲーム状態
let game = {
  players: [],
  currentRound: 1,
  maxRound: 3,
  initialPoints: 10
};

const actionLabels = {
  steal: "奪う",
  guard: "守る",
  save: "貯める"
};

// 数値入力を安全に読み取る
function getNumber(value, fallback, min) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  if (number < min) {
    return min;
  }

  return number;
}

// 指定した画面だけ表示する
function showScreen(targetScreen) {
  setupScreen.classList.remove("active");
  roundScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  finalScreen.classList.remove("active");

  targetScreen.classList.add("active");
}

// プレイヤー名入力欄を作る
function createPlayerNameInputs() {
  const count = getNumber(playerCountInput.value, 5, 3);

  const oldInputs = playerNameInputs.querySelectorAll("input");
  const oldNames = Array.from(oldInputs).map(function (input) {
    return input.value;
  });

  playerNameInputs.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "playerName" + (i + 1);
    input.placeholder = "プレイヤー" + (i + 1);
    input.value = oldNames[i] || "";

    playerNameInputs.appendChild(input);
  }
}

// 設定画面の内容からプレイヤーデータを作る
function createPlayersFromSettings() {
  const count = getNumber(playerCountInput.value, 5, 3);
  const initialPoints = getNumber(initialPointsInput.value, 10, 0);

  const players = [];

  for (let i = 0; i < count; i++) {
    const nameInput = document.getElementById("playerName" + (i + 1));
    const name = nameInput.value.trim() || "プレイヤー" + (i + 1);

    players.push({
      id: i + 1,
      order: i + 1,
      name: name,
      points: initialPoints
    });
  }

  return players;
}

// ラウンド表示を更新する
function updateRoundDisplay() {
  roundDisplay.textContent = game.currentRound + " / " + game.maxRound;
  roundStatusLabel.textContent = "第" + game.currentRound + "ラウンド";
}

// ラウンド画面を作る
function renderRoundScreen() {
  actionTable.innerHTML = "";

  const headRow = document.createElement("div");
  headRow.className = "action-row action-head";
  headRow.innerHTML = `
    <span>プレイヤー</span>
    <span>現在ポイント</span>
    <span>行動</span>
    <span>対象</span>
  `;
  actionTable.appendChild(headRow);

  game.players.forEach(function (player) {
    const row = document.createElement("div");
    row.className = "action-row";

    row.innerHTML = `
      <span>${player.name}</span>
      <span class="player-point">${player.points} pt</span>
      <select class="action-select" data-player-id="${player.id}">
        <option value="">行動を選択</option>
        <option value="steal">奪う</option>
        <option value="guard">守る</option>
        <option value="save">貯める</option>
      </select>
      <select class="target-select" data-player-id="${player.id}" disabled>
        <option value="">対象なし</option>
      </select>
    `;

    actionTable.appendChild(row);

    const targetSelect = row.querySelector(".target-select");

    game.players.forEach(function (targetPlayer) {
      if (targetPlayer.id !== player.id) {
        const option = document.createElement("option");
        option.value = targetPlayer.id;
        option.textContent = targetPlayer.name;
        targetSelect.appendChild(option);
      }
    });

    const actionSelect = row.querySelector(".action-select");

    actionSelect.addEventListener("change", function () {
      updateTargetSelect(player.id);
    });
  });
}

// 行動が「奪う」の時だけ対象選択を有効にする
function updateTargetSelect(playerId) {
  const actionSelect = document.querySelector(
    '.action-select[data-player-id="' + playerId + '"]'
  );

  const targetSelect = document.querySelector(
    '.target-select[data-player-id="' + playerId + '"]'
  );

  if (actionSelect.value === "steal") {
    targetSelect.disabled = false;
  } else {
    targetSelect.value = "";
    targetSelect.disabled = true;
  }
}

// 入力された行動を集める
function getRoundActions() {
  return game.players.map(function (player) {
    const actionSelect = document.querySelector(
      '.action-select[data-player-id="' + player.id + '"]'
    );

    const targetSelect = document.querySelector(
      '.target-select[data-player-id="' + player.id + '"]'
    );

    const targetPlayer = game.players.find(function (p) {
      return p.id === Number(targetSelect.value);
    });

    return {
      playerId: player.id,
      playerName: player.name,
      action: actionSelect.value,
      actionLabel: actionLabels[actionSelect.value] || "未選択",
      targetId: targetSelect.value ? Number(targetSelect.value) : null,
      targetName: targetPlayer ? targetPlayer.name : ""
    };
  });
}

// 行動入力に問題がないか確認する
function validateRoundActions(actions) {
  for (const action of actions) {
    if (!action.action) {
      alert(action.playerName + " の行動が未選択です。");
      return false;
    }

    if (action.action === "steal" && !action.targetId) {
      alert(action.playerName + " は「奪う」を選んでいるので、対象を選択してください。");
      return false;
    }
  }

  return true;
}

// 結果画面を作る
function renderResultScreen(actions) {
  roundResultText.textContent =
    "第" + game.currentRound + "ラウンドの入力内容です。ポイント計算は次のバージョンで実装します。";

  roundLogList.innerHTML = "";

  actions.forEach(function (action) {
    const li = document.createElement("li");

    if (action.action === "steal") {
      li.textContent =
        action.playerName + "：" + action.actionLabel + " → " + action.targetName;
    } else {
      li.textContent = action.playerName + "：" + action.actionLabel;
    }

    roundLogList.appendChild(li);
  });

  renderRanking(currentRankingList);
}

// ランキングを表示する
function renderRanking(listElement) {
  const sortedPlayers = [...game.players].sort(function (a, b) {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.order - b.order;
  });

  listElement.innerHTML = "";

  sortedPlayers.forEach(function (player) {
    const li = document.createElement("li");
    li.textContent = player.name + "：" + player.points + " pt";
    listElement.appendChild(li);
  });
}

// 最終結果を表示する
function renderFinalResult() {
  const sortedPlayers = [...game.players].sort(function (a, b) {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.order - b.order;
  });

  const medals = ["🥇", "🥈", "🥉"];

  finalRankingList.innerHTML = "";

  sortedPlayers.forEach(function (player, index) {
    const li = document.createElement("li");
    const medal = medals[index] || "　";
    li.textContent = medal + " " + player.name + "：" + player.points + " pt";
    finalRankingList.appendChild(li);
  });
}

// プレイヤー人数変更時に名前入力欄を作り直す
playerCountInput.addEventListener("change", function () {
  createPlayerNameInputs();
});

// ゲーム開始
startGameButton.addEventListener("click", function () {
  game.players = createPlayersFromSettings();
  game.currentRound = 1;
  game.maxRound = getNumber(roundCountInput.value, 3, 1);
  game.initialPoints = getNumber(initialPointsInput.value, 10, 0);

  updateRoundDisplay();
  renderRoundScreen();
  renderRanking(currentRankingList);
  showScreen(roundScreen);
});

// 入力内容を確認
calculateResultButton.addEventListener("click", function () {
  const actions = getRoundActions();

  if (!validateRoundActions(actions)) {
    return;
  }

  renderResultScreen(actions);
  showScreen(resultScreen);
});

// 次のラウンドへ
nextRoundButton.addEventListener("click", function () {
  game.currentRound++;

  if (game.currentRound > game.maxRound) {
    renderFinalResult();
    showScreen(finalScreen);
  } else {
    updateRoundDisplay();
    renderRoundScreen();
    showScreen(roundScreen);
  }
});

// 新しいゲームを始める
resetGameButton.addEventListener("click", function () {
  game.currentRound = 1;
  showScreen(setupScreen);
});

// 初期表示
createPlayerNameInputs();
