# Sistema de movimento UMADEB

Este documento define quando, por que e como a interface se move. Uma animação
que não comunica mudança de estado, relação espacial ou resultado de uma ação
não deve existir.

## Princípios obrigatórios

1. Conteúdo é visível por padrão. Nenhuma tela começa com `opacity: 0`.
2. Movimento responde a uma ação ou a uma mudança real de estado.
3. A interface não salta no hover: sem `translateY`, aumento de escala ou bounce.
4. CSS resolve estados simples; Motion resolve presença, layout e gestos.
5. Animar primeiro `transform` e `opacity`. Não animar blur, sombra ou filtro.
6. `prefers-reduced-motion` remove deslocamentos, springs e sequências.
7. Uma interação frequente termina em até 220 ms; overlays podem chegar a 300 ms.
8. Animações nunca bloqueiam clique, foco, leitura ou navegação.

## Vocabulário

Os valores CSS vivem em `src/styles/tokens.css` e os valores React em
`src/lib/motion.ts`.

| Papel | Duração | Curva | Uso |
|---|---:|---|---|
| Instantâneo | 90 ms | standard | pressão e confirmação tátil |
| Rápido | 160 ms | standard | cor, borda, hover e saída |
| Padrão | 220 ms | ease-out | entrada e atualização visível |
| Deliberado | 300 ms | ease-out | modal, drawer e bottom sheet |
| Layout | spring 480/40/0.72 | spring | reordenação de listas |
| Navegação | spring 520/42/0.68 | spring | superfície ativa entre destinos |

Os três números de spring representam `stiffness`, `damping` e `mass`.

## Regra por componente

### 1. Navegação lateral e inferior

- Motor: Motion layout animation.
- O fundo azul suave é uma única superfície compartilhada que muda de posição.
- Texto e ícone mudam de cinza para azul em 160 ms.
- O conteúdo do link nunca desaparece e a área clicável não se move.
- Desktop e mobile usam identificadores de layout separados.
- Reduced motion troca a superfície imediatamente, sem spring.

### 2. Botões primários

- Motor: CSS.
- Hover altera apenas a cor do fundo em 160 ms.
- Pressionado usa um tom azul mais escuro em 90 ms.
- Não há escala, salto, glow ou sombra animada.
- Loading mantém largura e altura; apenas texto e indicador interno mudam.

### 3. Links e ações textuais

- Motor: CSS.
- Cor muda em 160 ms.
- Setas podem deslocar no máximo 2 px horizontalmente quando isso indicar destino.
- Não usar underline que cresce, rotação ou bounce.

### 4. Campos de formulário

- Motor: CSS.
- Borda responde em 160 ms; o focus ring aparece imediatamente e com nitidez.
- O campo não aumenta e o layout não muda ao receber foco.
- Mensagem de validação já ocupa espaço quando necessário para evitar salto.
- Um erro após submit pode usar deslocamento horizontal total de até 3 px por
  180 ms, somente uma vez por tentativa; nunca repetir continuamente.

### 5. Força da senha

- Motor: CSS.
- Cada segmento troca somente a cor em 160 ms.
- O preenchimento não muda de escala e as pontas permanecem estáveis.
- Texto numérico atualiza imediatamente e é anunciado por `aria-live`.

### 6. Toasts

- Motor: Motion.
- Entrada: `translateY(12px)` até zero em 220 ms, sem começar invisível.
- Atualização loading → resultado preserva a posição e troca o conteúdo.
- Saída: `opacity` até zero e `translateY(6px)` em 160 ms.
- Um toast por vez; o próximo substitui o anterior sem empilhar a tela.
- Reduced motion mantém somente uma troca praticamente instantânea.

### 7. Filtros e lista de jovens

- Motor: Motion layout animation.
- Itens existentes reorganizam por transform usando spring de layout.
- Item removido pelo filtro sai com `opacity` e 4 px no eixo Y em 160 ms.
- Itens presentes no primeiro render usam `initial={false}` e já aparecem.
- Não animar `height`, `top`, `left` ou margens manualmente.
- Reduced motion atualiza a lista sem interpolação.

### 8. Contadores e métricas

- Motor: Motion somente quando o valor mudar após uma operação real.
- Duração máxima: 220 ms.
- Números não animam no carregamento inicial.
- Para diferenças pequenas, interpolar numericamente; para grandes, trocar o
  valor e usar deslocamento vertical máximo de 4 px.
- Reduced motion troca o número de imediato.

### 9. Modal de criação e edição

- Motor: Motion + portal.
- Backdrop chega no máximo a 55% de opacidade em 220 ms.
- Painel usa `translateY(8px)` e, opcionalmente, escala mínima de 0.99 por 300 ms.
- O painel nunca começa invisível; conteúdo e foco existem desde a montagem.
- Fechamento dura 160 ms e devolve foco ao controle que abriu o modal.
- Clique no backdrop e Escape fecham; submit em andamento bloqueia fechamento.

### 10. Bottom sheet mobile

- Motor: Motion gesture.
- Entrada vem da borda inferior por transform em até 300 ms.
- Arraste só fecha após limiar de distância ou velocidade documentado.
- O conteúdo interno pode rolar sem disputar o gesto vertical da folha.
- Reduced motion monta e desmonta sem deslocamento.

### 11. Confirmação destrutiva

- Motor: Motion apenas para modal e feedback de conclusão.
- Vermelho não pulsa e não emite glow.
- Confirmação exige ação explícita; não animar o botão para atrair clique.
- Após sucesso, o item removido segue a regra de saída de lista.

### 12. Sucesso, vazio e erro

- Motor: CSS para cor; Motion somente se houver mudança de estado montada.
- Ícone de sucesso pode desenhar o traço uma vez em até 300 ms.
- Estado vazio já nasce visível e não flutua.
- Erro não pisca; mudança de cor e texto é suficiente na maioria dos casos.

### 13. Troca de páginas

- Não há fade de entrada global.
- A nova página aparece imediatamente e o scroll interno volta ao topo.
- A superfície ativa da navegação fornece continuidade espacial.
- Uma transição de rota só será adicionada se mantiver o conteúdo visível sem
  JavaScript e não atrasar a próxima ação.

### 14. Loading e skeleton

- Preferir preservar a estrutura da tela.
- Skeleton usa uma mudança tonal discreta; não usar shimmer infinito brilhante.
- Operações curtas mantêm o controle no lugar e mostram progresso dentro dele.
- Após 10 segundos, explicar o atraso em texto em vez de intensificar movimento.

## Orçamento de performance

- Alvo: 60 fps em aparelhos móveis intermediários.
- Máximo de uma animação estrutural por região da tela.
- Evitar mais de 20 elementos animados simultaneamente.
- Não manter `will-change` permanentemente; Motion cuida da promoção temporária.
- Não animar `box-shadow`, `filter`, `backdrop-filter`, `width` ou `height` em listas.
- Medir novamente quando uma lista ultrapassar 100 itens.

## Revisão obrigatória

- Testar mouse, teclado e toque.
- Testar com `prefers-reduced-motion: reduce`.
- Confirmar que cancelar ou navegar rapidamente não deixa estado intermediário.
- Confirmar que nenhum texto fica invisível se a animação não executar.
- Confirmar ausência de layout shift e scroll horizontal em 320 px.
- Confirmar que o movimento explica algo perceptível ao usuário.
