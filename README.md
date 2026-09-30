# Régua do Voto — Eleições 2026 (São Paulo)

Site em português para quem vota no estado de São Paulo em 4 de outubro de 2026.
Mostra todos os candidatos a presidente, governador, senador, deputado federal e
deputado estadual:

- em ordem **da direita para a esquerda**, por análise de propostas e estudos técnicos;
- com o **nome em vermelho** quando há um motivo de alerta com fonte (voto em benefício
  dos próprios políticos, voto ou ato por mais imposto, acusação ou condenação).

A página `/como-funciona` explica as regras, as fontes e os limites.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3050
npm run build && npm start   # versão estática, como vai ao ar
```

## Dados

| Pasta | O que tem |
|---|---|
| `data/raw/tse-candidatos.json`, `tse-detalhes.json` | Lista oficial do TSE (DivulgaCand): número, nome, partido, situação do registro, se consta da urna |
| `data/raw/camara-votos.json` | Votos dos deputados de SP nas votações nominais listadas em `scripts/votacoes-camara.ts` |
| `data/partidos.json` | Nota de cada partido na régua (pesquisa com cientistas políticos, rodada de 2022) |
| `data/research/` | Apuração com fontes: análise dos candidatos majoritários e alertas de deputados |
| `src/data/` | Arquivos gerados que o site lê. Não editar à mão |

```bash
npm run data:camara   # atualiza os votos pela API de Dados Abertos da Câmara
npm run data:build    # gera src/data a partir de data/
```

O site do TSE recusa acesso automatizado, então a lista de candidatos foi copiada pelo
navegador a partir da API pública do DivulgaCand.

## Testes

```bash
scripts/check         # tipos, lint, testes unitários e build (também roda no pre-push)
npm run e2e           # Playwright: todas as rotas, acessibilidade e capturas de tela
git config core.hooksPath .githooks   # uma vez por clone
```

## Publicar

O site é estático (`next build` gera a pasta `out/`). `npm run deploy` gera a versão para o
GitHub Pages e publica no branch `gh-pages`; o CI faz o mesmo a cada push no `main`.

## Aviso

Nome em vermelho não quer dizer culpado, e nome sem vermelho não quer dizer ficha limpa.
Cada motivo traz a fonte e a situação do caso na data em que os dados foram gerados.
