const GROUPS = [
  {
    id: "grupa-1",
    name: "Grupa I",
    answer: "W\u0141\u00d3KNA",
    letters: ["\u00d3", "W", "N", "\u0141", "K", "A"],
    hint: "To cienkie, wyd\u0142u\u017cone elementy, z kt\u00f3rych powstaj\u0105 prz\u0119dze i materia\u0142y w\u0142\u00f3kiennicze.",
    colorClass: "color-green"
  },
  {
    id: "grupa-2",
    name: "Grupa II",
    answer: "KROSNO",
    letters: ["R", "O", "K", "N", "O", "S"],
    hint: "To urz\u0105dzenie, na kt\u00f3rym przeplata si\u0119 nitki osnowy i w\u0105tku, aby utka\u0107 tkanin\u0119.",
    colorClass: "color-blue"
  },
  {
    id: "grupa-3",
    name: "Grupa III",
    answer: "OSNOWA",
    letters: ["N", "O", "W", "O", "A", "S"],
    hint: "To zesp\u00f3\u0142 nitek u\u0142o\u017conych wzd\u0142u\u017c tkaniny i napi\u0119tych na kro\u015bnie.",
    colorClass: "color-pink"
  },
  {
    id: "grupa-4",
    name: "Grupa IV",
    answer: "SWETER",
    letters: ["T", "S", "E", "W", "R", "E"],
    hint: "To ciep\u0142a cz\u0119\u015b\u0107 garderoby, najcz\u0119\u015bciej robiona z dzianiny.",
    colorClass: "color-yellow"
  },
  {
    id: "grupa-5",
    name: "Grupa V",
    answer: "P\u0141\u00d3TNO",
    letters: ["\u0141", "O", "P", "T", "N", "\u00d3"],
    hint: "To tkanina wykonana splotem p\u0142\u00f3ciennym, w kt\u00f3rym nitki przeplataj\u0105 si\u0119 naprzemiennie.",
    colorClass: "color-violet"
  },
  {
    id: "grupa-6",
    name: "Grupa VI",
    answer: "SATYNA",
    letters: ["T", "S", "A", "Y", "N", "A"],
    hint: "To g\u0142adka i b\u0142yszcz\u0105ca tkanina o satynowym splocie.",
    colorClass: "color-purple"
  }
];

const ACCESS_PASSWORD = "0538";
const ACCESS_STORAGE_KEY = "escape-room-access-ok";
const SESSION_STORAGE_KEY = "escape-room-session-v1";
const REWARD_POOL = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "U", "W", "X", "Y", "2", "3", "4", "5", "6", "7", "8", "9"];

let selectedGroupId = null;
let revealUsedThisVisit = false;
const solvedGroups = new Set();
const hintUsedGroups = new Set();
const revealedTasksByGroup = new Map(
  GROUPS.map((group) => [group.id, new Set()])
);

function $(selector) {
  return document.querySelector(selector);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function createSessionConfig() {
  const shuffledRewards = shuffle(REWARD_POOL).slice(0, GROUPS.length);
  const rewardByGroupId = Object.fromEntries(
    GROUPS.map((group, index) => [group.id, shuffledRewards[index]])
  );

  return {
    finalKeyOrder: shuffle(GROUPS.map((group) => group.id)),
    rewardByGroupId
  };
}

function getSessionConfig() {
  try {
    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasValidOrder = Array.isArray(parsed.finalKeyOrder)
        && parsed.finalKeyOrder.length === GROUPS.length;
      const hasValidRewards = parsed.rewardByGroupId
        && GROUPS.every((group) => typeof parsed.rewardByGroupId[group.id] === "string");

      if (hasValidOrder && hasValidRewards) {
        return parsed;
      }
    }

    const created = createSessionConfig();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(created));
    return created;
  } catch {
    return createSessionConfig();
  }
}

const SESSION_CONFIG = getSessionConfig();

function normalizeText(text) {
  return String(text || "")
    .trim()
    .toUpperCase()
    .replaceAll("\u0104", "A")
    .replaceAll("\u0106", "C")
    .replaceAll("\u0118", "E")
    .replaceAll("\u0141", "L")
    .replaceAll("\u0143", "N")
    .replaceAll("\u00d3", "O")
    .replaceAll("\u015a", "S")
    .replaceAll("\u017b", "Z")
    .replaceAll("\u0179", "Z")
    .replace(/\s+/g, "");
}

function unlockApp() {
  $("#accessScreen").classList.add("hidden");
  $("#appShell").classList.remove("hidden");
  window.sessionStorage.setItem(ACCESS_STORAGE_KEY, "1");
}

function checkAccessPassword() {
  const attempt = normalizeText($("#accessPasswordInput").value);
  const message = $("#accessMessage");

  if (attempt === normalizeText(ACCESS_PASSWORD)) {
    message.textContent = "";
    unlockApp();
    return;
  }

  message.textContent = "To haslo jest niepoprawne.";
}

function getGroup(groupId = selectedGroupId) {
  return GROUPS.find((group) => group.id === groupId);
}

function getReward(groupId) {
  return SESSION_CONFIG.rewardByGroupId[groupId];
}

function getFinalKeyOrder() {
  return SESSION_CONFIG.finalKeyOrder;
}

function getFinalCode() {
  return getFinalKeyOrder().map((groupId) => getReward(groupId)).join("");
}

function renderKeyHint() {
  const labels = getFinalKeyOrder().map((groupId) => getGroup(groupId).name.replace("Grupa ", "")).join(" - ");
  $("#keyHint").textContent = `Ka\u017cda grupa zdobywa 1 znak. Wpisz znaki do zamka w kolejno\u015bci: ${labels}.`;
}

function showDoorOpening() {
  $("#doorOverlay").classList.remove("hidden");
}

function renderSymbolStrip() {
  $("#symbolStrip").innerHTML = getFinalKeyOrder().map((groupId) => {
    const group = getGroup(groupId);
    return `
      <div class="symbol-slot ${group.colorClass}">?</div>
    `;
  }).join("");
}

function renderGroupTiles() {
  $("#groupGrid").innerHTML = GROUPS.map((group) => {
    const solved = solvedGroups.has(group.id);
    const usedHint = hintUsedGroups.has(group.id);
    return `
      <button
        class="group-tile ${group.colorClass}${solved ? " done" : ""}${usedHint ? " used-hint" : ""}"
        type="button"
        data-group-id="${group.id}"
        data-reward="${solved ? getReward(group.id) : ""}"
      >
        ${group.name}
      </button>
    `;
  }).join("");

  document.querySelectorAll(".group-tile").forEach((button) => {
    button.addEventListener("click", () => openGroup(button.dataset.groupId));
  });
}

function createTaskTiles(group) {
  const revealedTasks = revealedTasksByGroup.get(group.id);
  const canRevealMore = !revealUsedThisVisit;

  return group.letters.map((letter, index) => {
    const taskNo = index + 1;
    const isRevealed = revealedTasks.has(taskNo);
    const isLocked = !isRevealed && !canRevealMore;
    return `
      <button
        class="task-tile ${group.colorClass}${isRevealed ? " revealed" : ""}${isLocked ? " locked" : ""}"
        type="button"
        data-task="${taskNo}"
        data-letter="${letter}"
        ${isLocked ? "disabled" : ""}
      >
        ${isRevealed ? letter : taskNo}
      </button>
    `;
  }).join("");
}

function updateRevealedWord() {
  const letters = Array.from(document.querySelectorAll(".task-tile.revealed"))
    .sort((a, b) => Number(a.dataset.task) - Number(b.dataset.task))
    .map((button) => button.dataset.letter);

  $("#revealedWord").textContent = letters.length ? letters.join(" ") : "-";
}

function clearFeedback() {
  const message = $("#message");
  message.textContent = "";
  message.classList.remove("success");
  $("#hintBox").classList.add("hidden");
  $("#hintText").textContent = "";
  $("#rewardBox").classList.add("hidden");
  $("#rewardSymbol").textContent = "";
  $("#rewardText").textContent = "";
}

function canUseHint(groupId = selectedGroupId) {
  const group = getGroup(groupId);
  const revealedTasks = revealedTasksByGroup.get(group.id);
  return revealedTasks.size === group.letters.length;
}

function bindTaskTiles() {
  document.querySelectorAll(".task-tile").forEach((button) => {
    button.addEventListener("click", () => {
      const revealedTasks = revealedTasksByGroup.get(selectedGroupId);
      const taskNo = Number(button.dataset.task);

      if (revealedTasks.has(taskNo)) {
        return;
      }

      revealedTasks.add(taskNo);
      revealUsedThisVisit = true;
      button.classList.add("revealed");
      button.textContent = button.dataset.letter;
      updateRevealedWord();
      clearFeedback();
      $("#message").textContent = "Na to wejście możecie odsłonić tylko jedno pole. Wróćcie do grup i wejdźcie ponownie.";
      renderCurrentGroupBoard();
    });
  });
}

function renderCurrentGroupBoard() {
  const group = getGroup();
  if (!group) {
    return;
  }

  $("#taskBoard").innerHTML = createTaskTiles(group);
  bindTaskTiles();
  updateRevealedWord();
}

function openGroup(groupId) {
  selectedGroupId = groupId;
  revealUsedThisVisit = false;
  const group = getGroup();

  $("#panelTitle").textContent = `${group.name} - panel zada\u0144`;
  $("#answerInput").value = "";
  clearFeedback();
  renderCurrentGroupBoard();

  $("#groupScreen").classList.add("hidden");
  $("#panelScreen").classList.remove("hidden");
}

function closeGroup() {
  selectedGroupId = null;
  revealUsedThisVisit = false;
  $("#panelScreen").classList.add("hidden");
  $("#groupScreen").classList.remove("hidden");
  renderGroupTiles();
}

function checkAnswer() {
  const group = getGroup();
  const answer = normalizeText($("#answerInput").value);
  const message = $("#message");

  if (!answer) {
    message.textContent = "Wpisz ukryte s\u0142owo.";
    message.classList.remove("success");
    $("#rewardBox").classList.add("hidden");
    return;
  }

  if (answer === normalizeText(group.answer)) {
    solvedGroups.add(group.id);
    message.textContent = "Brawo. To poprawne has\u0142o.";
    message.classList.add("success");
    $("#rewardSymbol").textContent = getReward(group.id);
    $("#rewardText").textContent = `Wasz znak do zamka to: ${getReward(group.id)}`;
    $("#rewardBox").classList.remove("hidden");
    renderGroupTiles();
    return;
  }

  message.textContent = "To nie jest poprawne has\u0142o. Sprawd\u017a litery jeszcze raz.";
  message.classList.remove("success");
  $("#rewardBox").classList.add("hidden");
}

function checkFinalCode() {
  const attempt = normalizeText($("#finalCodeInput").value);
  const message = $("#finalMessage");

  if (!attempt) {
    message.textContent = "Wpisz kod ko\u0144cowy.";
    message.classList.remove("success");
    return;
  }

  if (solvedGroups.size < GROUPS.length) {
    message.textContent = "Najpierw wszystkie grupy musz\u0105 zdoby\u0107 swoje znaki.";
    message.classList.remove("success");
    return;
  }

  if (attempt === getFinalCode()) {
    message.textContent = "Brawo! Zamek otwarty.";
    message.classList.add("success");
    showDoorOpening();
    return;
  }

  message.textContent = "Kod nie pasuje do klucza. Sprawd\u017a kolejno\u015b\u0107 znak\u00f3w.";
  message.classList.remove("success");
}

function showHint() {
  const group = getGroup();

  if (!canUseHint()) {
    const message = $("#message");
    message.textContent = "Podpowiedź odblokuje się dopiero po odsłonięciu wszystkich liter.";
    message.classList.remove("success");
    return;
  }

  hintUsedGroups.add(group.id);
  $("#hintText").textContent = group.hint;
  $("#hintBox").classList.remove("hidden");
  renderGroupTiles();
}

function bindControls() {
  $("#accessButton").addEventListener("click", checkAccessPassword);
  $("#accessPasswordInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkAccessPassword();
    }
  });
  $("#backButton").addEventListener("click", closeGroup);
  $("#checkButton").addEventListener("click", checkAnswer);
  $("#hintButton").addEventListener("click", showHint);
  $("#finalCheckButton").addEventListener("click", checkFinalCode);
}

function init() {
  if (window.sessionStorage.getItem(ACCESS_STORAGE_KEY) === "1") {
    unlockApp();
  }
  renderKeyHint();
  renderSymbolStrip();
  renderGroupTiles();
  bindControls();
}

init();
