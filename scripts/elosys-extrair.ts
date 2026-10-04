// Cruza os candidatos de 2026 com o banco do EloSys (github.com/YuriRDev/elosys) e grava
// data/research/elosys.json. O banco tem ~12 GB e fica fora do repositório:
//   ELOSYS_DB_PATH=/caminho/elosys.db npm run data:elosys
// Os textos são montados aqui, sem copiar a explicação do EloSys, porque ela cita CPF e nome
// de terceiros que fazem parte do mesmo ciclo.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const caminho = process.env.ELOSYS_DB_PATH;
if (!caminho) throw new Error("Defina ELOSYS_DB_PATH com o caminho do elosys.db");
const raiz = resolve(import.meta.dirname, "..");
const db = new DatabaseSync(caminho, { readOnly: true });

const tse = JSON.parse(readFileSync(resolve(raiz, "data/raw/tse-candidatos.json"), "utf8")) as Record<string, { id: number }[]>;
const ids = Object.values(tse).flatMap((l) => l.map((c) => c.id));

type Severidade = "low" | "medium" | "high";
const ORDEM: Severidade[] = ["low", "medium", "high"];
const maior = (a: Severidade, b: Severidade) => (ORDEM.indexOf(a) >= ORDEM.indexOf(b) ? a : b);
const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

const REPO = "https://github.com/YuriRDev/elosys";
const REGRAS = {
  despesa: { tipo: "despesa_desproporcional", fonteNome: "EloSys (dados do TSE), regra de despesa desproporcional" },
  circular: { tipo: "doacao_circular", fonteNome: "EloSys (dados do TSE), regra de doação circular" },
  socio: { tipo: "socio_fornecedor", fonteNome: "EloSys (TSE e Receita Federal), sócio de fornecedor de campanha" },
};

db.exec("CREATE TEMP TABLE alvo (candidatura TEXT, pessoa INTEGER)");
const inserir = db.prepare(
  "INSERT INTO alvo SELECT tse_candidacy_id, person_id FROM politician_history WHERE year = 2026 AND tse_candidacy_id = ?",
);
for (const id of ids) inserir.run(String(id));
const alvos = db.prepare("SELECT candidatura, pessoa FROM alvo").all() as { candidatura: string; pessoa: number }[];
console.log(`${alvos.length} de ${ids.length} candidaturas achadas no EloSys`);

interface Saida {
  tipo: string;
  severidade: Severidade;
  texto: string;
  fonte: string;
  fonteNome: string;
}
const saida: Record<string, { indicios: Saida[]; sancoes: { texto: string; status: string; fonte: string; fonteNome: string }[] }> = {};
const entrada = (id: string) => (saida[id] ??= { indicios: [], sancoes: [] });

const sinais = db.prepare(
  `SELECT s.type, s.severity, s.explanation, s.amount_cents AS valor, s.path_length AS elos
     FROM signal s JOIN signal_actor sa ON sa.signal_id = s.id AND sa.type = 'person' AND sa.actor_id = ?
    WHERE sa.role IN ('candidate', 'cycle_member', 'supplier')`,
);
const sociedades = db.prepare(
  `SELECT c.legal_name AS empresa, x.partner_role AS papel, x.payments_total_cents AS pago, x.paid_by_self AS propria
     FROM candidate_supplier_partner x JOIN companies c ON c.id = x.company_id WHERE x.person_id = ?`,
);
const sancoes = db.prepare(
  `SELECT registry, sanctioned_name AS nome, category, sanctioning_agency AS orgao, start_date, end_date, process_number AS processo
     FROM sanction WHERE person_id = ?`,
);

// Só a consulta do CEIS foi aberta e conferida; o CNEP precisaria de outro parâmetro.
function urlSancao(cadastro: string, nome: string): string {
  if (cadastro !== "CEIS") throw new Error(`Falta conferir o link de consulta do ${cadastro}`);
  return `https://portaldatransparencia.gov.br/sancoes/consulta?cadastro=1&nomeSancionado=${encodeURIComponent(nome)}`;
}

// Sem nenhuma candidatura de 2014 a 2024 no banco (a base do EloSys não tem anos anteriores a 2014).
const anteriores = db.prepare(
  "SELECT COUNT(*) AS n FROM politician_history WHERE person_id = ? AND year < 2026",
);
const estreantes: number[] = [];
for (const { candidatura, pessoa } of alvos) {
  if ((anteriores.get(pessoa) as { n: number }).n === 0) estreantes.push(Number(candidatura));
}

// Trajetória: desde o primeiro ano com candidatura registrada (2014 é o limite da base), quantas
// eleições disputou, em quantas foi eleito e para que cargos. Suplente não conta como eleito.
const anosDe = db.prepare(
  "SELECT year AS ano, office AS cargo, result AS resultado FROM politician_history WHERE person_id = ? AND year < 2026",
);
const trajetoria: Record<string, { desde: number; eleicoes: number; eleito: number; cargosEleito: string[] }> = {};
for (const { candidatura, pessoa } of alvos) {
  const linhas = anosDe.all(pessoa) as { ano: number; cargo: string; resultado: string | null }[];
  if (linhas.length === 0) continue;
  const eleitos = linhas.filter((l) => l.resultado?.startsWith("ELEITO"));
  trajetoria[candidatura] = {
    desde: Math.min(...linhas.map((l) => l.ano)),
    eleicoes: new Set(linhas.map((l) => l.ano)).size,
    eleito: new Set(eleitos.map((l) => l.ano)).size,
    cargosEleito: [...new Set(eleitos.map((l) => l.cargo.toLowerCase()))].sort(),
  };
}

const hoje = new Date().toISOString().slice(0, 10);
for (const { candidatura, pessoa } of alvos) {
  const linhas = sinais.all(pessoa) as { type: string; severity: Severidade; explanation: string; valor: number; elos: number | null }[];

  const despesas = linhas.filter((l) => l.type === "cheap_item_high_value");
  if (despesas.length > 0) {
    const topo = despesas.reduce((a, b) => (b.valor > a.valor ? b : a));
    const descricao = /descrita como "(.*?)"/.exec(topo.explanation)?.[1] ?? "item barato";
    const vezes = /— (\d+)x a mediana/.exec(topo.explanation)?.[1];
    saida[candidatura] ??= { indicios: [], sancoes: [] };
    entrada(candidatura).indicios.push({
      ...REGRAS.despesa,
      severidade: despesas.map((d) => d.severity).reduce(maior),
      texto:
        `Em campanhas anteriores, ${despesas.length === 1 ? "uma despesa" : `${despesas.length} despesas`} com itens que costumam ser baratos ` +
        `ficaram muito acima do usual. A maior: ${reais(topo.valor)} com “${descricao.toLowerCase()}”` +
        `${vezes ? `, ${vezes} vezes a mediana da categoria` : ""}. Pode ser lote grande, descrição incompleta ou erro de digitação; ` +
        `é só um indício, não prova de irregularidade.`,
      fonte: REPO,
    });
  }

  const ciclos = linhas.filter((l) => l.type === "circular_donation");
  if (ciclos.length > 0) {
    const topo = ciclos.reduce((a, b) => (b.valor > a.valor ? b : a));
    entrada(candidatura).indicios.push({
      ...REGRAS.circular,
      severidade: ciclos.map((d) => d.severity).reduce(maior),
      texto:
        `Em campanhas anteriores, ${ciclos.length === 1 ? "aparece em 1 ciclo" : `aparece em ${ciclos.length} ciclos`} de doações e despesas em que ` +
        `o dinheiro volta ao ponto de partida. O maior: ${topo.elos ?? "vários"} participantes e ${reais(topo.valor)} movimentados. ` +
        `Pode ser coligação ou ressarcimento; é só um indício, não prova de irregularidade.`,
      fonte: REPO,
    });
  }

  for (const s of sociedades.all(pessoa) as { empresa: string; papel: string | null; pago: number; propria: number }[]) {
    entrada(candidatura).indicios.push({
      ...REGRAS.socio,
      severidade: s.propria ? "medium" : "low",
      texto:
        `Um nome e 6 dígitos de CPF iguais aos desta pessoa constam como ${s.papel ? s.papel.toLowerCase() : "sócio"} da empresa ${s.empresa}, ` +
        `que recebeu ${reais(s.pago)} de campanhas${s.propria ? ", inclusive da campanha desta própria pessoa" : ""}. ` +
        `A identidade não está confirmada (o CPF de sócios é publicado mascarado); é só um possível vínculo.`,
      fonte: REPO,
    });
  }

  for (const s of sancoes.all(pessoa) as Record<string, string | null>[]) {
    const encerrada = s.end_date !== null && s.end_date < hoje;
    const periodo = s.start_date ? ` de ${dataBr(s.start_date)}${s.end_date ? ` a ${dataBr(s.end_date)}` : " sem data final"}` : "";
    entrada(candidatura).sancoes.push({
      texto:
        `Consta no cadastro federal de sanções (${s.registry}) com a penalidade “${s.category}”, aplicada por ${s.orgao ?? "órgão não informado"}` +
        `${periodo}${s.processo ? ` (processo ${s.processo})` : ""}.`,
      status: encerrada ? "sanção encerrada" : "sancionado",
      fonte: urlSancao(s.registry!, s.nome!),
      fonteNome: `Portal da Transparência, ${s.registry}`,
    });
  }
}

for (const v of Object.values(saida)) {
  v.indicios.sort((a, b) => ORDEM.indexOf(b.severidade) - ORDEM.indexOf(a.severidade));
}
const completo = Object.fromEntries(Object.entries(saida).filter(([, v]) => v.indicios.length + v.sancoes.length > 0));
writeFileSync(resolve(raiz, "data/research/elosys.json"), JSON.stringify({ geradoEm: hoje, estreantes: estreantes.sort((a, b) => a - b), trajetoria, candidatos: completo }, null, 1) + "\n");
console.log(`${estreantes.length} sem candidatura anterior de 2014 a 2024`);
console.log(
  `${Object.keys(completo).length} candidatos com algo; ${Object.values(completo).reduce((n, v) => n + v.indicios.length, 0)} indícios, ` +
    `${Object.values(completo).reduce((n, v) => n + v.sancoes.length, 0)} sanções`,
);
