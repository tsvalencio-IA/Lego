# OTTO LEGO — Biblioteca de projetos reais (v6)

O aplicativo **não inventa novas construções**. A tela principal agora utiliza somente manuais publicados e com links verificáveis para a LEGO Classic **10698 (790 peças)**.

## Funcionalidades ativas

- **9 manuais oficiais LEGO**: os dois volumes de instruções da caixa e mais 7 projetos extras (apartamento, câmera, castelo, escavadeira, sapo, palmeira e ursinho).
- **3 projetos reais de autores no Rebrickable**, indicados explicitamente como alternativos para a 10698: casa modular (495 peças segundo o autor), Star Fighter (112) e camaleão (60).
- Filtro por origem, busca por nome, detalhes e **abertura dos manuais originais** em PDF LEGO ou na página do autor. Se a incorporação do PDF for bloqueada pelo navegador, use o link externo original que sempre aparece.
- **Cidade do Otto**: colocar modelos reais na lista, indicar “Quero montar”, “Montando”, “Concluído” ou “Desmontado” e retirar da lista sem mexer na fonte.
- **Projetos antigos preservados** no armazenamento `otto3d:v1`, em uma área separada com visualização 3D giratória para os modelos antigos. Esses projetos antigos são identificados como *não verificados*; não se misturam aos manuais oficiais.
- **Backup**: salva os projetos do catálogo `otto-lego-reais:v1` e a cópia do histórico antigo, sem limpar o navegador. Restauração disponível.
- Interface responsiva para Android e computadores; HTML estático pelo GitHub Pages, sem credenciais, npm no celular ou contas obrigatórias.

## Precisão: o que não está implementado

- Os manuais são **verdadeiros**, mas ainda não existe, neste repositório, uma reconstrução digital 3D das suas peças com prova de conformidade. Para eles, o manual original é a fonte definitiva; **não exibimos um modelo 3D inventado**.
- **Não descontamos automaticamente o estoque** por projeto recém-selecionado, pois não obtivemos/validamos a lista completa de códigos e cores usados por *cada construção*. Conhecer apenas o total de peças ou os 790 itens da caixa seria insuficiente.
- O histórico dos projetos antigos é independente do catálogo; conservar o 3D antigo não torna esses projetos oficiais.
- Nenhum PDF de terceiros é alterado ou redistribuído pelo repositório. Links apontam diretamente para o produtor.

## Fontes principais

- Manuais oficiais do conjunto: https://www.lego.com/en-us/service/building-instructions/10698
- Casa modular (Lenarex, MOC-47317): https://rebrickable.com/mocs/MOC-47317/Lenarex/10698-modular-house/
- Nave Star Fighter (Moe Brickman, MOC-61117): https://rebrickable.com/mocs/MOC-61117/Moe%20Brickman/10698-star-fighter/
- Camaleão (Lenarex, MOC-185994): https://rebrickable.com/mocs/MOC-185994/Lenarex/10698-chameleon/

## Arquivos ativos

- `index.html`: catálogo e interface do aplicativo.
- `catalogo-reais.js`: fontes e atributos dos 12 projetos reais.
- `catalogo-app.js`: filtros, manual, cidade, backup e histórico separado.
- `viewer3d.js`: somente visualizador dos projetos antigos, sem fabricar modelos digitais dos novos manuais.
- `tests/catalogo-v6.cjs` e `tests/browser.cjs`: testes de fontes, interface, persistência e navegador Android/desktop.

Os geradores e arquivos anteriores permanecem no GitHub para possível auditoria ou reversão, mas **não são carregados na página principal**. Workers antigos são desregistrados; dados locais permanecem.

## Deploy

GitHub → Settings → Pages → Deploy from a branch → `main` / `(root)`.
Site esperado: https://tsvalencio-ia.github.io/Lego/

**Powered by thIAguinho Soluções Digitais.**
