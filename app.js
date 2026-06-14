// ═══════════════════════════════════════════════════════
// AUDIO SYSTEM (HTML5 Audio compatível com file:// local)
// ═══════════════════════════════════════════════════════
const audioFiles = {
  checkbox:   'audio/Checkbox.mp3',
  botaoBase:  'audio/BotaoBase.mp3',
  timerFim:   'audio/TimerFim.mp3',
  tecla1:     'audio/Tecla1.mp3',
  tecla2:     'audio/Tecla2.mp3',
  tecla3:     'audio/Tecla3.mp3',
  tecla4:     'audio/Tecla4.mp3',
  tecla5:     'audio/Tecla5.mp3',
  ambiencia:  'audio/Ambiencia.mp3',
  somAmb1:    'audio/SomAmb1.mp3',
  somAmb2:    'audio/SomAmb2.mp3',
  somAmb3:    'audio/SomAmb3.mp3',
  roleta:     'audio/Roleta.mp3',
  countdown:  'audio/Countdown10s.mp3'
};

let vol = { geral: 0.8, fx: 0.8, timer: 0.8, amb: 0.4 };

let ambienciaAudio = null;
let ambScheduled = false;
let ambTimeout1 = null, ambTimeout2 = null, ambTimeout3 = null;

// Runtime flags (transient, not persisted)
let awaitingReward = false;
let rouletteOpenedFromComplete = false;
let countdownPlayed = false;
let lastTeclaKey = null;

function fxVol()    { return vol.geral * vol.fx; }
function timerVol() { return vol.geral * vol.timer; }
function ambVol()   { return vol.geral * vol.amb; }

function playSfx(key) {
  try {
    const snd = new Audio(audioFiles[key]);
    snd.volume = fxVol();
    snd.play().catch(() => {});
  } catch(e){}
}

const teclaKeys = ['tecla1','tecla2','tecla3','tecla4','tecla5'];
function playTecla() {
  if (!teclaKeys.length) return;
  // pick random key different from last
  let idx = Math.floor(Math.random() * teclaKeys.length);
  if (teclaKeys.length > 1) {
    let attempts = 0;
    while (teclaKeys[idx] === lastTeclaKey && attempts < 8) {
      idx = Math.floor(Math.random() * teclaKeys.length);
      attempts++;
    }
  }
  const key = teclaKeys[idx];
  lastTeclaKey = key;
  try {
    const snd = new Audio(audioFiles[key]);
    snd.volume = fxVol();
    // small pitch variance
    try { snd.playbackRate = 0.95 + Math.random() * 0.12; } catch(e) {}
    snd.play().catch(() => {});
  } catch(e){}
}

function playTimerFim() {
  try {
    const snd = new Audio(audioFiles.timerFim);
    snd.volume = timerVol();
    snd.play().catch(() => {});
  } catch(e){}
}

function playCountdown() {
  try {
    const snd = new Audio(audioFiles.countdown);
    snd.volume = timerVol();
    snd.play().catch(() => {});
  } catch(e){}
}

function startAmbiencia() {
  if (ambienciaAudio) return;
  try {
    ambienciaAudio = new Audio(audioFiles.ambiencia);
    ambienciaAudio.loop = true;
    ambienciaAudio.volume = ambVol();
    ambienciaAudio.play().catch(() => {});
  } catch(e){}
}

function stopAmbiencia() {
  if (ambienciaAudio) { try { ambienciaAudio.pause(); } catch(e){} ambienciaAudio = null; }
}

function updateAmbienciaVol() {
  if (ambienciaAudio) ambienciaAudio.volume = ambVol();
}

function scheduleAmbSounds() {
  if (ambScheduled) return;
  ambScheduled = true;
  scheduleOne('somAmb1', t => { ambTimeout1 = t; });
  scheduleOne('somAmb2', t => { ambTimeout2 = t; });
  scheduleOne('somAmb3', t => { ambTimeout3 = t; });
}

function scheduleOne(key, setter) {
  const delay = 15000 + Math.random() * 45000;
  const t = setTimeout(() => {
    try {
      const snd = new Audio(audioFiles[key]);
      snd.volume = ambVol();
      snd.play().catch(() => {});
    } catch(e){}
    scheduleOne(key, setter);
  }, delay);
  setter(t);
}

function stopAmbSounds() {
  clearTimeout(ambTimeout1); clearTimeout(ambTimeout2); clearTimeout(ambTimeout3);
  ambTimeout1 = ambTimeout2 = ambTimeout3 = null;
  ambScheduled = false;
}

function onVolChange() {
  vol.geral = document.getElementById('vol-geral').value / 100;
  vol.fx    = document.getElementById('vol-fx').value    / 100;
  vol.timer = document.getElementById('vol-timer').value / 100;
  vol.amb   = document.getElementById('vol-amb').value   / 100;
  document.getElementById('vol-geral-val').textContent = Math.round(vol.geral * 100);
  document.getElementById('vol-fx-val').textContent    = Math.round(vol.fx    * 100);
  document.getElementById('vol-timer-val').textContent = Math.round(vol.timer * 100);
  document.getElementById('vol-amb-val').textContent   = Math.round(vol.amb   * 100);
  updateAmbienciaVol();
  saveVolState();
}

function saveVolState() {
  try { localStorage.setItem('tarefa_vol', JSON.stringify({ geral: Math.round(vol.geral*100), fx: Math.round(vol.fx*100), timer: Math.round(vol.timer*100), amb: Math.round(vol.amb*100) })); } catch(e){}
}
function loadVolState() {
  try {
    const v = JSON.parse(localStorage.getItem('tarefa_vol'));
    if (!v) return;
    vol.geral = (v.geral ?? 80) / 100;
    vol.fx    = (v.fx    ?? 80) / 100;
    vol.timer = (v.timer ?? 80) / 100;
    vol.amb   = (v.amb   ?? 40) / 100;
    document.getElementById('vol-geral').value = Math.round(vol.geral*100);
    document.getElementById('vol-fx').value    = Math.round(vol.fx*100);
    document.getElementById('vol-timer').value = Math.round(vol.timer*100);
    document.getElementById('vol-amb').value   = Math.round(vol.amb*100);
    document.getElementById('vol-geral-val').textContent = Math.round(vol.geral*100);
    document.getElementById('vol-fx-val').textContent    = Math.round(vol.fx*100);
    document.getElementById('vol-timer-val').textContent = Math.round(vol.timer*100);
    document.getElementById('vol-amb-val').textContent   = Math.round(vol.amb*100);
  } catch(e){}
}

function initAudioOnGesture() {
  startAmbiencia();
  scheduleAmbSounds();
  document.removeEventListener('pointerdown', initAudioOnGesture);
}
document.addEventListener('pointerdown', initAudioOnGesture);

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key.length === 1 || e.key === 'Backspace') {
      playTecla();
    }
  }
});

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
const DEFALT_GOOD_SMALL = [
  "Assista algo que te agrade (sem ser no formato short).",
  "Dê uma caminhada.",
  "Olhe pela janela, aprecie a vista.",
  "Pratique um Hobby.",
  "Coma uma Fruta ou algum Petisco.",
  "Se estique, alongamentos!"
];
const DEFALT_GOOD_LARGE = [
  "Tire um cochilo, descanse a mente.",
  "Toque um Instrumento, Leia um pouco ou Jogue algo.",
  "Coma algo gostoso!",
  "Assistir uma série ou Anime!",
  "Assista um Vídeo Longo.",
  "Tome um Banho gostoso."
];

// Sofrimentos / recompensas ruins (pequenas e grandes)
const DEFALT_BAD_SMALL = [
  "Apague 10 arquivos inúteis do computador.",
  "Arrumar uma pequena bagunça.",
  "Fazer 15 agachamentos.",
  "Anote uma tarefa que você está procrastinando.",
  "Responda um e-mail ou mensagem pendente.",
  "Fique de pé pelo tempo da pausa."
];
const DEFALT_BAD_LARGE = [
  "Lavar a louça toda.",
  "Limpar uma área da casa.",
  "Fazer uma tarefa administrativa chata.",
  "Separe roupas ou objetos para doar ou descartar.",
  "Pagar uma conta ou revisar finanças.",
  "Fazer 15 minutos de exercício"
];

let state = {
  todos: [], rewardMode: 'boas', autoAdvance: true,
  pomodoroRunning: false, pomodoroPhase: 'foco',
  pomodoroSecondsLeft: 25 * 60, pomodoroSessions: 0,
  customSmall: Array(6).fill(''), customLarge: Array(6).fill(''),
  compactUI: true,
  config: { foco: 25, curta: 5, longa: 15 },
  coins: 0,
  storedRoulettes: []
};
let pomodoroInterval = null;
let pendingRewardSize = 'pequeno';

function generateId() {
  return 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadState() {
  try {
    const p = JSON.parse(localStorage.getItem('tarefa_state3') || 'null');
    if (p) { 
      state = { ...state, ...p };
      state.pomodoroRunning = false; 
      state.pomodoroSecondsLeft = state.config.foco * 60; 
    }
    if (!state.storedRoulettes) state.storedRoulettes = [];
    ensureTreeStructure(state.todos);
  } catch(e) {}
}

function ensureTreeStructure(arr) {
  if (!Array.isArray(arr)) return;
  arr.forEach(todo => {
    if (!todo.id) todo.id = generateId();
    if (!todo.children) todo.children = [];
    if (todo.expanded === undefined) todo.expanded = true;
    ensureTreeStructure(todo.children);
  });
}

function saveState() {
  try { localStorage.setItem('tarefa_state3', JSON.stringify(state)); } catch(e) {}
}

// --- Moedas (coins) ---
function updateCoinDisplay() {
  const el = document.getElementById('coin-count');
  if (el) el.textContent = (state.coins || 0);
}

function awardCoins(n, reason) {
  if (!n || n === 0) return;
  state.coins = (state.coins || 0) + Math.floor(n);
  saveState();
  updateCoinDisplay();
  try { playSfx('botaoBase'); } catch(e){}
  // future: visual feedback / animation
}

// autosize helper for textareas: keep 1-line height unless content wraps
function autoSizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  const cs = window.getComputedStyle(el);
  const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.2) || 18;
  const scroll = el.scrollHeight;
  const padding = parseFloat(cs.paddingTop || 0) + parseFloat(cs.paddingBottom || 0);
  const single = Math.ceil(lineHeight + padding);
  if (scroll > single + 2) {
    const max = Math.ceil(lineHeight * 6 + padding);
    el.style.height = Math.min(scroll, max) + 'px';
  } else {
    el.style.height = single + 'px';
  }
}

// ═══════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════
function switchTab(name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  playSfx('botaoBase');
}

// ═══════════════════════════════════════════════════════
// RECURSIVE ARCHITECTURE FOR SUBTASKS
// ═══════════════════════════════════════════════════════
function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  function buildTreeDOM(todo) {
    const node = document.createElement('div');
    node.className = 'todo-node' + (todo.done ? ' done' : '');
    node.dataset.id = todo.id;

    const hasChildren = todo.children && todo.children.length > 0;
    const isExpanded = todo.expanded !== false;

    const toggleIcon = hasChildren ? (isExpanded ? '▼' : '▶') : '•';
    const checkIcon = todo.done ? '✓' : '';
    const checkedClass = todo.done ? ' checked' : '';
    const grandeClass = todo.diff === 'grande' ? ' grande' : '';
    const diffText = todo.diff === 'grande' ? 'GRANDE' : 'PEQUENO';

    node.innerHTML = `
      <div class="todo-item-main">
        <button class="todo-toggle" style="${hasChildren ? '' : 'cursor:default; opacity:0.4'}">${toggleIcon}</button>
        <button class="todo-check${checkedClass}">${checkIcon}</button>
          <textarea rows="1" col="1" class="todo-name" placeholder="Nome do afazer...">${escHtml(todo.name)}</textarea>
        <button class="badge-btn badge-diff${grandeClass}">${diffText}</button>
        <button class="badge-btn btn-add-sub">+</button>
        <button class="todo-del" title="Excluir">✕</button>
      </div>
      <div class="todo-children" style="display: ${isExpanded && hasChildren ? 'flex' : 'none'};"></div>
    `;

    const tgl = node.querySelector('.todo-toggle');
    const chk = node.querySelector('.todo-check');
    const inp = node.querySelector('.todo-name');
    const diff = node.querySelector('.badge-diff');
    const addSub = node.querySelector('.btn-add-sub');
    const del = node.querySelector('.todo-del');
    const childrenContainer = node.querySelector('.todo-children');

    // autosize helper for textareas: keep 1-line height unless content wraps
    function autoSizeTextarea(el) {
      if (!el) return;
      el.style.height = 'auto';
      const cs = window.getComputedStyle(el);
      const lineHeight = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.2) || 18;
      const scroll = el.scrollHeight;
      const padding = parseFloat(cs.paddingTop || 0) + parseFloat(cs.paddingBottom || 0);
      const single = Math.ceil(lineHeight + padding);
      if (scroll > single + 2) {
        // content wrapped to multiple lines -> expand to fit (limit to 6 lines)
        const max = Math.ceil(lineHeight * 6 + padding);
        el.style.height = Math.min(scroll, max) + 'px';
      } else {
        // keep single-line height
        el.style.height = single + 'px';
      }
    }

    tgl.onclick = () => {
      if (hasChildren) {
        todo.expanded = !isExpanded;
        playSfx('botaoBase');
        saveState();
        renderTodos();
      }
    };

    chk.onclick = () => {
      const wasDone = !!todo.done;
      todo.done = !todo.done;
      playSfx('checkbox');
      if (!wasDone && todo.done) {
        const amt = todo.diff === 'grande' ? 5 : 1;
        awardCoins(amt, 'task_done');
        openRouletteWithSize(todo.diff);
      }
      saveState();
      renderTodos();
    };

    inp.oninput = () => {
      todo.name = inp.value;
      autoSizeTextarea(inp);
      saveState();
    };
    // ensure left alignment and initialize autosize immediately (avoid flicker)
    try { inp.style.textAlign = 'left'; autoSizeTextarea(inp); } catch(e) {}
    // also defer one tick to catch layout changes
    setTimeout(() => autoSizeTextarea(inp), 0);

    diff.onclick = () => {
      playSfx('botaoBase');
      todo.diff = todo.diff === 'grande' ? 'pequeno' : 'grande';
      saveState();
      renderTodos();
    };

    addSub.onclick = () => {
      playSfx('botaoBase');
      if (!todo.children) todo.children = [];
      todo.expanded = true;
      const newSub = { id: generateId(), name: '', done: false, diff: 'pequeno', children: [], expanded: true };
      todo.children.push(newSub);
      saveState();
      renderTodos();
      setTimeout(() => {
        const subInp = childrenContainer.querySelector(`[data-id="${newSub.id}"] .todo-name`);
        if (subInp) subInp.focus();
      }, 50);
    };

    del.onclick = () => {
      playSfx('botaoBase');
      deleteTodoById(todo.id);
      saveState();
      renderTodos();
    };

    if (hasChildren && isExpanded) {
      todo.children.forEach(child => {
        childrenContainer.appendChild(buildTreeDOM(child));
      });
    }

    return node;
  }

  state.todos.forEach(todo => {
    list.appendChild(buildTreeDOM(todo));
  });

  list.appendChild(createNewRow());
}

function createNewRow() {
  const div = document.createElement('div');
  div.className = 'todo-item-main todo-item-new';
  div.style.marginTop = '4px';
  div.innerHTML = `
    <button class="todo-toggle" style="cursor:default;opacity:0.3">•</button>
    <button class="todo-check" style="cursor:default;opacity:0.3"></button>
    <textarea rows="1" class="todo-name" placeholder="Novo afazer..."></textarea>
    <button class="badge-btn badge-diff" style="opacity:0.2;cursor:default">PEQUENO</button>
    <button class="badge-btn btn-add-sub" style="opacity:0.2;cursor:default">+ SUB</button>
    <button class="todo-del" style="opacity:0;pointer-events:none">✕</button>`;
  
  // Volta a disparar assim que qualquer coisa for digitada (ao vivo)
  const newInp = div.querySelector('.todo-name');
  newInp.oninput = function() {
    autoSizeTextarea(this);
    if (!this._created && this.value.trim()) {
      this._created = true;
      addTodoFromInput(this);
    }
  };
  try { newInp.style.textAlign = 'left'; autoSizeTextarea(newInp); } catch(e) {}
  setTimeout(() => autoSizeTextarea(newInp), 0);
  
  return div;
}

function addTodoFromInput(input) {
  // Cancela se for só espaço em branco
  if (!input.value.trim()) return;
  
  // Salva exatamente o que foi digitado sem remover os espaços finais para não bugar o texto
  state.todos.push({ 
    id: generateId(), 
    name: input.value, 
    done: false, 
    diff: 'pequeno', 
    children: [], 
    expanded: true 
  });
  
  saveState();
  renderTodos();
  
  // Procura o item que acabou de ser criado e foca nele
  const rows = document.querySelectorAll('#todo-list > .todo-node');
  if (rows.length) {
    const lastInp = rows[rows.length - 1].querySelector('.todo-name');
    if (lastInp) {
      lastInp.focus();
      // O SEGREDO: Coloca o cursor piscando obrigatoriamente no final do texto!
      const len = lastInp.value.length;
      lastInp.setSelectionRange(len, len);
    }
  }
}

function deleteTodoById(id) {
  function recurse(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) { arr.splice(i, 1); return true; }
      if (arr[i].children && arr[i].children.length > 0) {
        if (recurse(arr[i].children)) return true;
      }
    }
    return false;
  }
  recurse(state.todos);
}

// ═══════════════════════════════════════════════════════
// POMODORO
// ═══════════════════════════════════════════════════════
function getPhaseDuration() {
  if (state.pomodoroPhase === 'foco') return state.config.foco * 60;
  if (state.pomodoroPhase === 'curta') return state.config.curta * 60;
  return state.config.longa * 60;
}

function togglePomodoro() {
  playSfx('botaoBase');
  if (state.pomodoroRunning) {
    clearInterval(pomodoroInterval); state.pomodoroRunning = false;
    document.getElementById('btn-start').textContent = '▶ Retomar';
  } else {
    state.pomodoroRunning = true;
    document.getElementById('btn-start').textContent = '⏸ Pausar';
    countdownPlayed = false;
    pomodoroInterval = setInterval(tickPomodoro, 1000);
  }
}

function tickPomodoro() {
  state.pomodoroSecondsLeft--;
  if (state.pomodoroSecondsLeft <= 0) {
    clearInterval(pomodoroInterval); state.pomodoroRunning = false;
    playTimerFim();
    handlePhaseEnd(); return;
  }
  // play countdown at 10 seconds once
  if (state.pomodoroSecondsLeft === 10 && !countdownPlayed) { playCountdown(); countdownPlayed = true; }
  updatePomodoroDisplay();
}

function handlePhaseEnd() {
  if (state.pomodoroPhase === 'foco') {
    state.pomodoroSessions++;
    const isLong = state.pomodoroSessions % 4 === 0;
    pendingRewardSize = isLong ? 'grande' : 'pequeno';
    state.pomodoroPhase = isLong ? 'longa' : 'curta';
    // premiar moedas: tempo da tarefa + metade (arredondado pra cima) do tempo da recompensa
    const taskMinutes = state.config.foco || 0;
    const rewardMinutes = isLong ? (state.config.longa || 0) : (state.config.curta || 0);
    const award = taskMinutes + Math.ceil((rewardMinutes) / 2);
    awardCoins(award, 'pomodoro_end');
    showComplete(state.pomodoroPhase);
  } else {
    state.pomodoroPhase = 'foco';
  }
  state.pomodoroSecondsLeft = getPhaseDuration();
  countdownPlayed = false;
  updatePomodoroDisplay();
  document.getElementById('btn-start').textContent = '▶ Iniciar';
  saveState();
}

function skipPomodoro() {
  playSfx('botaoBase');
  clearInterval(pomodoroInterval);
  state.pomodoroRunning = false;
  handlePhaseEnd();
 playTimerFim();
}

function resetPomodoro() {
  playSfx('botaoBase');
  clearInterval(pomodoroInterval); state.pomodoroRunning = false;
  state.pomodoroPhase = 'foco'; state.pomodoroSecondsLeft = state.config.foco * 60;
  state.pomodoroSessions = 0; // Retorna para a primeira sessão
  document.getElementById('btn-start').textContent = '▶ Iniciar';
  countdownPlayed = false;
  updatePomodoroDisplay(); saveState();
}

function updatePomodoroDisplay() {
  const m = Math.floor(state.pomodoroSecondsLeft / 60);
  const s = state.pomodoroSecondsLeft % 60;
  document.getElementById('pomo-display').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  const phases = { foco: 'FOCO', curta: 'PAUSA CURTA', longa: 'PAUSA LONGA' };
  document.getElementById('pomo-phase').textContent = phases[state.pomodoroPhase];
  
  // Exibição atualizada dinamicamente do número da sessão
  document.getElementById('pomo-session').textContent = `SESSÃO ${state.pomodoroSessions + 1}`;
  
  const total = getPhaseDuration();
  const circ = 2 * Math.PI * 109;
  document.getElementById('pomo-ring').style.strokeDashoffset = circ * (state.pomodoroSecondsLeft / total);
  const phaseColors = { foco: '#b8962e', curta: '#2a7a4a', longa: '#1a5a8a' };
  document.getElementById('pomo-ring').style.stroke = phaseColors[state.pomodoroPhase];
}

// ═══════════════════════════════════════════════════════
// REWARD POOL
// ═══════════════════════════════════════════════════════
function setRewardMode(mode, btn) {
  state.rewardMode = mode;
  document.querySelectorAll('.mode-select-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  playSfx('botaoBase');
  saveState();
}
function syncModeButtons() {
  document.querySelectorAll('.mode-select-btn').forEach(btn => {
    const m = btn.dataset.mode;
    btn.classList.toggle('active', m === state.rewardMode);
  });
}
function getRewardPool(size) {
  let pool = [];
  const mode = state.rewardMode;
  const useAll = mode === 'todas';
  const useCustom = mode === 'custom' || useAll;
  const useGood = mode === 'boas' || useAll;
  const useBad = mode === 'ruins' || useAll;

  if (size === 'pequeno') {
    if (useGood) pool = pool.concat(DEFALT_GOOD_SMALL);
    if (useBad)  pool = pool.concat(DEFALT_BAD_SMALL);
    if (useCustom) pool = pool.concat(state.customSmall.filter(r => r.trim()));
  } else {
    if (useGood) pool = pool.concat(DEFALT_GOOD_LARGE);
    if (useBad)  pool = pool.concat(DEFALT_BAD_LARGE);
    if (useCustom) pool = pool.concat(state.customLarge.filter(r => r.trim()));
  }

  if (!pool.length) pool = size === 'pequeno' ? DEFALT_GOOD_SMALL.slice() : DEFALT_GOOD_LARGE.slice();
  return [...new Set(pool)];
}

// ═══════════════════════════════════════════════════════
// ROULETTE
// ═══════════════════════════════════════════════════════
let rouletteRewards = [];
let wheelAngle = 0;
let wheelSpinning = false;
let lastSpinIndex = null;
let currentOpenRoulette = null; // { rewards, size, fromStoredIndex }

function openRouletteWithSize(size) {
  rouletteRewards = getRewardPool(size);
  const titles = { pequeno: '🎲 Recompensa Pequena', grande: '👑 Recompensa Grande' };
  document.getElementById('roulette-title').textContent = titles[size] || '🎲 Girando o Destino...';
  wheelAngle = 0;
  document.getElementById('roulette-result').textContent = 'Gire a roleta...';
  document.getElementById('btn-spin').disabled = false;
  document.getElementById('btn-spin').textContent = '▶ Girar';
  // mark current open roulette (not from stored)
  currentOpenRoulette = { rewards: rouletteRewards.slice(), size: size, fromStoredIndex: null };
  // show 'Guardar' option before spinning
  try { const closeBtn = document.getElementById('btn-close'); if (closeBtn) { closeBtn.textContent = '💾 Guardar'; closeBtn.dataset.store = '1'; } } catch(e){}
  document.getElementById('roulette-overlay').classList.add('open');
  drawWheel(wheelAngle);
}

function closeRoulette() {
  document.getElementById('roulette-overlay').classList.remove('open');
  playSfx('botaoBase');
  if (rouletteOpenedFromComplete) {
    rouletteOpenedFromComplete = false;
    if (state.autoAdvance) togglePomodoro();
  }
}

function closeOrStoreRoulette() {
  const closeBtn = document.getElementById('btn-close');
  if (closeBtn && closeBtn.dataset && closeBtn.dataset.store === '1') {
    // store the currently open roulette (only if not from stored)
    storeCurrentRoulette();
  } else {
    closeRoulette();
  }
}

function storeCurrentRoulette() {
  // only store if we have a current open roulette pool
  if (!currentOpenRoulette || !Array.isArray(currentOpenRoulette.rewards) || currentOpenRoulette.rewards.length === 0) {
    closeRoulette();
    return;
  }
  try {
    state.storedRoulettes = state.storedRoulettes || [];
    state.storedRoulettes.push({ rewards: currentOpenRoulette.rewards.slice(), size: currentOpenRoulette.size, storedAt: Date.now() });
    saveState();
    updateRoletaButton();
    // reset close button
    const closeBtn = document.getElementById('btn-close'); if (closeBtn) { closeBtn.textContent = '✕ Fechar'; delete closeBtn.dataset.store; }
    // close overlay and clear currentOpenRoulette
    currentOpenRoulette = null;
    closeRoulette();
  } catch(e) { closeRoulette(); }
}

function updateRoletaButton() {
  const btn = document.getElementById('btn-roleta-storage');
  if (!btn) return;
  const n = (state.storedRoulettes && state.storedRoulettes.length) || 0;
  btn.textContent = `🎡 Roleta (${n})`;
}

function onStoredRoletaClick() {
  const btn = document.getElementById('btn-roleta-storage');
  const n = (state.storedRoulettes && state.storedRoulettes.length) || 0;
  if (!n) { playSfx('botaoBase'); return; }
  // peek last stored (do not remove yet) and open overlay so user can choose to spin or cancel
  const idx = state.storedRoulettes.length - 1;
  const obj = state.storedRoulettes[idx];
  try {
    rouletteRewards = obj.rewards.slice();
    wheelAngle = 0;
    lastSpinIndex = null;
    // mark current open roulette as from stored (so spin will consume it)
    currentOpenRoulette = { rewards: rouletteRewards.slice(), size: obj.size, fromStoredIndex: idx };
    document.getElementById('roulette-title').textContent = '🎡 Roleta Guardada';
    document.getElementById('roulette-result').textContent = 'Gire a roleta...';
    document.getElementById('btn-spin').disabled = false;
    document.getElementById('btn-spin').textContent = '▶ Girar';
    // stored roleta cannot be 'guardada' again — close button acts as normal
    const closeBtn = document.getElementById('btn-close'); if (closeBtn) { closeBtn.textContent = '✕ Fechar'; delete closeBtn.dataset.store; }
    document.getElementById('roulette-overlay').classList.add('open');
    drawWheel(wheelAngle);
  } catch(e) { }
}

function drawWheel(angle) {
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const cx = 140, cy = 140, r = 134;
  const n = rouletteRewards.length;
  if (!n) return;
  const slice = (2 * Math.PI) / n;
  const bgColors   = ['#1a1610','#252018','#1e1a12','#2a2418','#161210','#201c14'];
  const edgeColors = ['#b8962e','#8b3a1a','#4a7a2e','#1a5a8a','#7a1a1a','#5a4a2e'];
  ctx.clearRect(0, 0, 280, 280);
  for (let i = 0; i < n; i++) {
    const start = angle + i * slice, end = angle + (i + 1) * slice;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
    ctx.fillStyle = bgColors[i % bgColors.length]; ctx.fill();
    ctx.strokeStyle = edgeColors[i % edgeColors.length]; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = '#c8b99a'; ctx.font = '10px "Courier Prime",monospace';
    const label = rouletteRewards[i].length > 22 ? rouletteRewards[i].substring(0,20)+'…' : rouletteRewards[i];
    ctx.fillText(label, r - 8, 4); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 2*Math.PI); ctx.fillStyle = '#0d0b08'; ctx.fill();
  ctx.strokeStyle = '#b8962e'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2*Math.PI); strokeStyle = '#b8962e'; ctx.lineWidth = 2; ctx.stroke();
}

function spinWheel() {
  if (wheelSpinning || !rouletteRewards.length) return;
  playSfx('roleta');
  wheelSpinning = true;
  document.getElementById('btn-spin').disabled = true;
  document.getElementById('roulette-result').textContent = '...';

  // If this spin is for a stored roulette, consume it now (only once)
  if (currentOpenRoulette && typeof currentOpenRoulette.fromStoredIndex === 'number') {
    const idx = currentOpenRoulette.fromStoredIndex;
    if (state.storedRoulettes && state.storedRoulettes[idx]) {
      state.storedRoulettes.splice(idx, 1);
      saveState();
      updateRoletaButton();
      // avoid double-consuming
      currentOpenRoulette.fromStoredIndex = null;
    }
  }
  // once spin starts, cannot store this roulette anymore
  try { const closeBtn = document.getElementById('btn-close'); if (closeBtn) { delete closeBtn.dataset.store; closeBtn.textContent = '✕ Fechar'; } } catch(e){}

  const n = rouletteRewards.length;
  const slice = (2 * Math.PI) / n;
  const targetIndex = Math.floor(Math.random() * n);

  const targetBase = -Math.PI / 2 - targetIndex * slice - slice / 2;
  const extraSpins = 6 + Math.floor(Math.random() * 4);
  const finalAngle = targetBase + extraSpins * 2 * Math.PI;

  const duration = 5000; // Alterado de 4000 para exatamente 5000ms (5 segundos)
  const startTime = performance.now();
  const startAngle = wheelAngle;
  const delta = finalAngle - startAngle;

  function animate(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    wheelAngle = startAngle + delta * eased;
    drawWheel(wheelAngle);
    if (t < 1) { requestAnimationFrame(animate); return; }
    wheelAngle = finalAngle;
    drawWheel(wheelAngle);
    wheelAngle = ((finalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    wheelSpinning = false;
    document.getElementById('btn-spin').disabled = false;
    document.getElementById('btn-spin').textContent = '↺ Girar de Novo';
    document.getElementById('roulette-result').textContent = '🎲 ' + rouletteRewards[targetIndex];
    lastSpinIndex = targetIndex;
    // after spinning, do not offer 'Guardar' (per design). ensure close button is normal
    try {
      const closeBtn = document.getElementById('btn-close');
      if (closeBtn) { closeBtn.textContent = '✕ Fechar'; delete closeBtn.dataset.store; }
    } catch(e){}
    // clear temporary open roulette (can't be stored now)
    currentOpenRoulette = null;
  }
  requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════
// COMPLETE
// ═══════════════════════════════════════════════════════
function showComplete(phase) {
  const msgs = { curta: 'Pausa curta merecida!', longa: 'PAUSA LONGA — você arrasou!' };
  document.getElementById('complete-sub').textContent = msgs[phase] || 'Hora da recompensa';
  awaitingReward = true;
  rouletteOpenedFromComplete = false;
  document.getElementById('complete-overlay').classList.add('open');
}
function closeComplete(startNext = true) {
  document.getElementById('complete-overlay').classList.remove('open');
  playSfx('botaoBase');
  awaitingReward = false;
  if (startNext && state.autoAdvance) {
    togglePomodoro();
  }
}
function onCompleteRoulette() { closeComplete(false); rouletteOpenedFromComplete = true; openRouletteWithSize(pendingRewardSize); }

// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
function renderConfig() {
  document.getElementById('cfg-foco').value  = state.config.foco;
  document.getElementById('cfg-curta').value = state.config.curta;
  document.getElementById('cfg-longa').value = state.config.longa;
  document.getElementById('default-small-list').innerHTML = DEFALT_GOOD_SMALL.map(r =>
    `<div class="default-reward-item"><span class="default-reward-dot"></span>${r}</div>`).join('');
  document.getElementById('default-large-list').innerHTML = DEFALT_GOOD_LARGE.map(r =>
    `<div class="default-reward-item"><span class="default-reward-dot"></span>${r}</div>`).join('');
  const badSmall = document.getElementById('default-bad-small-list');
  if (badSmall) badSmall.innerHTML = DEFALT_BAD_SMALL.map(r =>
    `<div class="default-reward-item"><span class="default-reward-dot"></span>${r}</div>`).join('');
  const badLarge = document.getElementById('default-bad-large-list');
  if (badLarge) badLarge.innerHTML = DEFALT_BAD_LARGE.map(r =>
    `<div class="default-reward-item"><span class="default-reward-dot"></span>${r}</div>`).join('');
  ['small','large'].forEach(type => {
    const el = document.getElementById('custom-' + type + '-list');
    el.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div'); d.className = 'reward-item';
      d.innerHTML = `<span class="reward-tag">${i+1}</span>
        <input type="text" placeholder="Recompensa custom..."
          value="${escHtml((type==='small'?state.customSmall:state.customLarge)[i]||'')}"
          oninput="updateCustom('${type}',${i},this.value)">`;
      el.appendChild(d);
    }
  });
  syncModeButtons();
  // Pomodoro auto-advance switch (if present)
  const autoEl = document.getElementById('auto-advance');
  if (autoEl) {
    if (autoEl.tagName === 'INPUT') {
      autoEl.checked = !!state.autoAdvance;
      autoEl.onchange = function() { state.autoAdvance = !!this.checked; playSfx('checkbox'); saveState(); };
    } else {
      // styled button toggle (uses .todo-check styles)
      autoEl.classList.toggle('checked', !!state.autoAdvance);
      autoEl.textContent = state.autoAdvance ? '✓' : '';
      autoEl.setAttribute('aria-pressed', state.autoAdvance ? 'true' : 'false');
      autoEl.onclick = function() {
        state.autoAdvance = !state.autoAdvance;
        autoEl.classList.toggle('checked', state.autoAdvance);
        autoEl.textContent = state.autoAdvance ? '✓' : '';
        autoEl.setAttribute('aria-pressed', state.autoAdvance ? 'true' : 'false');
        playSfx('checkbox');
        saveState();
      };
    }
  }
  // Compact UI toggle
  const compactEl = document.getElementById('cfg-compact-ui');
  if (compactEl) {
    compactEl.checked = !!state.compactUI;
    document.body.classList.toggle('compact-ui', !!state.compactUI);
    compactEl.onchange = function() { state.compactUI = !!this.checked; document.body.classList.toggle('compact-ui', !!state.compactUI); saveState(); };
  }
  loadVolState();
}

function updateCustom(type, i, val) {
  if (type === 'small') state.customSmall[i] = val; else state.customLarge[i] = val;
  saveState();
}
function saveConfig() {
  state.config.foco  = parseInt(document.getElementById('cfg-foco').value)  || 25;
  state.config.curta = parseInt(document.getElementById('cfg-curta').value) || 5;
  state.config.longa = parseInt(document.getElementById('cfg-longa').value) || 15;
  if (!state.pomodoroRunning) { state.pomodoroSecondsLeft = state.config.foco * 60; updatePomodoroDisplay(); }
  saveState();
}
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
loadState();
renderTodos();
renderConfig();
updatePomodoroDisplay();
updateCoinDisplay();
updateRoletaButton();
// wire roleta stored button
try { const rb = document.getElementById('btn-roleta-storage'); if (rb) rb.onclick = onStoredRoletaClick; } catch(e) {}

// Expose state and common APIs to other modules (shop.js expects these)
try {
  window.state = state;
  window.saveState = saveState;
  window.updateCoinDisplay = updateCoinDisplay;
  window.awardCoins = awardCoins;
} catch(e) {}

// Register service worker for PWA (GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(() => {
      // console.log('Service Worker registered');
    }).catch(() => {});
  });
}