console.log("盗賊ゲーム 運営補助ツール Ver.1.2");

const STORAGE_KEY = "thief_game_save_v12";

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
const confirmPromotionButton = document.getElementById("confirmPromotionButton");
const nextRoundButton = document.getElementById("nextRoundButton");
const resetGameButton = document.getElementById("resetGameButton");
const copyDiscordTextButton = document.getElementById("copyDiscordTextButton");

// 表示エリア
const saveStatusText = document.getElementById("saveStatusText");
const roundDisplay = document.getElementById("roundDisplay");
const roundStatusLabel = document.getElementById("roundStatusLabel");
const actionTable = document.getElementById("actionTable");
const confirmActionList = document.getElementById("confirmActionList");
const roundResultText = document.getElementById("roundResultText");
const roundLogList = document.getElementById("roundLogList");
const promotionOptions = document.getElementById("promotionOptions");
const promotionResult = document.getElementById("promotionResult");
const currentRankingList = document.getElementById("currentRankingList");
const finalRankingList = document.getElementById("finalRankingList");
const historyDisplay = document.getElementById("historyDisplay");
const finalHistoryDisplay = document.getElementById("finalHistoryDisplay");
const discordResultText = document.getElementById("discordResultText");

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

function saveGame() {
  try {
    const saveData = {
      version: "1.2",
      savedAt: new Date().toISOString(),
      game: game
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    updateSavePanel();
  } catch (error) {
    console.warn("ゲーム状態の保存に失敗しました。", error);
  }
}

function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    updateSavePanel();
  } catch (error) {
    console.warn("保存データの削除に失敗しました。", error);
  }
}

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

function createPlayerNameInputs() {
  const count = getNumber(playerCountInput.value, 5, 4);

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

function createPlayersFromSettings() {
  const count = getNumber(playerCountInput.value, 5, 4);
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

function findPlayer(playerId) {
  return game.players.find(function (player) {
    return player.id === Number(playerId);
  });
}

function updateRoundDisplay() {
  roundDisplay.textContent = game.currentRound + " / " + game.maxRound;
  roundStatusLabel.textContent = "第" + game.currentRound + "ラウンド";
}

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

function saveCurrentInputsFromDom() {
  game.currentInputs = captureCurrentInputsFromDom();
  saveGame();
}

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
      targetName: targetPlayer ? targetPlayer.name : "",
      resultSummary: ""
    };
  });
}

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

function addDelta(deltaMap, playerId, amount) {
  const current = deltaMap.get(playerId) || 0;
  deltaMap.set(playerId, current + amount);
}

function calculateRoundResults(actions) {
  const logs = [];
  const deltaMap = new Map();
  const actionMap = new Map();
  const stealCountByTarget = new Map();

  actions.forEach(function (action) {
    action.resultSummary = "";
    actionMap.set(action.playerId, action);
    deltaMap.set(action.playerId, 0);
  });

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

    const targetAction = actionMap.get(action.targetId);

    if (!targetAction) {
      return;
    }

    if (targetAction.action === "save") {
      addDelta(deltaMap, action.playerId, 10);
      action.resultSummary = "奪うことに成功（+10P）";

      logs.push(
        action.playerName + " は " + targetAction.playerName + " から奪うことに成功。"
        + action.playerName + " +10P"
      );
    }

    if (targetAction.action === "guard") {
      addDelta(deltaMap, action.playerId, -5);
      action.resultSummary = "守られて失敗（-5P）";

      logs.push(
        action.playerName + " は " + targetAction.playerName + " を狙ったが、守られた。"
        + action.playerName + " -5P"
      );
    }

    if (targetAction.action === "steal") {
      action.resultSummary = "相手も奪う行動だったため変動なし";

      logs.push(
        action.playerName + " は " + targetAction.playerName + " を狙ったが、相手も奪う行動だったため変動なし。"
      );
    }
  });

  actions.forEach(function (action) {
    const stealCount = stealCountByTarget.get(action.playerId) || 0;

    if (action.action === "save") {
      addDelta(deltaMap, action.playerId, 5);

      if (stealCount > 0) {
        addDelta(deltaMap, action.playerId, -10);
        action.resultSummary = "貯めたが奪われた（+5P / -10P / 合計 -5P）";

        logs.push(
          action.playerName + " は貯めたが、奪うの対象になった。"
          + action.playerName + " +5P / -10P（合計 -5P）"
        );
      } else {
        action.resultSummary = "安全に貯めた（+5P）";
        logs.push(action.playerName + " は安全に貯めた。+5P");
      }
    }

    if (action.action === "guard") {
      if (stealCount > 0) {
        addDelta(deltaMap, action.playerId, 5);
        action.resultSummary = "返り討ちに成功（+5P）";

        logs.push(
          action.playerName + " は守りに成功した。"
          + action.playerName + " +5P"
        );
      } else {
        addDelta(deltaMap, action.playerId, -1);
        action.resultSummary = "誰にも狙われず空振り（-1P）";

        logs.push(
          action.playerName + " は守ったが、誰にも狙われなかった。"
          + action.playerName + " -1P"
        );
      }
    }
  });

  game.players.forEach(function (player) {
    const delta = deltaMap.get(player.id) || 0;
    player.points += delta;
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
    publicity: [],
    ranking: rankingSnapshot
  };

  game.history.push(historyItem);

  return logs;
}

function getCurrentHistoryItem() {
  return game.history.find(function (historyItem) {
    return historyItem.round === game.currentRound;
  });
}

function renderResultScreen(logs) {
  roundResultText.textContent =
    "第" + game.currentRound + "ラウンドの処理結果です。";

  roundLogList.innerHTML = "";

  logs.forEach(function (log) {
    const li = document.createElement("li");
    li.textContent = log;
    roundLogList.appendChild(li);
  });

  renderPromotionPanel();
  renderRanking(currentRankingList);
  renderHistory(historyDisplay);

  if (game.currentRound >= game.maxRound) {
    nextRoundButton.textContent = "最終結果へ";
  } else {
    nextRoundButton.textContent = "次のラウンドへ";
  }
}

function renderPromotionPanel() {
  promotionOptions.innerHTML = "";
  promotionResult.innerHTML = "";

  const historyItem = getCurrentHistoryItem();

  if (!historyItem) {
    promotionOptions.innerHTML = "<p class='help-text'>喧伝できるラウンド結果がありません。</p>";
    confirmPromotionButton.disabled = true;
    return;
  }

  if (!historyItem.publicity) {
    historyItem.publicity = [];
  }

  if (historyItem.publicity.length > 0) {
    confirmPromotionButton.disabled = true;

    const title = document.createElement("p");
    title.className = "history-block-title";
    title.textContent = "喧伝済み";
    promotionResult.appendChild(title);

    const list = document.createElement("ul");
    list.className = "log-list";

    historyItem.publicity.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent =
        item.playerName + " が喧伝しました。行動：" + item.actionLabel
        + " / 結果：" + item.resultSummary
        + " / 喧伝報酬：+1P";
      list.appendChild(li);
    });

    promotionResult.appendChild(list);
    return;
  }

  confirmPromotionButton.disabled = false;

  historyItem.actions.forEach(function (action) {
    const label = document.createElement("label");
    label.className = "promotion-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "promotion-checkbox";
    checkbox.value = action.playerId;

    const textWrap = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = action.playerName;

    const detail = document.createElement("span");
    detail.textContent =
      "公開内容：行動「" + action.actionLabel + "」 / 結果「" + action.resultSummary + "」";

    textWrap.appendChild(name);
    textWrap.appendChild(detail);

    label.appendChild(checkbox);
    label.appendChild(textWrap);

    promotionOptions.appendChild(label);
  });
}

function applyPromotion() {
  const historyItem = getCurrentHistoryItem();

  if (!historyItem) {
    alert("喧伝できるラウンド結果がありません。");
    return;
  }

  if (!historyItem.publicity) {
    historyItem.publicity = [];
  }

  if (historyItem.publicity.length > 0) {
    alert("このラウンドの喧伝はすでに確定済みです。");
    return;
  }

  const checkedBoxes = document.querySelectorAll(".promotion-checkbox:checked");

  if (checkedBoxes.length === 0) {
    alert("喧伝するプレイヤーを選択してください。");
    return;
  }

  checkedBoxes.forEach(function (checkbox) {
    const playerId = Number(checkbox.value);
    const player = findPlayer(playerId);
    const action = historyItem.actions.find(function (item) {
      return item.playerId === playerId;
    });

    if (!player || !action) {
      return;
    }

    player.points += 1;

    historyItem.publicity.push({
      playerId: player.id,
      playerName: player.name,
      actionLabel: action.actionLabel,
      resultSummary: action.resultSummary,
      bonus: 1
    });
  });

  historyItem.ranking = getSortedPlayers().map(function (player) {
    return {
      name: player.name,
      points: player.points
    };
  });

  renderPromotionPanel();
  renderRanking(currentRankingList);
  renderHistory(historyDisplay);
  saveGame();
}

function getSortedPlayers() {
  return [...game.players].sort(function (a, b) {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.order - b.order;
  });
}

function renderRanking(listElement) {
  const sortedPlayers = getSortedPlayers();

  listElement.innerHTML = "";

  sortedPlayers.forEach(function (player) {
    const li = document.createElement("li");
    li.textContent = player.name + "：" + player.points + "P";
    listElement.appendChild(li);
  });
}

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

    if (historyItem.publicity && historyItem.publicity.length > 0) {
      const publicityBlock = document.createElement("div");
      publicityBlock.className = "history-block";

      const publicityTitle = document.createElement("p");
      publicityTitle.className = "history-block-title";
      publicityTitle.textContent = "喧伝";
      publicityBlock.appendChild(publicityTitle);

      const publicityList = document.createElement("ul");

      historyItem.publicity.forEach(function (item) {
        const li = document.createElement("li");
        li.textContent =
          item.playerName + " が喧伝。行動：" + item.actionLabel
          + " / 結果：" + item.resultSummary
          + " / +1P";
        publicityList.appendChild(li);
      });

      publicityBlock.appendChild(publicityList);
      historyCard.appendChild(publicityBlock);
    }

    const rankingBlock = document.createElement("div");
    rankingBlock.className = "history-block";

    const rankingTitle = document.createElement("p");
    rankingTitle.className = "history-block-title";
    rankingTitle.textContent = "ラウンド終了時ランキング";
    rankingBlock.appendChild(rankingTitle);

    const rankingList = document.createElement("ol");

    historyItem.ranking.forEach(function (player) {
      const li = document.createElement("li");
      li.textContent = player.name + "：" + player.points + "P";
      rankingList.appendChild(li);
    });

    rankingBlock.appendChild(rankingList);
    historyCard.appendChild(rankingBlock);

    containerElement.appendChild(historyCard);
  });
}

function buildDiscordResultText() {
  const sortedPlayers = getSortedPlayers();
  const medals = ["🥇", "🥈", "🥉"];

  const lines = [];

  lines.push("【盗賊ゲーム 最終結果】");
  lines.push("");

  sortedPlayers.forEach(function (player, index) {
    const medal = medals[index] || "・";
    lines.push(medal + " " + (index + 1) + "位　" + player.name + "：" + player.points + "P");
  });

  lines.push("");
  lines.push("――――――――――");
  lines.push("【ラウンド履歴】");

  game.history.forEach(function (historyItem) {
    lines.push("");
    lines.push("■ 第" + historyItem.round + "ラウンド");

    lines.push("行動");
    historyItem.actions.forEach(function (action) {
      if (action.action === "steal") {
        lines.push("・" + action.playerName + "：" + action.actionLabel + " → " + action.targetName);
      } else {
        lines.push("・" + action.playerName + "：" + action.actionLabel);
      }
    });

    lines.push("");
    lines.push("処理結果");
    historyItem.logs.forEach(function (log) {
      lines.push("・" + log);
    });

    if (historyItem.publicity && historyItem.publicity.length > 0) {
      lines.push("");
      lines.push("喧伝");
      historyItem.publicity.forEach(function (item) {
        lines.push(
          "・" + item.playerName + " が喧伝"
          + " / 行動：" + item.actionLabel
          + " / 結果：" + item.resultSummary
          + " / +1P"
        );
      });
    }

    lines.push("");
    lines.push("ラウンド終了時順位");
    historyItem.ranking.forEach(function (player, index) {
      lines.push((index + 1) + "位　" + player.name + "：" + player.points + "P");
    });
  });

  lines.push("");
  lines.push("――――――――――");
  lines.push("運営：ゲームマスター");

  return lines.join("\n");
}

function renderDiscordText() {
  discordResultText.value = buildDiscordResultText();
}

function renderFinalResult() {
  const sortedPlayers = getSortedPlayers();

  const medals = ["🥇", "🥈", "🥉"];

  finalRankingList.innerHTML = "";

  sortedPlayers.forEach(function (player, index) {
    const li = document.createElement("li");
    const medal = medals[index] || "　";
    li.textContent = medal + " " + player.name + "：" + player.points + "P";
    finalRankingList.appendChild(li);
  });

  renderDiscordText();
  renderHistory(finalHistoryDisplay);
}

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

  if (!game.history) {
    game.history = [];
  }

  game.history.forEach(function (historyItem) {
    if (!historyItem.publicity) {
      historyItem.publicity = [];
    }
  });

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

playerCountInput.addEventListener("change", function () {
  createPlayerNameInputs();
});

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

resumeSavedButton.addEventListener("click", function () {
  const savedData = getSavedData();

  if (!savedData || !savedData.game) {
    alert("保存データがありません。");
    updateSavePanel();
    return;
  }

  restoreGameFromSave(savedData);
});

deleteSavedButton.addEventListener("click", function () {
  const ok = confirm("保存データを削除します。現在の途中経過は復元できなくなります。よろしいですか？");

  if (!ok) {
    return;
  }

  clearSavedGame();
});

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

backToRoundButton.addEventListener("click", function () {
  renderRoundScreen();
  showScreen(roundScreen, "round");
});

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

confirmPromotionButton.addEventListener("click", function () {
  applyPromotion();
});

nextRoundButton.addEventListener("click", function () {
  const checkedPromotionBoxes = document.querySelectorAll(".promotion-checkbox:checked");
  const currentHistory = getCurrentHistoryItem();

  if (
    checkedPromotionBoxes.length > 0
    && currentHistory
    && (!currentHistory.publicity || currentHistory.publicity.length === 0)
  ) {
    const ok = confirm("喧伝するプレイヤーが選択されていますが、まだ確定されていません。喧伝なしで進みますか？");

    if (!ok) {
      return;
    }
  }

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

copyDiscordTextButton.addEventListener("click", function () {
  const text = discordResultText.value;

  if (!text) {
    alert("コピーするテキストがありません。");
    return;
  }

  navigator.clipboard.writeText(text)
    .then(function () {
      copyDiscordTextButton.textContent = "コピーしました";

      setTimeout(function () {
        copyDiscordTextButton.textContent = "Discord用テキストをコピー";
      }, 1500);
    })
    .catch(function () {
      discordResultText.select();
      document.execCommand("copy");
      alert("テキストをコピーしました。");
    });
});

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
