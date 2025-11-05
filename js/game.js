let size = parseInt(localStorage.getItem("boardSize")) || 8;
let board = [];
let mineCount = Math.floor(size * size * 0.15);
let timer = 0;
let timerInterval;
let started = false;

const boardEl = document.getElementById("game-board");
const timerEl = document.getElementById("timer");
const backBtn = document.getElementById("back-btn");


const toggleBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
toggleBtn.addEventListener("click", () => {
  const newTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

backBtn.onclick = () => window.location.href = "index.html";


function initBoard() {
  boardEl.setAttribute("data-size", size);
  boardEl.innerHTML = "";
  board = [];

  
  let cellSize = 30;
  if (size === 8) cellSize = 65;
  else if (size === 16) cellSize = 40;
  else if (size === 24) cellSize = 30;

  boardEl.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;

  for (let y = 0; y < size; y++) {
    board[y] = [];
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener("click", handleClick);
      cell.addEventListener("contextmenu", handleFlag);
      boardEl.appendChild(cell);
      board[y][x] = { mine: false, open: false, flag: false, el: cell, count: 0 };
    }
  }
}

initBoard(); 


function placeMines(firstX, firstY) {
  let placed = 0;
  while (placed < mineCount) {
    let x = Math.floor(Math.random() * size);
    let y = Math.floor(Math.random() * size);

   
    if (Math.abs(x - firstX) <= 1 && Math.abs(y - firstY) <= 1) continue;

    if (!board[y][x].mine) {
      board[y][x].mine = true;
      placed++;
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x].mine) continue;
      board[y][x].count = getNeighbors(x, y).filter(c => c.mine).length;
    }
  }
}


function getNeighbors(x, y) {
  const n = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size) n.push(board[ny][nx]);
    }
  }
  return n;
}


function handleClick(e) {
  const x = +this.dataset.x;
  const y = +this.dataset.y;

  if (!started) {
    started = true;
    placeMines(x, y);
    timerInterval = setInterval(() => {
      timer++;
      timerEl.textContent = `⏱ ${timer} c`;
    }, 1000);

    
    floodReveal(x, y);
    return;
  }

  openCell(x, y);
}


function handleFlag(e) {
  e.preventDefault();
  const x = +this.dataset.x;
  const y = +this.dataset.y;
  const cell = board[y][x];
  if (cell.open) return;
  cell.flag = !cell.flag;
  cell.el.classList.toggle("flag");
  cell.el.textContent = cell.flag ? "🚩" : "";
}


function openCell(x, y) {
  const cell = board[y][x];
  if (cell.open || cell.flag) return;

  cell.open = true;
  cell.el.classList.add("open");

  if (cell.mine) {
    showAllMines();
    cell.el.classList.add("mine");
    cell.el.textContent = "💣";
    clearInterval(timerInterval);
    setTimeout(() => {
      alert("💥 Ви програли!");
      location.reload();
    }, 1000);
    return;
  }

  if (cell.count > 0) {
    cell.el.textContent = cell.count;
  } else {
    floodReveal(x, y);
  }

  checkWin();
}


function floodReveal(x, y) {
  const queue = [[x, y]];
  const visited = new Set();

  while (queue.length) {
    const [cx, cy] = queue.shift();
    const cell = board[cy][cx];
    if (visited.has(cx + "," + cy) || cell.open || cell.flag) continue;
    visited.add(cx + "," + cy);
    cell.open = true;
    cell.el.classList.add("open");

    if (cell.mine) continue;

    if (cell.count > 0) {
      cell.el.textContent = cell.count;
    } else {
      getNeighbors(cx, cy).forEach(n => queue.push([+n.el.dataset.x, +n.el.dataset.y]));
    }
  }
}


function showAllMines() {
  board.flat().forEach(c => {
    if (c.mine) {
      c.el.classList.add("mine");
      c.el.textContent = "💣";
    }
  });
}


function checkWin() {
  const unopened = board.flat().filter(c => !c.open && !c.mine);
  if (unopened.length === 0) {
    clearInterval(timerInterval);
    setTimeout(() => alert(`🎉 Перемога за ${timer} секунд!`), 300);
  }
}
