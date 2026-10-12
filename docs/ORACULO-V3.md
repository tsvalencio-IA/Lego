# ORÁCULO 3D — Arquitetura de Engenharia LEGO (v3)

## Objetivo e âmbito

Receber descrições em português de Otto, analisar rigorosamente o que é solicitado e liberar somente projetos que passem pelo conjunto de verificações **efetivamente implementadas**. O sistema não transforma um pedido complexo em um modelo simplificado fingindo que cumpriu os requisitos.

- Caixa alvo: **LEGO Classic 10698-1**.
- Referência nominal: **790 peças em 225 lotes regulares** (por design ID e cor, segundo BrickLink). As contagens separadas de extras, contraparts e alternativas não são peças adicionais para a caixa.
- O inventário pré-instalado contém **131 unidades em 39 lotes**. Não existe presunção de disponibilidade das demais peças.
- Compatível com GitHub Pages, Android e browsers modernos; não requer back-end.
- O estado atual é um **oráculo geométrico auditável** para tijolos retangulares. Não constitui certificação mecânica ou estrutural.

## Componentes

1. **index.html / styles.css** — interface com Projetar, ORÁCULO Engenharia, Cidade, Estoque e Precisão.
2. **app.js** — estado local, projetos, reservas, desmontagens, importação CSV/JSON, backup/restauração, áudio, visão 3D de passos, laudo e exportação LDR.
3. **generator.js** — interpretação limitada de pedidos, cobertura exata do volume por tijolos retangulares presentes no inventário, backtracking limitado, verificação geométrica por camadas e formato LDraw.
4. **oraculo.js** — camada de engenharia: detecta requisitos não suportados, audita inventário, verifica estoque, valida a sequência física de colocação e emite um laudo JSON.
5. **ldraw-view.js** — modo OPCIONAL que tenta carregar malhas verdadeiras da LDraw Parts Library; sinaliza falha e mantém o visualizador esquemático. Só o carregamento de malha real permite chamar o detalhe geométrico de LDraw.
6. **sw.js** — cache PWA das fontes próprias, mantendo uma versão única dos arquivos.
7. **tests/smoke.cjs e tests/oraculo.cjs** — verificações automatizadas de regressão executadas por GitHub Actions.

## Contrato de fidelidade

O resultado **PROJETO_VALIDO_NA_GRADE** significa que:
- Todas as peças no plano possuem código/cor no inventário disponível.
- O número de peças não ultrapassa o saldo registrado por par design ID/cor, subtraídas as construções reservadas e montadas.
- O plano usa formatos de tijolo retangular previstos no núcleo.
- Não foram identificadas colisões entre tijolos da mesma camada.
- Foi verificada conectividade por sobreposição entre camadas.
- Cada peça elevada possui apoio geométrico mínimo em peças já colocadas nas etapas anteriores.

Esse resultado **NÃO** comprova:
- Resistência de ligações, rigidez estrutural, atrito, estabilidade contra tombamento ou segurança infantil.
- Física de rodas, engrenagens, alavancas, dobradiças, motores ou transformações.
- Equivalência de todos os códigos BrickLink/LEGO/LDraw, incluindo famílias não retangulares.
- Que a caixa do Otto ainda possui fisicamente todas as peças nominais.
- Correspondência visual de malhas LDraw antes de download e carregamento bem-sucedido.

O resultado **REQUISITO_NAO_IMPLEMENTADO** bloqueia a geração quando o texto pede um veículo, animal, personagem, cidade completa, estrutura suspensa ou característica específica móvel, motorizada ou decorativa ainda sem implementação certificada.

O resultado **SEM_SOLUCAO** significa que a busca não encontrou montagem dentro do inventário, das dimensões e dos limites de cálculo implementados; não prova impossibilidade matemática absoluta se o algoritmo esgotou orçamento computacional.

## Planejador de construções

- Famílias habilitadas: torres, casas simples com abertura de porta, muros, escadas, plataformas.
- Dimensões interpretadas: largura e comprimento em pinos, altura em camadas.
- Otimização: ocupação de células-alvo em grade usando os códigos retangulares 3005, 3004, 3003, 3002, 3001 e 2456.
- Estoque: mapa de saldos por ID e cor. Cada tentativa reduz temporariamente os saldos no backtracking; ao falhar, as reservas de busca são desfeitas.
- Validação: grade, sobreposição, suporte, conectividade final e sequência de etapas.
- Exportação: LDR com uma peça real referenciada por linha tipo 1, e divisores \`0 STEP\`. O visualizador detalhado depende da disponibilidade dos arquivos oficiais de peças da biblioteca LDraw.

## Catálogo completo, peças especiais e mecanismos (pendente)

Para liberar caminhões, tratores, robôs, animais, mecanismos:
1. Obter 225 lotes regulares com fonte e variantes explicadas; validar a soma 790 e conferir contra a caixa.
2. Mapear códigos de peças, cores e malhas com a LDraw Parts Library e manter licença/atribuição.
3. Criar descritores rígidos de conectores: pinos, tubos, eixos, pivôs, articulações e folgas geométricas.
4. Desenvolver solucionador 3D com restrições de conectividade e dependências, incluindo peças não ortogonais.
5. Validar colisões durante movimento e funcionamento cinemático.
6. Criar ensaios/testes físicos reproduzíveis em vez de deduzir estabilidade apenas pela grade.
7. Expandir os testes, de resultados matemáticos para aceitação prática no Android e comparação de montagem com peças reais.

**Não liberar no dashboard capacidades que não cumpram esses critérios.**

## Fontes e atribuição

- Inventário do conjunto: https://www.bricklink.com/catalogItemInv.asp?S=10698-1
- Instruções LEGO: https://www.lego.com/en-us/service/building-instructions/10698
- LDraw.org Parts Library, distribuição conforme licenças próprias: https://www.ldraw.org/legal-info
- Documentação do carregador 3D: https://threejs.org/docs/#examples/en/loaders/LDrawLoader
- Espelho de distribuição da biblioteca: https://github.com/kulits/ldraw-parts
- Uso de geometria real LDraw deve preservar atribuição “LDraw.org Parts Library — CC BY 2.0”, sujeito às licenças de cada arquivo.

Powered by thIAguinho Soluções Digitais.
