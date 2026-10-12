# OTTO 3D — Laboratório de Criações

Versão inicial para planejar construções e controlar o estoque da caixa LEGO Classic 10698, diretamente no navegador.

## Implementado

- Dashboard de estoque por código + cor: total identificado, peças reservadas/montadas e livres.
- Cidade com diversos projetos. Estados planejado/reservado, montado e desmontado; devolver peças ao desmontar.
- Gerador demonstrativo para torre, casinha, muro e praça, com verificação de peças por tipo e cor antes de salvar.
- Visualizador tridimensional Three.js com rotação, zoom e instruções de montagem peça a peça.
- Ideias em texto e ditado por voz quando o navegador oferecer suporte.
- Importação CSV/JSON de inventário, backup JSON e restauração.
- Armazenamento local no navegador (localStorage) e interface responsiva Android/computador.
- Sem necessidade de npm, Firebase ou servidor próprio.

## LIMITES QUE NÃO DEVEM SER CONFUNDIDOS COM RECURSOS PRONTOS

**Catálogo parcial:** a caixa 10698 possui 790 peças regulares distribuídas em 225 lotes (código + cor), segundo o BrickLink. A aplicação inclui uma amostra conferida, não 790 peças ficticiamente distribuídas. O restante é registrado como não catalogado e indisponível para projeto até importar o inventário completo. Importações com 790 peças e 225 lotes são marcadas como completas apenas na contagem; é preciso ainda conferir peças e variantes com a caixa.

**Geometria demonstrativa:** os blocos retangulares comuns têm escala externa baseada em grade de 8 mm e altura de 9,6 mm. Não são reproduzidos os tubos internos e todos os detalhes e não há simulação de força, encaixe mecânico ou estabilidade. Modelos de rodas, portas e peças especiais exigem biblioteca 3D detalhada (ex.: LDraw, respeitando licenças). Não apresentar estas prévias como montagens 100% certificadas.

**Gerador demonstrativo:** o texto/voz identifica quatro tipos de construções existentes; não é uma IA de projeto livre. Não fabrica um modelo genérico sem peças reais para qualquer pedido.

**Sem sincronização:** os dados ficam no navegador. Exporte backup JSON antes de trocar de celular ou limpar dados. Three.js vem do CDN jsDelivr, portanto o primeiro carregamento 3D requer conexão.

## Publicação no GitHub Pages pelo celular

1. Abra Settings → Pages no repositório Lego.
2. Em Build and deployment, escolha Deploy from a branch.
3. Selecione main e /(root), e salve.
4. Depois de confirmado pelo GitHub, acesse https://tsvalencio-ia.github.io/Lego/ .

## Inventário

Importe CSV com cabeçalho e linhas como:

    part,color,quantity,name
    3004,Black,4,Brick 1 x 2
    3002,Black,8,Brick 2 x 3

Aceita também codigo,cor,quantidade,nome. O catálogo importado não pode exceder 790 peças nem conter pares código/cor duplicados. Projetos existentes são preservados apenas se continuarem compatíveis com o estoque.

Importante: não somar os itens extras, componentes internos de peças compostas e alternativas duplicadas. Brickset mostra 801 na lista de reposição, que não equivale automaticamente às 790 peças regulares.

## Fontes

- https://www.lego.com/en-us/product/lego-large-creative-brick-box-10698
- https://www.bricklink.com/catalogItemInv.asp?S=10698-1
- https://brickset.com/inventories/10698-1
- https://threejs.org/manual/pages/installation.html
- https://www.ldraw.org/legal-info

Powered by thIAguinho Soluções Digitais
