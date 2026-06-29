console.log("盗賊ゲーム 運営補助ツール Ver.0.7");

const STORAGE_KEY = "thief_game_save_v07";

// 画面
const setupScreen = document.getElementById("setupScreen");
const roundScreen = document.getElementById("roundScreen");
const confirmScreen = document.getElementById("confirmScreen");
const resultScreen = document.getElementById("resultScreen");
const finalScreen = document.getElementById("finalScreen");

// 設定入力
const playerCountInput = document.getElementById("playerCount");
const initialPointsInput = document.getElementById("initialPoints");
const roundCountInput = document.getElementById("roundCount");
const playerNameInputs = document.getElementById("playerNameInputs");

// ボタン
const startGameButton = document.getElementById("startGameButton");
const resumeSavedButton = document.getElementById("resumeSavedButton");
const deleteSavedButton = document.getElementById("deleteSavedButton");
const checkInputButton = document.getElementById("checkInputButton");
const backToRoundButton = document.getElementById("backToRoundButton");
const confirmCalculateButton = document.getElementById("confirmCalculateButton");
const nextRoundButton = document.getElementById("nextRoundButton");
const resetGameButton = document.getElementById("resetGameButton");

// 表示エリア
const saveStatusText = document.getElementById("saveStatusText");
const roundDisplay = document.getElementById("roundDisplay");
const roundStatusLabel = document.getElementById("roundStatusLabel");
const actionTable = document.getElementById("actionTable");
const confirmActionList = document.getElementById("confirmActionList");
const roundResultText = document.getElementById("roundResultText");
const roundLogList = document.getElementById("roundLogList");
const currentRankingList = document.getElementById("currentRankingList");
const finalRankingList = document.getElementById("finalRankingList");
const historyDisplay = document.getElementById("historyDisplay");
const finalHistoryDisplay = document.getElementById("finalHistoryDisplay");

// ゲーム状態
let game = createDefaultGame();

const actionLabels = {
  steal: "奪う",
  guard: "守る",
  save: "貯める"
};

function createDefaultGame() {
  return {
    players: [],
    currentRound: 1,
    maxRound: 3,
    initialPoints: 10,
    history: [],
    pendingActions: [],
    currentInputs: [],
    currentScreen: "setup"
  };
}

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

// 保存データを取得する
function getSavedData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);

    if (!rawData) {
      return null;
    }

    return JSON.parse(rawData);
  } catch (error) {
    console.warn("保存データの読み込みに失敗しました。", error);
    return null;
  }
}

// ゲーム状態を保存する
function saveGame() {
  try {
    const saveData = {
      version: "0.7",
      savedAt: new Date().toISOString(),
      game: game
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    updateSavePanel();
  } catch (error) {
    console.warn("ゲーム状態の保存に失敗しました。", error);
  }
}

// 保存データを削除する
function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    updateSavePanel();
  } catch (error) {
    console.warn("保存データの削除に失敗しました。", error);
  }
}

// 保存データ欄の表示を更新する
function updateSavePanel() {
  const savedData = getSavedData();

  if (!savedData || !savedData.game || !savedData.game.players || savedData.game.players.length === 0) {
    saveStatusText.textContent = "保存データはありません。新しくゲームを開始できます。";
    resumeSavedButton.disabled = true;
    deleteSavedButton.disabled = true;
    return;
  }

  const savedAt = new Date(savedData.savedAt);
  const savedAtText = savedAt.toLocaleString("ja-JP");

  saveStatusText.textContent =
    "保存データがあります。最終保存：" + savedAtText
    + " / 現在ラウンド：" + savedData.game.currentRound + " / " + savedData.game.maxRound;

  resumeSavedButton.disabled = false;
  deleteSavedButton.disabled = false;
}

// 指定した画面だけ表示する
function showScreen(targetScreen, screenName, shouldSave = true) {
  setupScreen.classList.remove("active");
  roundScreen.classList.remove("active");
  confirmScreen.classList.remove("active");
  resultScreen.classList.remove("active");
  finalScreen.classList.remove("active");

  targetScreen.classList.add("active");

  if (screenName) {
    game.currentScreen = screenName;
  }

  if (shouldSave && game.players.length > 0) {
    saveGame();
  }
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

// プレイヤーをIDで探す
function findPlayer(playerId) {
  return game.players.find(function (player) {
    return player.id === Number(playerId);
  });
}

// ラウンド表示を更新する
function updateRoundDisplay() {
  roundDisplay.textContent = game.currentRound + " / " + game.maxRound;
  roundStatusLabel.textContent = "第" + game.currentRound + "ラウンド";
}

// 現在入力中の行動を保存用に集める
function captureCurrentInputsFromDom() {
  const actionSelects = document.querySelectorAll(".action-select");

  return Array.from(actionSelects).map(function (actionSelect) {
    const playerId = Number(actionSelect.dataset.playerId);

    const targetSelect = document.querySelector(
      '.target-select[data-player-id="' + playerId + '"]'
    );

    return {
      playerId: playerId,
      action: actionSelect.value,
      targetId: targetSelect && targetSelect.value ? Number(targetSelect.value) : null
    };
  });
}

// 入力中の行動を保存する
function saveCurrentInputsFromDom() {
  game.currentInputs = captureCurrentInputsFromDom();
  saveGame();
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

    const nameCell = document.createElement("span");
    nameCell.textContent = player.name;

    const pointCell = document.createElement("span");
    pointCell.className = "player-point";
    pointCell.textContent = player.points + " pt";

    const actionSelect = document.createElement("select");
    actionSelect.className = "action-select";
    actionSelect.dataset.playerId = player.id;

    actionSelect.innerHTML = `
      <option value="">行動を選択</option>
      <option value="steal">奪う</option>
      <option value="guard">守る</option>
      <option value="save">貯める</option>
    `;

    const targetSelect = document.createElement("select");
    targetSelect.className = "target-select";
    targetSelect.dataset.playerId = player.id;
    targetSelect.disabled = true;

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "対象なし";
    targetSelect.appendChild(emptyOption);

    game.players.forEach(function (targetPlayer) {
      if (targetPlayer.id !== player.id) {
        const option = document.createElement("option");
        option.value = targetPlayer.id;
        option.textContent = targetPlayer.name;
        targetSelect.appendChild(option);
      }
    });

    actionSelect.addEventListener("change", function () {
      updateTargetSelect(player.id);
      saveCurrentInputsFromDom();
    });

    targetSelect.addEventListener("change", function () {
      saveCurrentInputsFromDom();
    });

    row.appendChild(nameCell);
    row.appendChild(pointCell);
    row.appendChild(actionSelect);
    row.appendChild(targetSelect);

    actionTable.appendChild(row);
  });

  applyCurrentInputsToRoundScreen();
}

// 保存されている入力内容をラウンド画面へ反映する
function applyCurrentInputsToRoundScreen() {
  if (!game.currentInputs || game.currentInputs.length === 0) {
    return;
  }

  game.currentInputs.forEach(function (input) {
    const actionSelect = document.querySelector(
      '.action-select[data-player-id="' + input.playerId + '"]'
    );

    const targetSelect = document.querySelector(
      '.target-select[data-player-id="' + input.playerId + '"]'
    );

    if (!actionSelect || !targetSelect) {
      return;
    }

    actionSelect.value = input.action || "";
    updateTargetSelect(input.playerId);

    if (input.action === "steal" && input.targetId) {
      targetSelect.value = String(input.targetId);
    }
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

  if (!actionSelect || !targetSelect) {
    return;
  }

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

    const targetPlayer = findPlayer(targetSelect.value);

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

// 入力確認画面を作る
function renderConfirmScreen(actions) {
  confirmActionList.innerHTML = "";

  actions.forEach(function (action) {
    const li = document.createElement("li");

    if (action.action === "steal") {
      li.textContent = action.playerName + "：" + action.actionLabel + " → " + action.targetName;
    } else {
      li.textContent = action.playerName + "：" + action.actionLabel;
    }

    confirmActionList.appendChild(li);
  });
}

// ラウンド結果を計算する
function calculateRoundResults(actions) {
  const logs = [];

  const actionMap = new Map();

  actions.forEach(function (action) {
    actionMap.set(action.playerId, action);
  });

  const stealCountByTarget = new Map();

  actions.forEach(function (action) {
    if (action.action === "steal") {
      const currentCount = stealCountByTarget.get(action.targetId) || 0;
      stealCountByTarget.set(action.targetId, currentCount + 1);
    }
  });

  actions.forEach(function (action) {
    if (action.action !== "steal") {
      return;
    }

    const thief = findPlayer(action.playerId);
    const target = findPlayer(action.targetId);
    const targetAction = actionMap.get(action.targetId);

    if (!thief || !target || !targetAction) {
      return;
    }

    if (targetAction.action === "save") {
      thief.points += 10;
      target.points -= 10;

      logs.push(
        thief.name + " は " + target.name + " から奪うことに成功。"
        + thief.name + " +10 pt / " + target.name + " -10 pt"
      );
    }

    if (targetAction.action === "guard") {
      thief.points -= 5;
      target.points += 5;

      logs.push(
        thief.name + " は " + target.name + " を狙ったが、守られた。"
        + thief.name + " -5 pt / " + target.name + " +5 pt"
      );
    }

    if (targetAction.action === "steal") {
      logs.push(
        thief.name + " は " + target.name + " を狙ったが、相手も奪う行動だったため変動なし。"
      );
    }
  });

  actions.forEach(function (action) {
    const player = findPlayer(action.playerId);
    const stealCount = stealCountByTarget.get(action.playerId) || 0;

    if (!player) {
      return;
    }

    if (action.action === "save" && stealCount === 0) {
      player.points += 5;
      logs.push(player.name + " は安全に貯めた。+5 pt");
    }

    if (action.action === "guard" && stealCount === 0) {
      logs.push(player.name + " は守ったが、誰にも狙われなかった。変動なし。");
    }
  });

  if (logs.length === 0) {
    logs.push("このラウンドではポイント変動がありませんでした。");
  }

  const rankingSnapshot = getSortedPlayers().map(function (player) {
    return {
      name: player.name,
      points: player.points
    };
  });

  const historyItem = {
    round: game.currentRound,
    actions: actions,
    logs: logs,
    ranking: rankingSnapshot
  };

  game.history.push(historyItem);

  return logs;
}

// 結果画面を作る
function renderResultScreen(logs) {
  roundResultText.textContent =
    "第" + game.currentRound + "ラウンドの処理結果です。";

  roundLogList.innerHTML = "";

  logs.forEach(function (log) {
    const li = document.createElement("li");
    li.textContent = log;
    roundLogList.appendChild(li);
  });

  renderRanking(currentRankingList);
  renderHistory(historyDisplay);

  if (game.currentRound >= game.maxRound) {
    nextRoundButton.textContent = "最終結果へ";
  } else {
    nextRoundButton.textContent = "次のラウンドへ";
  }
}

// 順位順に並べたプレイヤー一覧を返す
function getSortedPlayers() {
  return [...game.players].sort(function (a, b) {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.order - b.order;
  });
}

// ランキングを表示する
function renderRanking(listElement) {
  const sortedPlayers = getSortedPlayers();

  listElement.innerHTML = "";

  sortedPlayers.forEach(function (player) {
    const li = document.createElement("li");
    li.textContent = player.name + "：" + player.points + " pt";
    listElement.appendChild(li);
  });
}

// 履歴を表示する
function renderHistory(containerElement) {
  containerElement.innerHTML = "";

  if (game.history.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "help-text";
    emptyText.textContent = "まだ履歴はありません。";
    containerElement.appendChild(emptyText);
    return;
  }

  game.history.forEach(function (historyItem) {
    const historyCard = document.createElement("div");
    historyCard.className = "history-item";

    const title = document.createElement("h4");
    title.textContent = "第" + historyItem.round + "ラウンド";
    historyCard.appendChild(title);

    const actionBlock = document.createElement("div");
    actionBlock.className = "history-block";

    const actionTitle = document.createElement("p");
    actionTitle.className = "history-block-title";
    actionTitle.textContent = "行動";
    actionBlock.appendChild(actionTitle);

    const actionList = document.createElement("ul");

    historyItem.actions.forEach(function (action) {
      const li = document.createElement("li");

      if (action.action === "steal") {
        li.textContent = action.playerName + "：" + action.actionLabel + " → " + action.targetName;
      } else {
        li.textContent = action.playerName + "：" + action.actionLabel;
      }

      actionList.appendChild(li);
    });

    actionBlock.appendChild(actionList);
    historyCard.appendChild(actionBlock);

    const resultBlock = document.createElement("div");
    resultBlock.className = "history-block";

    const resultTitle = document.createElement("p");
    resultTitle.className = "history-block-title";
    resultTitle.textContent = "処理結果";
    resultBlock.appendChild(resultTitle);

    const resultList = document.createElement("ul");

    historyItem.logs.forEach(function (log) {
      const li = document.createElement("li");
      li.textContent = log;
      resultList.appendChild(li);
    });

    resultBlock.appendChild(resultList);
    historyCard.appendChild(resultBlock);

    const rankingBlock = document.createElement("div");
    rankingBlock.className = "history-block";

    const rankingTitle = document.createElement("p");
    rankingTitle.className = "history-block-title";
    rankingTitle.textContent = "ラウンド終了時ランキング";
    rankingBlock.appendChild(rankingTitle);

    const rankingList = document.createElement("ol");

    historyItem.ranking.forEach(function (player) {
      const li = document.createElement("li");
      li.textContent = player.name + "：" + player.points + " pt";
      rankingList.appendChild(li);
    });

    rankingBlock.appendChild(rankingList);
    historyCard.appendChild(rankingBlock);

    containerElement.appendChild(historyCard);
  });
}

// 最終結果を表示する
function renderFinalResult() {
  const sortedPlayers = getSortedPlayers();

  const medals = ["🥇", "🥈", "🥉"];

  finalRankingList.innerHTML = "";

  sortedPlayers.forEach(function (player, index) {
    const li = document.createElement("li");
    const medal = medals[index] || "　";
    li.textContent = medal + " " + player.name + "：" + player.points + " pt";
    finalRankingList.appendChild(li);
  });

  renderHistory(finalHistoryDisplay);
}

// 保存データから復元する
function restoreGameFromSave(savedData) {
  game = {
    ...createDefaultGame(),
    ...savedData.game
  };

  if (!game.currentInputs) {
    game.currentInputs = [];
  }

  if (!game.pendingActions) {
    game.pendingActions = [];
  }

  updateRoundDisplay();
  renderRoundScreen();
  renderRanking(currentRankingList);

  if (game.currentScreen === "round") {
    showScreen(roundScreen, "round", false);
    return;
  }

  if (game.currentScreen === "confirm") {
    renderConfirmScreen(game.pendingActions);
    showScreen(confirmScreen, "confirm", false);
    return;
  }

  if (game.currentScreen === "result") {
    const lastHistory = game.history[game.history.length - 1];
    const logs = lastHistory ? lastHistory.logs : [];
    renderResultScreen(logs);
    showScreen(resultScreen, "result", false);
    return;
  }

  if (game.currentScreen === "final") {
    renderFinalResult();
    showScreen(finalScreen, "final", false);
    return;
  }

  showScreen(setupScreen, "setup", false);
}

// プレイヤー人数変更時に名前入力欄を作り直す
playerCountInput.addEventListener("change", function () {
  createPlayerNameInputs();
});

// 新しくゲーム開始
startGameButton.addEventListener("click", function () {
  game = createDefaultGame();

  game.players = createPlayersFromSettings();
  game.currentRound = 1;
  game.maxRound = getNumber(roundCountInput.value, 3, 1);
  game.initialPoints = getNumber(initialPointsInput.value, 10, 0);
  game.history = [];
  game.pendingActions = [];
  game.currentInputs = [];
  game.currentScreen = "round";

  updateRoundDisplay();
  renderRoundScreen();
  renderRanking(currentRankingList);
  showScreen(roundScreen, "round");
});

// 保存データから再開
resumeSavedButton.addEventListener("click", function () {
  const savedData = getSavedData();

  if (!savedData || !savedData.game) {
    alert("保存データがありません。");
    updateSavePanel();
    return;
  }

  restoreGameFromSave(savedData);
});

// 保存データを削除
deleteSavedButton.addEventListener("click", function () {
  const ok = confirm("保存データを削除します。現在の途中経過は復元できなくなります。よろしいですか？");

  if (!ok) {
    return;
  }

  clearSavedGame();
});

// 入力内容を確認
checkInputButton.addEventListener("click", function () {
  const actions = getRoundActions();

  if (!validateRoundActions(actions)) {
    return;
  }

  game.currentInputs = captureCurrentInputsFromDom();
  game.pendingActions = actions;
  renderConfirmScreen(actions);
  showScreen(confirmScreen, "confirm");
});

// 入力に戻る
backToRoundButton.addEventListener("click", function () {
  renderRoundScreen();
  showScreen(roundScreen, "round");
});

// この内容で確定
confirmCalculateButton.addEventListener("click", function () {
  if (!game.pendingActions || game.pendingActions.length === 0) {
    alert("確定する入力内容がありません。");
    renderRoundScreen();
    showScreen(roundScreen, "round");
    return;
  }

  const logs = calculateRoundResults(game.pendingActions);

  game.pendingActions = [];
  game.currentInputs = [];

  renderResultScreen(logs);
  showScreen(resultScreen, "result");
});

// 次のラウンドへ
nextRoundButton.addEventListener("click", function () {
  game.currentRound++;

  if (game.currentRound > game.maxRound) {
    renderFinalResult();
    showScreen(finalScreen, "final");
  } else {
    game.currentInputs = [];
    game.pendingActions = [];

    updateRoundDisplay();
    renderRoundScreen();
    showScreen(roundScreen, "round");
  }
});

// 保存データを削除して新しいゲームへ
resetGameButton.addEventListener("click", function () {
  clearSavedGame();
  game = createDefaultGame();
  createPlayerNameInputs();
  showScreen(setupScreen, "setup", false);
  updateSavePanel();
});

// 初期表示
createPlayerNameInputs();
updateSavePanel();

const savedDataOnLoad = getSavedData();

if (
  savedDataOnLoad
  && savedDataOnLoad.game
  && savedDataOnLoad.game.players
  && savedDataOnLoad.game.players.length > 0
  && savedDataOnLoad.game.currentScreen !== "setup"
) {
  restoreGameFromSave(savedDataOnLoad);
}
