# OTTO LEGO — Biblioteca de projetos reais + 3D (v7)

O aplicativo **não inventa novas construções**. A tela principal agora utiliza somente manuais publicados e com links verificáveis para a LEGO Classic **10698 (790 peças)**.

## Funcionalidades ativas

- **9 manuais oficiais LEGO**: os dois volumes de instruções da caixa e mais 7 projetos extras (apartamento, câmera, castelo, escavadeira, sapo, palmeira e ursinho).
- **3 projetos reais de autores no Rebrickable**, indicados explicitamente como alternativos para a 10698: casa modular (495 peças segundo o autor), Star Fighter (112) e camaleão (60).
- Filtro por origem, busca por nome, detalhes e **abertura dos manuais originais** em PDF LEGO ou na página do autor. Se a incorporação do PDF for bloqueada pelo navegador, use o link externo original que sempre aparece.
- **Cidade do Otto**: colocar modelos reais na lista, indicar “Quero montar”, “Montando”, “Concluído” ou “Desmontado” e retirar da lista sem mexer na fonte.
- **Projetos antigos preservados** no armazenamento `otto3d:v1`, em uma área separada com visualização 3D giratória para os modelos antigos. Esses projetos antigos são identificados como *não verificados*; não se misturam aos manuais oficiais.
- **Backup**: salva os projetos do catálogo `otto-lego-reais:v1` e a cópia do histórico antigo, sem limpar o navegador. Restauração disponível.
- Interface responsiva para Android e computadores; HTML estático pelo GitHub Pages, sem credenciais, npm no celular ou contas obrigatórias.

## Modelos 3D em desenvolvimento

- **Sapo LEGO Classic 10698**: arquivo `modelos3d/lego-sapo-10698-packed.mpd`, reconstruído preliminarmente a partir do manual oficial LEGO. São 11 etapas e 16 referências a peças, utilizando malhas LDraw com 57 arquivos de peça/subpeça/primitiva embutidos. Geometria da peça baseada em modelos LDraw; posição e sequência são INTERPRETAÇÃO DO MANUAL e ainda precisam ser conferidas para garantir fidelidade 100%.
- Clique no botão **3D preliminar** no card Sapo para abrir visualização giratória no próprio navegador. Arraste para girar, use zoom e navegue entre etapas. O renderizador `modelos3d-canvas.js` lê superfícies reais LDraw e projeta-as localmente, sem exigir Three.js ou CDN. Isso é visualização 3D genuína do arquivo digital, não prova de encaixe físico.
- Nos outros projetos aparece **Importar 3D**: o manual continua acessível; o aplicativo aceita arquivos reais `.ldr`/`.mpd` (com autoria/proveniência) que ficam registrados no navegador via IndexedDB. Não exibe um projeto adivinhado.
- A integração não modifica nem substitui os PDFs oficiais e mantém integralmente a cidade, o backup e o histórico antigo.

## Oficina 3D em tela cheia — correção mobile

No celular, tocar em 3D preliminar/parcial abre uma janela de montagem que ocupa a tela do navegador. O modelo e os controles Anterior, Próxima, zoom, girar e centralizar permanecem juntos, sem rolar entre a lista antiga e o CAD.

Próxima adiciona uma instância de peça LDraw por vez; a peça nova é identificada em destaque e o código, cor e etapa do manual ficam visíveis. Manual abre o PDF como camada opcional. Voltar ao 3D preserva a etapa.

Foi corrigida a mensagem de etapas indefinidas, preservando o total de etapas da fonte. A câmera agora abre mostrando a parte superior da construção. Também foram acrescentadas cores LDraw faltantes (110 e 321).

Essas correções são de navegação e visualização: o modelo CAD continua em conferência, sem certificação de fidelidade total às instruções oficiais.

## Precisão: o que não está implementado

- O primeiro modelo digital do sapo **não está auditado como 100% fiel**. A reconstrução geométrica usa as peças LDraw, mas a posição original deve ser conferida peça por peça em relação ao PDF. Os outros 11 projetos ainda não possuem um modelo digital validado. Nenhum deve ser anunciado como 3D pronto antes dessa verificação.
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
- `viewer3d.js`: visualizador dos projetos antigos, separados do catálogo oficial.
- `modelos3d-catalogo.js`: registro de quais modelos CAD são suportados e seu nível de validação.
- `modelos3d/lego-sapo-10698-packed.mpd`: reconstrução do sapo com malhas LDraw e 11 etapas.
- `modelos3d-canvas.js`: renderizador interativo offline de superfícies reais LDraw.
- `modelos3d-engine.js` e `modelos3d-ui.js`: leitura, auditoria, importação, armazenamento e controles 3D.
- `tests/catalogo-v6.cjs`, `tests/modelos3d.cjs` e `tests/browser.cjs`: testes do catálogo e de rotação, zoom, navegação de etapas, integridade do arquivo CAD e controles em Chromium para Android/desktop.

Os geradores e arquivos anteriores permanecem no GitHub para possível auditoria ou reversão, mas **não são carregados na página principal**. Workers antigos são desregistrados; dados locais permanecem.

## Licenças e fontes das geometrias

Os arquivos de geometria da comunidade LDraw incluídos no MPD preservam nos respectivos subarquivos seus metadados de autoria e licença. Fonte LDraw.org Parts Library, sob CCAL/CC BY 2.0 conforme cabeçalhos específicos: https://www.ldraw.org/legal-info. O conjunto e as instruções são LEGO®; este projeto não é afiliado à LEGO. A reconstrução original de posições foi feita para OTTO 3D, com aviso de verificação pendente.

## Deploy

GitHub → Settings → Pages → Deploy from a branch → `main` / `(root)`.
Site esperado: https://tsvalencio-ia.github.io/Lego/

**Powered by thIAguinho Soluções Digitais.**
