const tg = window.Telegram?.WebApp;
const ROWS = 9;
const COLS = 9;
const MINES = 10;

const boardElement = document.querySelector('#board');
const mineCountElement = document.querySelector('#mine-count');
const timerElement = document.querySelector('#timer');
const statusElement = document.querySelector('#status');
const newGameButton = document.querySelector('#new-game');
const flagModeButton = document.querySelector('#flag-mode');
const sendResultButton = document.querySelector('#send-result');

let cells = [];
let gameState = null;
let timerId = null;
let flagMode = false;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#fff9fb');
  tg.setBackgroundColor('#fff9fb');
}

function newGame() {
  clearInterval(timerId);
  gameState = { startedAt: null, elapsed: 0, gameOver: false, won: false, flags: 0, opened: 0 };
  flagMode = false;
  flagModeButton.setAttribute('aria-pressed', 'false');
  sendResultButton.disabled = true;
  statusElement.textContent = 'Найди безопасный путь к победе';
  timerElement.textContent = '000';
  createBoard();
}

function createBoard() {
  const mineIndexes = new Set();
  while (mineIndexes.size < MINES) mineIndexes.add(Math.floor(Math.random() * ROWS * COLS));
  cells = Array.from({ length: ROWS * COLS }, (_, index) => ({ index, mine: mineIndexes.has(index), open: false, flagged: false, number: 0 }));
  cells.forEach((cell) => {
    if (!cell.mine) cell.number = neighbours(cell.index).filter((index) => cells[index].mine).length;
  });
  boardElement.replaceChildren();
  cells.forEach((cell) => {
    const button = document.createElement('button');
    button.className = 'cell';
    button.type = 'button';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `Клетка ${cell.index + 1}, закрыта`);
    button.dataset.index = cell.index;
    button.addEventListener('click', () => handleCell(cell.index));
    button.addEventListener('contextmenu', (event) => { event.preventDefault(); toggleFlag(cell.index); });
    boardElement.append(button);
  });
  render();
}

function neighbours(index) {
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const result = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (!rowOffset && !colOffset) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) result.push(nextRow * COLS + nextCol);
    }
  }
  return result;
}

function startTimer() {
  if (gameState.startedAt) return;
  gameState.startedAt = Date.now();
  timerId = setInterval(() => {
    gameState.elapsed = Math.floor((Date.now() - gameState.startedAt) / 1000);
    timerElement.textContent = String(gameState.elapsed).padStart(3, '0');
  }, 1000);
}

function handleCell(index) {
  if (gameState.gameOver) return;
  if (flagMode) { toggleFlag(index); return; }
  const cell = cells[index];
  if (cell.open || cell.flagged) return;
  startTimer();
  if (cell.mine) { loseGame(index); return; }
  openCell(index);
  if (gameState.opened === ROWS * COLS - MINES) winGame();
  render();
}

function openCell(index) {
  const cell = cells[index];
  if (cell.open || cell.flagged || cell.mine) return;
  cell.open = true;
  gameState.opened += 1;
  if (cell.number === 0) neighbours(index).forEach(openCell);
}

function toggleFlag(index) {
  if (gameState.gameOver || cells[index].open) return;
  startTimer();
  cells[index].flagged = !cells[index].flagged;
  gameState.flags += cells[index].flagged ? 1 : -1;
  render();
}

function loseGame(triggeredIndex) {
  gameState.gameOver = true;
  cells.forEach((cell) => { if (cell.mine) cell.open = true; });
  cells[triggeredIndex].open = true;
  clearInterval(timerId);
  statusElement.textContent = 'Мина нашлась раньше тебя. Попробуем ещё?';
  newGameButton.textContent = '↻';
  render();
  sendResultButton.disabled = false;
}

function winGame() {
  gameState.gameOver = true;
  gameState.won = true;
  cells.forEach((cell) => { if (cell.mine) cell.flagged = true; });
  gameState.flags = MINES;
  clearInterval(timerId);
  statusElement.textContent = `Победа за ${gameState.elapsed} сек. Ты великолепна! ✨`;
  newGameButton.textContent = '★';
  sendResultButton.disabled = false;
}

function render() {
  mineCountElement.textContent = String(Math.max(0, MINES - gameState.flags)).padStart(2, '0');
  cells.forEach((cell) => {
    const element = boardElement.children[cell.index];
    element.className = 'cell';
    element.textContent = '';
    element.removeAttribute('data-number');
    if (cell.open) {
      element.classList.add('open');
      if (cell.mine) { element.classList.add('mine'); element.textContent = '✹'; }
      else if (cell.number) { element.dataset.number = cell.number; element.textContent = cell.number; }
      element.setAttribute('aria-label', cell.mine ? 'Мина' : `Открытая клетка, мин рядом: ${cell.number}`);
    } else if (cell.flagged) {
      element.classList.add('flagged'); element.textContent = '⚑'; element.setAttribute('aria-label', 'Флаг');
    }
  });
}

flagModeButton.addEventListener('click', () => {
  flagMode = !flagMode;
  flagModeButton.setAttribute('aria-pressed', String(flagMode));
});
newGameButton.addEventListener('click', newGame);
sendResultButton.addEventListener('click', () => {
  const result = gameState.won ? `Победа в сапёре за ${gameState.elapsed} сек. 💗` : 'Попытка в сапёре окончена. В следующий раз получится!';
  if (tg) tg.sendData(JSON.stringify({ result, won: gameState.won, seconds: gameState.elapsed }));
  else statusElement.textContent = 'Результат готов для отправки в Telegram';
});

newGame();
