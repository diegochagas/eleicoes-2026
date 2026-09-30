// Baixa da API de Dados Abertos da Câmara como cada deputado de SP votou nas
// votações listadas em votacoes-camara.ts e grava data/raw/camara-votos.json.
// Uso: npm run data:camara
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { VOTACOES_CAMARA } from "./votacoes-camara";

const BASE = "https://dadosabertos.camara.leg.br/api/v2";
const UF = "SP";

async function get<T>(path: string, tentativas = 6): Promise<T> {
  let erro: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
      if (res.ok) return ((await res.json()) as { dados: T }).dados;
      erro = new Error(`HTTP ${res.status}`);
    } catch (e) {
      erro = e;
    }
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(`Falhou ${path}: ${String(erro)}`);
}

interface VotoApi {
  tipoVoto: string;
  deputado_: { id: number; nome: string; siglaPartido: string; siglaUf: string };
}

interface DeputadoApi {
  nomeCivil: string;
}

async function main() {
  const deputados: Record<string, { nome: string; nomeCivil: string; partido: string }> = {};
  const votos: Record<string, Record<string, string>> = {};
  const placar: Record<string, Record<string, number>> = {};

  for (const v of VOTACOES_CAMARA) {
    const lista = await get<VotoApi[]>(`/votacoes/${v.idVotacao}/votos`);
    if (lista.length === 0) throw new Error(`Votação ${v.idVotacao} sem votos nominais`);
    votos[v.chave] = {};
    placar[v.chave] = {};
    for (const voto of lista) {
      placar[v.chave][voto.tipoVoto] = (placar[v.chave][voto.tipoVoto] ?? 0) + 1;
      if (voto.deputado_.siglaUf !== UF) continue;
      const id = String(voto.deputado_.id);
      votos[v.chave][id] = voto.tipoVoto;
      // O partido fica o da votação mais recente em que o deputado aparece.
      deputados[id] = { nome: voto.deputado_.nome, nomeCivil: deputados[id]?.nomeCivil ?? "", partido: voto.deputado_.siglaPartido };
    }
    console.log(v.chave, placar[v.chave], `SP: ${Object.keys(votos[v.chave]).length}`);
  }

  for (const id of Object.keys(deputados)) {
    deputados[id].nomeCivil = (await get<DeputadoApi>(`/deputados/${id}`)).nomeCivil;
  }

  const saida = { fonte: BASE, uf: UF, placar, deputados, votos };
  writeFileSync(resolve(import.meta.dirname, "../data/raw/camara-votos.json"), JSON.stringify(saida, null, 1) + "\n");
  console.log(`${Object.keys(deputados).length} deputados de ${UF} gravados`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
