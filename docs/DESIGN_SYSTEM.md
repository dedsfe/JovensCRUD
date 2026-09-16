# Sistema visual UMADEB

Este arquivo é a referência para todas as telas. Uma nova interface só deve
criar uma exceção depois que a regra existente demonstrar que não atende ao
caso de uso.

## Princípios

1. O fundo principal é sempre branco.
2. Preto e cinza constroem a hierarquia. Azul Apple identifica ação e seleção.
3. Vermelho é exclusivo para erro ou ação destrutiva.
4. Conteúdo curto, direto e em PT-BR.
5. Nada depende de animação para aparecer.
6. A página nunca tem scroll global. Apenas a área interna de conteúdo rola.
7. Um controle visível precisa funcionar ou estar claramente indisponível.

## Tipografia

- Família: `ui-rounded`, SF Pro Rounded e fallbacks nativos da Apple.
- Título de página: 32 a 46 px, peso 720, espaçamento óptico negativo leve.
- Título de seção: 18 a 24 px, peso 680.
- Corpo: 14 a 16 px, altura de linha entre 1.4 e 1.55.
- Metadados: mínimo de 12 px, sempre com contraste legível.

## Cores

Os valores oficiais vivem em `src/styles/tokens.css`. Não inserir hexadecimal
novo em componentes sem antes avaliar se o token deve fazer parte do sistema.

- Canvas e superfícies principais: branco.
- Superfície secundária: cinza quase branco, apenas para agrupamento.
- Texto principal: `--color-ink`.
- Texto secundário: `--color-ink-secondary`.
- Ação: `--color-blue`.
- Destrutivo: `--color-red`.

## Forma e profundidade

- Controles: raio de 14 px.
- Grupos e painéis: 20 a 28 px.
- Avatares podem ser circulares; botões não viram cápsulas por padrão.
- Sombras são pequenas, direcionais e reservadas a controles elevados,
  superfícies selecionadas ou overlays. Painéis comuns usam diferença tonal e
  espaçamento.
- Toda sombra de profundidade parte de preto puro: `rgba(0, 0, 0, opacidade)`.
  Não usar sombras azuis, vermelhas ou tingidas pela cor do componente.
- Controle elevado: deslocamento vertical de 2 a 3 px, blur de 5 a 8 px e
  opacidade máxima de 14%.
- Overlay, toast, modal ou popover: deslocamento vertical de 8 a 12 px, blur de
  24 a 32 px e opacidade máxima de 16%.
- Seleção pequena, como um segmento ativo: deslocamento de 2 px, blur de 5 px e
  opacidade máxima de 7%.
- A sombra precisa indicar uma relação espacial real. Ela não é decoração e
  não deve envolver todos os lados como um halo.
- Sombras não recebem transição nem animação. Hover e pressão mudam cor ou
  superfície, mantendo a elevação estável.
- Focus ring azul não é sombra: deve ser implementado como `outline`, para não
  misturar acessibilidade com profundidade.
- Não usar glow, múltiplas sombras empilhadas, cópia borrada da forma ou caixa
  sólida deslocada para simular sombra.

## Estrutura do aplicativo

- Desktop: navegação lateral branca, fixa, e conteúdo interno rolável.
- Mobile: cabeçalho branco e navegação inferior fixa.
- A navegação ativa usa peso, texto azul e superfície azul muito suave.
- A logo aparece como marca livre, sem tile ou caixa adicional.
- A largura de leitura do conteúdo é limitada, mesmo em monitores grandes.

## Movimento

- O contrato completo está em `docs/MOTION_SYSTEM.md`.
- Duração normal entre 150 e 220 ms.
- Nada salta ou aumenta de escala ao passar o mouse.
- Preferir mudança tonal e movimento de indicadores já visíveis.
- Respeitar `prefers-reduced-motion`.

## Conteúdo e estados

- Toasts são sempre em PT-BR.
- Loading, vazio, sucesso, erro e permissão negada precisam de texto explícito.
- Nunca mostrar mensagens cruas da API.
- Dados de demonstração precisam ser identificados como demonstração.

## Checklist antes de entregar uma tela

- Fundo branco e paleta restrita.
- Sem scroll no documento.
- Sem texto ou controle cortado em 320 px.
- Foco visível e áreas de toque de pelo menos 44 px.
- Estados ativos e desabilitados inequívocos.
- Nenhum botão ou link sem resposta.
- Contraste, alinhamento e centralização verificados no navegador.
- Conteúdo visível mesmo com JavaScript de animação interrompido.
- Toda sombra usa os tokens do sistema e canais RGB pretos.
