# OTTO LEGO — versão simples (v4)

O aplicativo foi simplificado para oferecer um fluxo funcional com **HTML, JavaScript e desenho isométrico SVG**, sem Three.js, LDraw remoto, Firebase, API paga ou backend. O código permanece hospedado neste repositório.

## Como usar

1. Acesse a página publicada pelo GitHub Pages (consulte **Settings → Pages** do repositório para confirmar se a publicação está ativa).
2. Em **Peça seu projeto**, descreva uma torre, muro, casa simples, escada ou plataforma. Exemplos: "torre azul de 3 camadas", "muro 6x2 com 2 camadas" e "casa 4x4 com abertura".
3. Toque em **Calcular projeto**, depois em **Próximo** para visualizar uma peça de cada vez. **Girar vista** muda a perspectiva isométrica.
4. Em **Salvar na cidade**, o sistema reserva a quantidade exata de cada par código/cor no inventário cadastrado.
5. Na cidade, marque a construção como montada ou desmontada. Desmontar libera suas peças.

## O que funciona

- Gerador geométrico de famílias limitadas de construções com tijolos retangulares.
- Visualização isométrica diretamente em SVG, sem nenhum download externo.
- Etapas, códigos das peças, quantidades, cor, estoque, reservas e devoluções.
- Projetos existentes e inventário preservados pelo armazenamento \`otto3d:v1\`.
- Backup JSON, importação de catálogo CSV/JSON, exportação CSV do estoque e LDR do modelo.
- Ditado por voz apenas quando o navegador oferece suporte.

## Limites — sem inventar

- A caixa **LEGO Classic 10698** possui **790 peças nominais**. O catálogo inicial do aplicativo registra uma **amostra de 131 peças em 39 códigos/cores**, herdada da primeira versão; a quantidade e o conteúdo físicos precisam ser conferidos. O resto não é atribuído a formas fictícias.
- Os desenhos são **isométricos esquemáticos** (não modelos LDraw detalhados nem imagens oficiais das peças). O mecanismo verifica encaixes na grade e colisões básicas, **não resistência ou equilíbrio reais**.
- Não há gerador fiel para veículos, animais, engrenagens ou articulações. Pedidos assim são recusados em vez de substituídos silenciosamente.
- Os dados ficam neste navegador. Antes de trocar de aparelho ou limpar dados, baixe um backup.
- Caso o site não abra, confirme a publicação do GitHub Pages. Uma aprovação de GitHub Actions não garante, sozinha, que o site esteja publicado.

## Arquivos ativos

- \`index.html\`: interface completa responsiva e CSS embutido.
- \`simple.js\`: funcionamento, visualizador SVG, projeto, inventário, backup e projetos salvos.
- \`generator.js\`: núcleo de geração para tijolos retangulares.
- \`inventory-seed.js\`: amostra herdada do catálogo.
- \`tests/v4.cjs\`: validação automatizada do fluxo principal.

Os demais arquivos do ORÁCULO antigo foram preservados apenas como histórico e não são carregados pela página principal. O service worker antigo é desativado quando a versão 4 é aberta.

**Fonte de conferência:** https://www.bricklink.com/catalogItemInv.asp?S=10698-1

Powered by thIAguinho Soluções Digitais.
