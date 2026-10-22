/* =========================================================
   Life Dashboard — app.js
   LocalStorage keys: "tasks", "links", "timerDuration",
                       "userName", "theme"
   ========================================================= */

/* ---------------------------------------------------------
   Section 1 — Theme (Light / Dark Mode)
   Challenge 1: Toggle light/dark mode, persist to localStorage
   --------------------------------------------------------- */
const themeToggleBtn = document.getElementById('theme-toggle');

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent = '🌙';
  }
}

themeToggleBtn.addEventListener('click', function () {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
});

/* ---------------------------------------------------------
   Section 2 — Clock & Greeting
   Challenge 2: Show custom name in greeting, persist to localStorage
   --------------------------------------------------------- */
function pad(n) {
  return String(n).padStart(2, '0');
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  document.getElementById('clock').textContent = pad(h) + ':' + pad(m) + ':' + pad(s);

  document.getElementById('date').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let greetingText;
  if (h >= 4 && h <= 10) {
    greetingText = 'Good Morning';
  } else if (h >= 11 && h <= 14) {
    greetingText = 'Good Afternoon';
  } else if (h >= 15 && h <= 18) {
    greetingText = 'Good Evening';
  } else {
    greetingText = 'Good Night';
  }

  const userName = localStorage.getItem('userName');
  const greetingEl = document.getElementById('greeting');
  if (userName) {
    greetingEl.textContent = greetingText + ', ' + userName + '!';
  } else {
    greetingEl.textContent = greetingText;
  }
}

/* ---------------------------------------------------------
   Section 3 — Edit Name (Challenge 2)
   Click on greeting text to edit name
   --------------------------------------------------------- */
const greetingEl = document.getElementById('greeting');

greetingEl.style.cursor = 'pointer';
greetingEl.title = 'Click to set your name';

greetingEl.addEventListener('click', function () {
  const currentName = localStorage.getItem('userName') || '';
  const newName = prompt('Enter your name:', currentName);
  if (newName !== null) {
    const trimmed = newName.trim();
    if (trimmed) {
      localStorage.setItem('userName', trimmed);
    } else {
      localStorage.removeItem('userName');
    }
    updateClock();
  }
});

/* ---------------------------------------------------------
   Section 4 — Focus Timer
   Challenge 3: Change Pomodoro time, persist to localStorage
   --------------------------------------------------------- */
let timerInterval = null;
let timeLeft      = 0;
let isRunning     = false;

const timerDisplay = document.getElementById('timer-display');
const timerStart   = document.getElementById('timer-start');
const timerStop    = document.getElementById('timer-stop');
const timerReset   = document.getElementById('timer-reset');

function getTimerDuration() {
  const saved = parseInt(localStorage.getItem('timerDuration'), 10);
  return (saved && saved >= 1 && saved <= 60) ? saved : 25;
}

function renderTimer() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent = pad(mins) + ':' + pad(secs);
}

function initTimer() {
  const dur = getTimerDuration();
  timeLeft = dur * 60;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    // AudioContext not supported
  }
}

timerStart.addEventListener('click', function () {
  if (isRunning) return;
  if (timeLeft <= 0) {
    timeLeft = getTimerDuration() * 60;
    renderTimer();
  }
  isRunning = true;

  timerInterval = setInterval(function () {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      playBeep();
      alert('⏰ Focus session complete! Great work!');
    }
  }, 1000);
});

timerStop.addEventListener('click', function () {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
});

timerReset.addEventListener('click', function () {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  timeLeft = getTimerDuration() * 60;
  renderTimer();
});

// Challenge 3: double-click on timer display to change duration
timerDisplay.style.cursor = 'pointer';
timerDisplay.title = 'Double-click to change duration';

timerDisplay.addEventListener('dblclick', function () {
  if (isRunning) return;
  const current = getTimerDuration();
  const input = prompt('Set Pomodoro duration (1–60 minutes):', current);
  if (input === null) return;
  let val = parseInt(input, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 60) val = 60;
  localStorage.setItem('timerDuration', val);
  timeLeft = val * 60;
  renderTimer();
});

/* ---------------------------------------------------------
   Section 5 — To-Do List
   --------------------------------------------------------- */
let tasks = [];

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  } catch (e) {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  tasks.forEach(function (task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.setAttribute('aria-label', 'Mark task done');
    cb.addEventListener('change', function () {
      const t = tasks.find(function (x) { return x.id === task.id; });
      if (t) {
        t.done = cb.checked;
        saveTasks();
        renderTasks();
      }
    });

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.addEventListener('click', function () {
      tasks = tasks.filter(function (x) { return x.id !== task.id; });
      saveTasks();
      renderTasks();
    });

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

document.getElementById('task-add-btn').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addTask();
});

function addTask() {
  const input = document.getElementById('task-input');
  const text  = input.value.trim();
  if (!text) return;

  tasks.push({ id: Date.now(), text: text, done: false });
  saveTasks();
  renderTasks();
  input.value = '';
}

/* ---------------------------------------------------------
   Section 6 — Quick Links
   --------------------------------------------------------- */
let links = [];

const defaultLinks = [
  { id: 1, name: 'Google',   url: 'https://google.com' },
  { id: 2, name: 'Gmail',    url: 'https://mail.google.com' },
  { id: 3, name: 'Calendar', url: 'https://calendar.google.com' },
];

function loadLinks() {
  try {
    const saved = JSON.parse(localStorage.getItem('links'));
    links = (saved && saved.length > 0) ? saved : defaultLinks.slice();
  } catch (e) {
    links = defaultLinks.slice();
  }
}

function saveLinks() {
  localStorage.setItem('links', JSON.stringify(links));
}

function renderLinks() {
  const container = document.getElementById('links-container');
  container.innerHTML = '';

  links.forEach(function (link) {
    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const removeSpan = document.createElement('span');
    removeSpan.className = 'remove-link';
    removeSpan.textContent = '×';
    removeSpan.setAttribute('role', 'button');
    removeSpan.setAttribute('aria-label', 'Remove link ' + link.name);
    removeSpan.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      links = links.filter(function (l) { return l.id !== link.id; });
      saveLinks();
      renderLinks();
    });

    a.appendChild(removeSpan);
    container.appendChild(a);
  });
}

document.getElementById('link-add-btn').addEventListener('click', addLink);

function addLink() {
  const nameInput = document.getElementById('link-name-input');
  const urlInput  = document.getElementById('link-url-input');
  const name      = nameInput.value.trim();
  let   url       = urlInput.value.trim();

  if (!name || !url) {
    alert('Please enter both a link name and URL.');
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  links.push({ id: Date.now(), name: name, url: url });
  saveLinks();
  renderLinks();
  nameInput.value = '';
  urlInput.value  = '';
}

/* ---------------------------------------------------------
   Section 7 — Initialisation
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  updateClock();
  setInterval(updateClock, 1000);
  initTimer();
  renderTimer();
  loadTasks();
  renderTasks();
  loadLinks();
  renderLinks();
});
