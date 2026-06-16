// itens.js - Banco de Dados de Itens e Lógicas de Efeito

const ITENS_DB = {
  consumables: [
    {
      id: 'c_ficha',
      name: 'Ficha Falsificada',
      price: 20,
      img: 'media/c_ficha.png',
      desc: 'Permite burlar as regras e girar a roleta de recompensas imediatamente no painel, sem precisar terminar uma tarefa.'
    },
    {
      id: 'c_glicose',
      name: 'Injeção de Glicose',
      price: 10,
      img: 'media/placeholder-64.png',
      desc: 'Garante o dobro de moedas estritamente ao finalizar sua próxima tarefa marcada como "GRANDE".'
    },
    {
      id: 'c_triagem_sucata',
      name: 'Triagem de Sucata',
      price: 5,
      img: 'media/placeholder-64.png',
      desc: 'Organiza sua lista instantaneamente, jogando todas as tarefas GRANDES para o topo e as pequenas para baixo.'
    },
    {
      id: 'c_oleo_brilhante',
      name: 'Óleo Fluorescente',
      price: 8,
      img: 'media/placeholder-64.png',
      desc: 'Faz uma tarefa escolhida brilhar. Quando você completá-la, receberá um bônus direto de +3 moedas.'
    },
    {
      id: 'c_relogio_vapor',
      name: 'Cronômetro a Vapor',
      price: 12,
      img: 'media/placeholder-64.png',
      desc: 'Define um prazo de 15 minutos em uma tarefa. Se você terminá-la antes do tempo acabar, a recompensa de moedas dobra!'
    },
    {
      id: 'c_adrenalina',
      name: 'Injetor de Adrenalina',
      price: 15,
      img: 'media/placeholder-64.png',
      desc: 'Recurso de emergência: adiciona instantaneamente mais 5 minutos (+300s) ao seu timer de foco atual para evitar que você falhe.'
    },
    {
      id: 'c_gilete',
      name: 'Gilete Enferrujada',
      price: 6,
      img: 'media/placeholder-64.png',
      desc: 'Corte cirúrgico: reduz o timer de foco atual em 5 minutos para terminar o turno mais rápido, mas corta os ganhos de moeda da sessão pela metade.'
    },
    {
      id: 'c_cafe',
      name: 'Café Frio de Ontem',
      price: 14,
      img: 'media/placeholder-64.png',
      desc: 'Ativa um efeito que dobra as moedas do ciclo se você conseguir terminar a sessão de foco atual sem pausar manualmente nenhuma vez.'
    },
    {
      id: 'c_fita',
      name: 'Fita Isolante',
      price: 10,
      img: 'media/placeholder-64.png',
      desc: 'Congela temporariamente o seu timer por até 3 minutos para você resolver um imprevisto real, sem penalidades ao seu progresso.'
    },
    {
      id: 'c_fio_cobre',
      name: 'Fio Desencapado',
      price: 18,
      img: 'media/placeholder-64.png',
      desc: 'Descarrega um choque no sistema que avança o timer de foco em 3 minutos instantaneamente, mantendo 100% da sua recompensa intacta.'
    },
    {
      id: 'c_bateria',
      name: 'Bateria de Carro Velha',
      price: 12,
      img: 'media/placeholder-64.png',
      desc: 'Dá uma carga massiva no próximo Pomodoro que você terminar, faturando um bônus passivo de +50% de moedas.'
    }
  ],
  equipments: [
    {
      id: 'e_graxeira_eficiente',
      name: 'Graxeira Eficiente',
      price: 45,
      img: 'media/placeholder-64.png',
      desc: 'Automatiza o chão de fábrica: ao completar tarefas, em vez de abrir a janela visual da roleta, ela guarda o giro silenciosamente no estoque.'
    },
    {
      id: 'e_caldeira_pressao',
      name: 'Caldeira de Alta Pressão',
      price: 55,
      img: 'media/placeholder-64.png',
      desc: 'Garante fundos extras ao terminar ciclos de foco, injetando moedas adicionais baseadas na quantidade de sessões que você já concluuiu.'
    },
    {
      id: 'e_alternador_gasto',
      name: 'Alternador de Caminhão Velho',
      price: 40,
      img: 'media/placeholder-64.png',
      desc: 'Sempre que um som de ambiente tocar ao fundo, há 20% de chance de você ganhar 1 moeda de bônus imediatamente.'
    },
    {
      id: 'e_pistao_carbonizado',
      name: 'Pistão Carbonizado',
      price: 35,
      img: 'media/placeholder-64.png',
      desc: 'Engrenagem pesada: adiciona de forma fixa +1 moeda extra em qualquer tarefa real que você concluir na sua árvore.'
    },
    {
      id: 'e_caixa_multiplicadora',
      name: 'Caixa de Engrenagens de Juros',
      price: 70,
      img: 'media/placeholder-64.png',
      desc: 'Gera rendimentos passivos: a cada 3 roletas guardadas no seu estoque, você ganha moedas de bônus ao finalizar um ciclo de foco.'
    }
  ]
};

// Inicializa flags e estados temporários no objeto global que não precisam de persistência rígida
if (window.state) {
  window.state.tempModifiers = window.state.tempModifiers || {
    glicoseAtiva: false,
    cafeSemPausa: true,
    bateriaBonus: false,
    fitaBloqueioTimer: false,
    fitaTimeoutId: null
  };
}

// LÓGICA DE EXECUÇÃO DOS CONSUMÍVEIS
function usarConsumivel(id, todoId = null) {
  const st = window.state;
  if (!st) return false;

  switch (id) {
    case 'c_ficha':
      if (typeof window.openRoulette === 'function') {
        window.openRoulette('good');
        if (typeof window.showToast === 'function') window.showToast('Ficha utilizada! Roleta liberada.', 'success');
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('Erro ao acionar a roleta.', 'error');
      return false;

    case 'c_glicose':
      st.tempModifiers.glicoseAtiva = true;
      if (typeof window.showToast === 'function') window.showToast('Glicose aplicada! Próxima tarefa GRANDE dará o dobro de moedas.', 'success');
      return true;

    case 'c_triagem_sucata':
      if (st.todos && st.todos.length > 0) {
        st.todos.sort((a, b) => {
          const aGrand = a.diff === 'grande' ? 1 : 0;
          const bGrand = b.diff === 'grande' ? 1 : 0;
          return bGrand - aGrand;
        });
        if (typeof window.renderTodos === 'function') window.renderTodos();
        if (typeof window.saveState === 'function') window.saveState();
        if (typeof window.showToast === 'function') window.showToast('Lista reordenada! Tarefas grandes no topo.', 'success');
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('Nenhuma tarefa para ordenar.', 'error');
      return false;

    case 'c_oleo_brilhante':
      if (!todoId && st.todos && st.todos.length > 0) {
        const t = st.todos.find(x => !x.checked);
        if (t) todoId = t.id;
      }
      if (todoId) {
        const todo = st.todos.find(x => x.id === todoId);
        if (todo) {
          todo.glow = true;
          if (typeof window.renderTodos === 'function') window.renderTodos();
          if (typeof window.saveState === 'function') window.saveState();
          if (typeof window.showToast === 'function') window.showToast(`Óleo aplicado na tarefa: "${todo.text.substring(0,15)}..."`, 'success');
          return true;
        }
      }
      if (typeof window.showToast === 'function') window.showToast('Selecione ou crie uma tarefa válida para aplicar.', 'error');
      return false;

    case 'c_relogio_vapor':
      if (!todoId && st.todos && st.todos.length > 0) {
        const t = st.todos.find(x => !x.checked);
        if (t) todoId = t.id;
      }
      if (todoId) {
        const todo = st.todos.find(x => x.id === todoId);
        if (todo) {
          todo.deadline = Date.now() + (15 * 60 * 1000);
          if (typeof window.renderTodos === 'function') window.renderTodos();
          if (typeof window.saveState === 'function') window.saveState();
          if (typeof window.showToast === 'function') window.showToast('Cronômetro ativado! Você tem 15 minutos para terminar esta tarefa.', 'warning');
          return true;
        }
      }
      if (typeof window.showToast === 'function') window.showToast('Nenhuma tarefa disponível para aplicar o prazo.', 'error');
      return false;

    case 'c_adrenalina':
      if (st.pomodoroRunning && st.pomodoroPhase === 'foco') {
        st.pomodoroSecondsLeft += 300;
        if (typeof window.updatePomodoroDisplay === 'function') window.updatePomodoroDisplay();
        if (typeof window.showToast === 'function') window.showToast('+5 minutos adicionados ao timer de Foco!', 'success');
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('Você só pode injetar adrenalina durante uma sessão de Foco ativa.', 'error');
      return false;

    case 'c_gilete':
      if (st.pomodoroRunning && st.pomodoroPhase === 'foco') {
        st.pomodoroSecondsLeft = Math.max(0, st.pomodoroSecondsLeft - 300);
        st.tempModifiers.giletePenalidade = true;
        if (typeof window.updatePomodoroDisplay === 'function') window.updatePomodoroDisplay();
        if (typeof window.showToast === 'function') window.showToast('Timer cortado em 5 minutos! (Recompensa reduzida pela metade).', 'warning');
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('O timer precisa estar rodando em Foco.', 'error');
      return false;

    case 'c_cafe':
      st.tempModifiers.cafeSemPausa = true;
      if (typeof window.showToast === 'function') window.showToast('Café tomado! Se concluir o foco sem pausar, ganhará o dobro.', 'success');
      return true;

    case 'c_fita':
      if (st.pomodoroRunning) {
        st.tempModifiers.fitaBloqueioTimer = true;
        if (typeof window.showToast === 'function') window.showToast('Timer congelado por até 3 minutos!', 'warning');
        
        if (st.tempModifiers.fitaTimeoutId) clearTimeout(st.tempModifiers.fitaTimeoutId);
        st.tempModifiers.fitaTimeoutId = setTimeout(() => {
          if (st.tempModifiers.fitaBloqueioTimer) {
            st.tempModifiers.fitaBloqueioTimer = false;
            if (typeof window.showToast === 'function') window.showToast('O tempo da fita isolante acabou. Timer retomado!', 'info');
          }
        }, 3 * 60 * 1000);
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('O cronômetro não está rodando.', 'error');
      return false;

    case 'c_fio_cobre':
      if (st.pomodoroRunning && st.pomodoroPhase === 'foco') {
        st.pomodoroSecondsLeft = Math.max(0, st.pomodoroSecondsLeft - 180);
        if (typeof window.updatePomodoroDisplay === 'function') window.updatePomodoroDisplay();
        if (typeof window.showToast === 'function') window.showToast('Choque de urgência! Avançou 3 minutos sem penalidades.', 'success');
        return true;
      }
      if (typeof window.showToast === 'function') window.showToast('Só aplicável durante o Foco ativo.', 'error');
      return false;

    case 'c_bateria':
      st.tempModifiers.bateriaBonus = true;
      if (typeof window.showToast === 'function') window.showToast('Bateria conectada! Próximo Pomodoro renderá +50% de bônus.', 'success');
      return true;

    default:
      if (typeof window.showToast === 'function') window.showToast('Item não implementado ou desconhecido.', 'error');
      return false;
  }
}

// Verifica de forma segura se um equipamento está ativo
function temEquipamento(id) {
  const st = window.state;
  if (!st || !st.inventory || !Array.isArray(st.inventory)) return false;
  return st.inventory.some(item => item.id === id && item.equipped === true);
}

// Expõe para o escopo global do app de forma limpa
window.ITENS_DB = ITENS_DB;
window.usarConsumivel = usarConsumivel;
window.temEquipamento = temEquipamento;