// ═══════════════════════════════════════════════════════
// GERENCIAMENTO DE DADOS E SINCRONIZAÇÃO EM NUVEM
// ═══════════════════════════════════════════════════════

// Credenciais do Supabase
const SUPABASE_URL = "https://bgoyvlqzazzcdkoyuhzx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnb3l2bHF6YXp6Y2Rrb3l1aHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MzgzMzAsImV4cCI6MjA5NzQxNDMzMH0.7xzRWU89R89D-MPhaVFAP9kiXtpCrjufLiLxrqlaEdY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════════════
// HELPERS DO SISTEMA DE TOAST (NOTIFICAÇÕES)
// ═══════════════════════════════════════════════════════
function ensureToastContainer() {
  if (document.getElementById('toast-container')) return;
  const t = document.createElement('div'); 
  t.id = 'toast-container'; 
  document.body.appendChild(t);
}

function showToast(msg, type = 'default', timeout = 2800) {
  ensureToastContainer();
  const c = document.getElementById('toast-container');
  const el = document.createElement('div'); 
  el.className = 'toast ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : ''); 
  el.textContent = msg;
  c.appendChild(el);
  
  setTimeout(() => { 
    el.style.opacity = '0'; 
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 300); 
  }, timeout);
}

// ═══════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES DE RENDERIZAÇÃO SEGURA
// ═══════════════════════════════════════════════════════
function safeUpdateEditor(notesText) {
  const richEditor = document.getElementById("rich-editor");
  const mdTextarea = document.getElementById("md-textarea");

  // Se usar textarea de markdown e a função existir
  if (mdTextarea && typeof updateMarkdownPreview === "function") {
    mdTextarea.value = notesText;
    updateMarkdownPreview();
  } 
  // Caso contrário, injeta diretamente no editor WYSIWYG padrão
  else if (richEditor) {
    richEditor.innerHTML = notesText;
  }
}

// ═══════════════════════════════════════════════════════
// FUNÇÕES DE INTERAÇÃO E MODAL
// ═══════════════════════════════════════════════════════

function openImportExport() {
  try { if (typeof playSfx === 'function') playSfx('botaoBase'); } catch (err) {}
  const overlay = document.getElementById('ie-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeImportExport() {
  try { if (typeof playSfx === 'function') playSfx('botaoBase'); } catch (err) {}
  const overlay = document.getElementById('ie-overlay');
  if (overlay) overlay.style.display = 'none';
}

function exportTasks() {
  try { if (typeof playSfx === 'function') playSfx('tecla1'); } catch(e){}

  const currentNotes = localStorage.getItem("tarefa_recompensa_notes") || "";
  const payload = { todos: state.todos, notes: currentNotes };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "tarefa_recompensa_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  
  showToast("Backup compactado baixado com sucesso!", "success");
}

function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (importedData && importedData.todos && Array.isArray(importedData.todos)) {
        state.todos = importedData.todos;
        const importedNotes = importedData.notes || "";
        localStorage.setItem("tarefa_recompensa_notes", importedNotes);
        
        // Atualiza o editor de forma segura
        safeUpdateEditor(importedNotes);
      } else if (Array.isArray(importedData)) {
        state.todos = importedData;
      } else {
        showToast("Formato de arquivo JSON inválido!", "error");
        return;
      }

      saveState();
      renderTodos();
      try { if (typeof playSfx === 'function') playSfx('checkbox'); } catch(e){}

      showToast("Dados importados com sucesso!", "success");
      closeImportExport();
    } catch (err) {
      showToast("Erro crítico ao ler arquivo de backup.", "error");
      console.error(err);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function shareTasks() {
  try { if (typeof playSfx === 'function') playSfx('tecla1'); } catch(e){}
  showToast("Use o sistema de sincronização por código logo abaixo!", "default");
}

function generateRandomFiveCharString() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ═══════════════════════════════════════════════════════
// REQUISIÇÕES AO BANCO DE DADOS (SUPABASE)
// ═══════════════════════════════════════════════════════

async function generateShareCode() {
  try { if (typeof playSfx === 'function') playSfx('tecla1'); } catch(e){}

  const currentNotes = localStorage.getItem("tarefa_recompensa_notes") || "";
  const payload = { todos: state.todos, notes: currentNotes };

  let uniqueCode = "";
  let success = false;
  let attempts = 0;

  while (!success && attempts < 5) {
    uniqueCode = generateRandomFiveCharString();
    
    const { error } = await supabaseClient
      .from('shared_lists')
      .insert([{ code: uniqueCode, data: payload }]);

    if (!error) { success = true; } else { attempts++; }
  }

  if (success) {
    const container = document.getElementById("generated-code-container");
    const display = document.getElementById("share-code-value");
    if (container && display) {
      display.textContent = uniqueCode;
      container.style.display = "block";
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(uniqueCode);
    }

    try { if (typeof playSfx === 'function') playSfx('checkbox'); } catch(e){}
    showToast(`Código ${uniqueCode} gerado e copiado!`, "success", 4000);
  } else {
    showToast("Erro na nuvem. Verifique sua conexão.", "error");
  }
}

async function importByCode() {
  const inputEl = document.getElementById("import-code-input");
  if (!inputEl) return;

  const rawCode = inputEl.value.trim().toUpperCase();

  if (rawCode.length !== 5) {
    showToast("O código deve ter 5 caracteres!", "error");
    return;
  }

  try { if (typeof playSfx === 'function') playSfx('tecla1'); } catch(e){}

  // Faz a chamada segura via RPC que configuramos no banco
  const { data: importedData, error } = await supabaseClient
    .rpc('get_shared_list', { search_code: rawCode });

  if (error || !importedData) {
    showToast("Código inválido ou não encontrado.", "error");
    return;
  }

  if (importedData && importedData.todos && Array.isArray(importedData.todos)) {
    state.todos = importedData.todos;
    const importedNotes = importedData.notes || "";
    localStorage.setItem("tarefa_recompensa_notes", importedNotes);
    
    // Atualiza o editor de forma segura
    safeUpdateEditor(importedNotes);
  } else if (Array.isArray(importedData)) {
    state.todos = importedData;
  } else {
    showToast("Formato de dados corrompido.", "error");
    return;
  }

  saveState();
  renderTodos();
  try { if (typeof playSfx === 'function') playSfx('checkbox'); } catch(e){}

  showToast("Sincronização concluída com sucesso!", "success");
  
  inputEl.value = "";
  const container = document.getElementById("generated-code-container");
  if (container) container.style.display = "none";
  closeImportExport();
}