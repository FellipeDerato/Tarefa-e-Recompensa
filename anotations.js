// ═══════════════════════════════════════════════════════
// EDITOR VISUAL WYSIWYG (ESTILO ANYTYPE / WORD)
// ═══════════════════════════════════════════════════════

// Inicialização e carregamento automático das notas
document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("rich-editor");
  if (editor) {
    let savedNotes = localStorage.getItem("tarefa_recompensa_notes") || "";
    
    // Suporte e conversão de backups legados
    if (savedNotes && !savedNotes.trim().startsWith("<") && (savedNotes.includes("#") || savedNotes.includes("**") || savedNotes.includes("- "))) {
      editor.innerHTML = parseLegacyMarkdown(savedNotes);
    } else {
      editor.innerHTML = savedNotes;
    }
    
    if (editor.innerHTML.trim() === "<br>" || editor.innerHTML.trim() === "") {
      editor.innerHTML = "";
    }

    // NOVA PARTE: Intercepta a tecla TAB no teclado
    editor.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault(); // Impede que o TAB pule para outro botão do site
        insertTab();
      }
    });
  }
});


// Salva o conteúdo formatado em tempo real no localStorage
function saveEditorContent() {
  const editor = document.getElementById("rich-editor");
  if (!editor) return;
  
  let content = editor.innerHTML;
  
  // Evita salvar tags de quebra vazias redundantes
  if (content === "<br>" || content.trim() === "") {
    content = "";
  }
  
  localStorage.setItem("tarefa_recompensa_notes", content);
}

// Executa os comandos de formatação nativa (Negrito, Itálico, Listas, etc.)
function formatDoc(command, value = null) {
  document.execCommand(command, false, value);
  saveEditorContent();
  
  // Devolve o foco para o editor continuar digitando normalmente
  const editor = document.getElementById("rich-editor");
  if (editor) editor.focus();
}

// Inserção interativa de hiperlinks
function insertLink() {
  const url = prompt("Insira a URL do link:", "https://");
  if (url && url !== "https://") {
    formatDoc("createLink", url);
  }
}

// Interceptador global para garantir compatibilidade com a função de importar do seu app.js
window.updateMarkdownPreview = function() {
  const editor = document.getElementById("rich-editor");
  if (editor) {
    const importedNotes = localStorage.getItem("tarefa_recompensa_notes") || "";
    if (importedNotes && !importedNotes.trim().startsWith("<") && (importedNotes.includes("#") || importedNotes.includes("**") || importedNotes.includes("- "))) {
      editor.innerHTML = parseLegacyMarkdown(importedNotes);
    } else {
      editor.innerHTML = importedNotes;
    }
    saveEditorContent();
  }
};

// Parser auxiliar para ler notas antigas de backups em Markdown
function parseLegacyMarkdown(markdown) {
  if (!markdown) return "";
  let html = markdown;
  html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<ol><li>$1</li></ol>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  html = html.replace(/^(?!<h|<ul|<ol|<li|<block|<pre)(.*$)/gim, '<p>$1</p>');
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

function insertTab() {
  // Insere 4 espaços inquebráveis para simular o recuo perfeitamente
  document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
  saveEditorContent();
}