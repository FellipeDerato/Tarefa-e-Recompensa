# Tarefa & Recompensa

> Ideia: Fellipe Derato — Código: "vibecoded" (feito só pra brincar e ter algo rápido para uso pessoal)

Este repositório contém uma pequena aplicação web (HTML/CSS/JS) para gerenciar afazeres e roletas de recompensa/sofrimento inspirada no fluxo Pomodoro. Sinta-se à vontade para usar, adaptar ou redistribuir — é um projeto pessoal e permissivo.

Demo (instalável como PWA): https://fellipederato.github.io/Tarefa-e-Recompensa/

Principais features
- Lista de tarefas com subtarefas (estrutura em árvore)
- Criação rápida de tarefas: nova linha que vira tarefa ao digitar
- Autosize de textareas: começa com 1 linha e expande ao quebrar linha (até um limite)
- Checkbox estilizado com efeitos sonoros
- Botões de dificuldade/recompensa: `PEQUENO` / `GRANDE` e seletor de modo da roleta
- Pools de recompensa: modos "Boas", "Ruins", "Custom", "Todas" (botões na tela de configuração)
- Constantes de recompensas padrão: `DEFALT_GOOD_SMALL`, `DEFALT_GOOD_LARGE`, `DEFALT_BAD_SMALL`, `DEFALT_BAD_LARGE`
- Pomodoro integrado com tempos configuráveis (foco, pausa curta, longa)
- Auto-start da próxima sessão (toggle `Auto iniciar próxima`) — ativado por padrão
- Contagem regressiva sonora aos 10 segundos do timer
- Sons de tecla aleatórios sem repetir o último, com variação de pitch
- Rolagem/roleta de recompensas com canvas e animação
- Tela "Sessão Completa" com opção de girar a roleta ou ignorar (se ignorar, pode avançar automaticamente para a próxima sessão se a opção estiver ativa)
- PWA: `manifest.json`, `service-worker.js` (cache app shell e fallback para evitar 404 em homescreen)
- Ajustes de mobile/UX: compact UI, wrapping/left-align de textos longos, redução de espaçamentos e botões menores para mais espaço de leitura
- Configurações de volume separadas (Geral, Efeitos, Timer, Ambiente) e ambiência sonora agendada
- Correções e polimentos: correção do bug de criação de nova tarefa, remoção de duplicatas de helpers, melhorias de persistência (`localStorage`)

Como usar
- Abrir `index.html` num navegador moderno (para PWA e service worker, sirva via HTTPS ou use o link do GitHub Pages acima).
- A interface principal mostra a lista de afazeres; crie uma nova tarefa digitando na linha "Novo afazer...".
- Configure tempos, volumes e pools de recompensa em "Configurar".
- Use a aba "Pomodoro" para gerenciar sessões; quando a sessão terminar, use a roleta para decidir a recompensa.

Desenvolvimento
- Arquivos principais: `index.html`, `style.css`, `app.js`.
- Áudios: pasta `audio/` (efeitos e contagem regressiva).
- Ícones: pasta `media/` (usada pelo `manifest.json`).

Possíveis melhorias futuras
- Slider de zoom / escala para mobile
- Ícones maskable e ajustes adicionais do manifest para evitar barra branca em homescreen
- Mais opções de personalização de som e temas
- Import/Export das tarefas em JSON
- Sincronização entre dispositivos

Créditos
- Ideia: Fellipe Derato
- Implementação rápida/experimentação: "vibecoded" — só pra brincar e ter algo utilizável pessoalmente

Use à vontade — se quiser que eu melhore algo (ex.: gerar ícones maskable, adicionar export/import, ou ajustar o PWA), diga o que prefere e eu implemento.
