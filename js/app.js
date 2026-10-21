/* =========================================================
   Life Dashboard — app.js
   All application logic in one file.
   LocalStorage keys: "tasks", "links", "timerDuration",
                       "userName", "theme"
   ========================================================= */

/* ---------------------------------------------------------
   Section 1 — Theme (Light / Dark Mode)
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
   --------------------------------------------------------- */
function pad(n) {
  return String(n).padStart(2, '0');
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  // Time display
  document.getElementById('clock').textContent = pad(h) + ':' + pad(m) + ':' + pad(s);

  // Date display
  document.getElementById('date').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Greeting based on hour
  let greetingText;
  if (h >= 5 && h <= 11) {
    greetingText = 'Good Morning';
  } else if (h >= 12 && h <= 17) {
    greetingText = 'Good Afternoon';
  } else if (h >= 18 && h <= 21) {
    greetingText = 'Good Evening';
  } else {
    greetingText = 'Good Night';
  }

  const userName = localStorage.getItem('userName') || 'Friend';
  document.getElementById('greeting').textContent = greetingText + ', ' + userName + '!';
}

/* ---------------------------------------------------------
   Section 3 — Edit Name
   --------------------------------------------------------- */
const editNameBtn  = document.getElementById('edit-name-btn');
const nameInput    = document.getElementById('name-input');
const greetingEl   = document.getElementById('greeting');

function showNameInput() {
  const currentName = localStorage.getItem('userName') || 'Friend';
  nameInput.value = currentName;
  nameInput.classList.remove('hidden');
  greetingEl.classList.add('hidden');
  editNameBtn.classList.add('hidden');
  nameInput.focus();
}

function saveName() {
  const trimmed = nameInput.value.trim();
  if (trimmed) {
    localStorage.setItem('userName', trimmed);
  }
  nameInput.classList.add('hidden');
  greetingEl.classList.remove('hidden');
  editNameBtn.classList.remove('hidden');
  updateClock(); // refresh greeting immediately
}

editNameBtn.addEventListener('click', showNameInput);

nameInput.addEventListener('blur', saveName);

nameInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    nameInput.blur(); // triggers blur → saveName
  } else if (e.key === 'Escape') {
    nameInput.value = localStorage.getItem('userName') || 'Friend';
    nameInput.blur();
  }
});

/* ---------------------------------------------------------
   Section 4 — Focus Timer
   --------------------------------------------------------- */
let timerInterval  = null;
let timeLeft       = 0;
let isRunning      = false;

const timerDisplay  = document.getElementById('timer-display');
const timerStart    = document.getElementById('timer-start');
const timerStop     = document.getElementById('timer-stop');
const timerReset    = document.getElementById('timer-reset');
const timerDurInput = document.getElementById('timer-duration-input');

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
  timerDurInput.value = dur;
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
    // AudioContext not supported — silently skip
  }
}

timerStart.addEventListener('click', function () {
  if (isRunning) return;
  if (timeLeft <= 0) {
    // Reset before starting if already at 0
    const dur = getTimerDuration();
    timeLeft = dur * 60;
    renderTimer();
  }
  isRunning = true;
  timerDurInput.disabled = true;

  timerInterval = setInterval(function () {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      timerDurInput.disabled = false;
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
  timerDurInput.disabled = false;
});

timerReset.addEventListener('click', function () {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  timerDurInput.disabled = false;
  const dur = getTimerDuration();
  timerDurInput.value = dur;
  timeLeft = dur * 60;
  renderTimer();
});

timerDurInput.addEventListener('change', function () {
  let val = parseInt(this.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 60) val = 60;
  this.value = val;
  localStorage.setItem('timerDuration', val);
  // Reset timer to new duration
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
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
  const sortVal = document.getElementById('sort-select').value;
  let sorted;

  if (sortVal === 'active') {
    // Undone tasks first, preserve relative order within each group
    sorted = tasks.slice().sort(function (a, b) {
      return Number(a.done) - Number(b.done);
    });
  } else if (sortVal === 'completed') {
    // Done tasks first
    sorted = tasks.slice().sort(function (a, b) {
      return Number(b.done) - Number(a.done);
    });
  } else {
    // Default: insertion order
    sorted = tasks.slice();
  }

  const list = document.getElementById('task-list');
  list.innerHTML = '';

  sorted.forEach(function (task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    // Checkbox
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

    // Task text span
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task');

    editBtn.addEventListener('click', function () {
      if (editBtn.textContent === 'Edit') {
        // Switch to edit mode
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = task.text;
        editInput.setAttribute('aria-label', 'Edit task text');

        li.replaceChild(editInput, span);
        editBtn.textContent = 'Save';
        editInput.focus();

        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') editBtn.click();
          if (e.key === 'Escape') {
            li.replaceChild(span, editInput);
            editBtn.textContent = 'Edit';
          }
        });
      } else {
        // Save mode
        const editInput = li.querySelector('.task-edit-input');
        const newText = editInput ? editInput.value.trim() : '';
        if (newText) {
          const t = tasks.find(function (x) { return x.id === task.id; });
          if (t) {
            t.text = newText;
            saveTasks();
            renderTasks();
          }
        } else {
          li.replaceChild(span, editInput);
          editBtn.textContent = 'Edit';
        }
      }
    });

    // Delete button
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
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Add task
document.getElementById('task-add-btn').addEventListener('click', addTask);
document.getElementById('task-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addTask();
});

function addTask() {
  const input   = document.getElementById('task-input');
  const warning = document.getElementById('task-warning');
  const text    = input.value.trim();

  if (!text) return;

  // Duplicate check
  const isDuplicate = tasks.some(function (t) {
    return t.text.toLowerCase() === text.toLowerCase();
  });

  if (isDuplicate) {
    input.classList.add('shake');
    warning.classList.remove('hidden');
    setTimeout(function () {
      input.classList.remove('shake');
    }, 600);
    setTimeout(function () {
      warning.classList.add('hidden');
    }, 2500);
    return;
  }

  tasks.push({ id: Date.now(), text: text, done: false });
  saveTasks();
  renderTasks();
  input.value = '';
  warning.classList.add('hidden');
}

// Sort change
document.getElementById('sort-select').addEventListener('change', renderTasks);

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

// Add link
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

  // Ensure url has a protocol
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
  // Theme
  initTheme();

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Timer
  initTimer();
  renderTimer();

  // Tasks
  loadTasks();
  renderTasks();

  // Links
  loadLinks();
  renderLinks();
});
