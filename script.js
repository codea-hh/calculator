const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const keys = document.querySelectorAll(".key");

const state = {
  current: "0",
  previous: null,
  operator: null,
  waitingForOperand: false,
  expression: "",
};

const MAX_DIGITS = 12;

function formatNumber(value) {
  if (!isFinite(value)) return "Fehler";

  const str = String(value);
  if (str.includes("e")) return str;

  const [intPart, decPart] = str.split(".");
  const formattedInt = Number(intPart).toLocaleString("de-DE");

  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

function parseDisplay(value) {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function updateDisplay(animate = false) {
  resultEl.textContent = state.current;
  expressionEl.textContent = state.expression;

  if (animate) {
    resultEl.classList.add("pop");
    setTimeout(() => resultEl.classList.remove("pop"), 100);
  }
}

function setOperator(op) {
  const currentValue = parseDisplay(state.current);

  if (state.operator && !state.waitingForOperand) {
    const result = calculate(state.previous, currentValue, state.operator);
    if (result === null) return;
    state.previous = result;
    state.current = formatNumber(result);
  } else {
    state.previous = currentValue;
  }

  state.operator = op;
  state.waitingForOperand = true;
  state.expression = `${formatNumber(state.previous)} ${symbolFor(op)}`;
  highlightOperator(op);
  updateDisplay();
}

function symbolFor(op) {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] ?? op;
}

function highlightOperator(op) {
  keys.forEach((key) => {
    if (key.dataset.action === "operator") {
      key.classList.toggle("active", key.dataset.value === op);
    }
  });
}

function calculate(a, b, op) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) {
        state.current = "Fehler";
        state.previous = null;
        state.operator = null;
        state.waitingForOperand = true;
        state.expression = "";
        highlightOperator(null);
        updateDisplay(true);
        return null;
      }
      return a / b;
    default:
      return b;
  }
}

function inputDigit(digit) {
  if (state.waitingForOperand) {
    state.current = digit;
    state.waitingForOperand = false;
  } else {
    if (state.current === "0" && digit !== "0") {
      state.current = digit;
    } else if (state.current !== "0") {
      const raw = state.current.replace(",", "");
      if (raw.replace("-", "").length >= MAX_DIGITS) return;
      state.current += digit;
    }
  }
  updateDisplay();
}

function inputDecimal() {
  if (state.waitingForOperand) {
    state.current = "0,";
    state.waitingForOperand = false;
  } else if (!state.current.includes(",")) {
    state.current += ",";
  }
  updateDisplay();
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = false;
  state.expression = "";
  highlightOperator(null);
  updateDisplay();
}

function backspace() {
  if (state.current === "Fehler" || state.waitingForOperand) {
    clearAll();
    return;
  }
  if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith("-"))) {
    state.current = "0";
  } else {
    state.current = state.current.slice(0, -1);
  }
  updateDisplay();
}

function toggleSign() {
  if (state.current === "0" || state.current === "Fehler") return;
  state.current = state.current.startsWith("-")
    ? state.current.slice(1)
    : `-${state.current}`;
  updateDisplay();
}

function percent() {
  if (state.current === "Fehler") return;
  const value = parseDisplay(state.current) / 100;
  state.current = formatNumber(value);
  updateDisplay(true);
}

function equals() {
  if (state.operator === null || state.waitingForOperand) return;

  const currentValue = parseDisplay(state.current);
  const result = calculate(state.previous, currentValue, state.operator);
  if (result === null) return;

  state.expression = `${formatNumber(state.previous)} ${symbolFor(state.operator)} ${formatNumber(currentValue)} =`;
  state.current = formatNumber(result);
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = true;
  highlightOperator(null);
  updateDisplay(true);
}

function handleAction(action, value) {
  if (state.current === "Fehler" && action !== "clear") {
    clearAll();
    if (action === "clear") return;
  }

  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      setOperator(value);
      break;
    case "equals":
      equals();
      break;
    case "clear":
      clearAll();
      break;
    case "toggle-sign":
      toggleSign();
      break;
    case "percent":
      percent();
      break;
    case "backspace":
      backspace();
      break;
  }
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    handleAction(key.dataset.action, key.dataset.value);
  });
});

document.addEventListener("keydown", (e) => {
  const map = {
    "0": ["digit", "0"],
    "1": ["digit", "1"],
    "2": ["digit", "2"],
    "3": ["digit", "3"],
    "4": ["digit", "4"],
    "5": ["digit", "5"],
    "6": ["digit", "6"],
    "7": ["digit", "7"],
    "8": ["digit", "8"],
    "9": ["digit", "9"],
    "+": ["operator", "+"],
    "-": ["operator", "-"],
    "*": ["operator", "*"],
    "/": ["operator", "/"],
    Enter: ["equals"],
    "=": ["equals"],
    ",": ["decimal"],
    ".": ["decimal"],
    Escape: ["clear"],
    Backspace: ["backspace"],
    "%": ["percent"],
  };

  const entry = map[e.key];
  if (!entry) return;

  e.preventDefault();
  handleAction(entry[0], entry[1]);
});

updateDisplay();
