// Junta as fontes (TSE, Câmara, pesquisa de partidos e apuração manual com
// fontes) e gera os JSON que o site lê em src/data/. Uso: npm run data:build
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { normalizar, ordenarDireitaParaEsquerda, temAlerta, temIndicio, temVerde } from "../src/lib/candidatos";
import type { Candidato, CargoSlug, Indicio, Motivo, Verde, Partido, Resumo, VotacaoResumo } from "../src/lib/tipos";
import { CARGOS } from "../src/lib/cargos";
import { VOTACOES_CAMARA, urlProposicao } from "./votacoes-camara";

const raiz = resolve(import.meta.dirname, "..");
const ler = (caminho: string): unknown => JSON.parse(readFileSync(resolve(raiz, caminho), "utf8"));

// ---------- esquemas das fontes ----------

const TseCandidato = z.object({
  id: z.number(),
  numero: z.number(),
  nomeUrna: z.string(),
  nomeCompleto: z.string(),
  partido: z.string(),
  situacao: z.string(),
});
type TseCandidato = z.infer<typeof TseCandidato>;
const TseLista = z.record(z.string(), z.array(TseCandidato));

const TseDetalhes = z.record(
  z.string(),
  z.object({ s: z.string().nullable(), ms: z.array(z.string()) }),
);

const TIPOS = ["beneficio_proprio", "imposto", "corrupcao", "justica"] as const;
const TOPICOS_CONTRA = ["favor_aborto", "favor_drogas", "contra_pena_de_morte", "contra_penas_duras"] as const;

const MotivoPesquisa = z.object({
  tipo: z.enum(TIPOS),
  texto: z.string().min(20),
  status: z.string().optional(),
  fonte: z.string().url(),
  fonte_nome: z.string().min(2),
});

const Majoritario = z.object({
  numero: z.number(),
  nomeUrna: z.string(),
  score: z.number().min(0).max(10),
  score_economia: z.number().min(0).max(10),
  score_costumes: z.number().min(0).max(10),
  justificativa: z.string().min(20),
  propostas: z.array(z.object({ texto: z.string(), fonte: z.string().url().nullish() })),
  motivos: z.array(MotivoPesquisa),
  vice_motivos: z.array(MotivoPesquisa).default([]),
  situacao_nota: z.string().nullish(),
});
type Majoritario = z.infer<typeof Majoritario>;

const AlertasProporcionais = z.object({
  candidatos: z.array(z.object({ id: z.number(), motivos: z.array(MotivoPesquisa).min(1) })),
  /** Nomes pesquisados um a um em que nada dentro dos critérios foi achado. */
  verificados_sem_achados: z.array(z.string()),
});

const VotosAlesp = z.object({
  votacoes: z.array(
    z.object({
      chave: z.string(),
      tipo: z.enum(TIPOS),
      descricao: z.string(),
      data: z.string(),
      projeto: z.string(),
      fonte: z.string().url(),
      fonte_nome: z.string(),
      /** Frase pronta para o site; quando falta, usa a descrição. */
      texto: z.string().optional(),
      votaram_sim: z.array(z.object({ nome: z.string(), id: z.number().nullable() })),
    }),
  ),
});

const Partidos = z.object({
  fonte: z.object({ citacao: z.string(), url: z.string().url(), nota: z.string() }),
  partidos: z.record(
    z.string(),
    z.object({
      nome: z.string(),
      nota: z.number().min(0).max(10),
      origem: z.enum(["pesquisa", "fusao", "estimativa"]),
      observacao: z.string().optional(),
    }),
  ),
});

const Elosys = z.object({
  geradoEm: z.string(),
  estreantes: z.array(z.number()),
  trajetoria: z.record(
    z.string(),
    z.object({ desde: z.number(), eleicoes: z.number(), eleito: z.number(), cargosEleito: z.array(z.string()) }),
  ),
  candidatos: z.record(
    z.string(),
    z.object({
      indicios: z.array(
        z.object({
          tipo: z.enum(["despesa_desproporcional", "doacao_circular", "socio_fornecedor"]),
          severidade: z.enum(["low", "medium", "high"]),
          texto: z.string().min(40),
          fonte: z.string().url(),
          fonteNome: z.string().min(2),
        }),
      ),
      sancoes: z.array(z.object({ texto: z.string().min(40), status: z.string(), fonte: z.string().url(), fonteNome: z.string() })),
    }),
  ),
});

const TOPICOS_VERDES = ["pena_de_morte", "penas_mais_duras", "infraestrutura", "seguranca", "contra_aborto", "contra_drogas", "contra_saidinha"] as const;
const PRIVILEGIOS = "contra_privilegios" as const;
const PosicaoVerde = z.object({
  topico: z.enum(TOPICOS_VERDES),
  /** Padrão "candidato"; use "voto" quando a posição é um voto dado. */
  origem: z.enum(["candidato", "voto"]).optional(),
  texto: z.string().min(20),
  fonte: z.string().url(),
  fonte_nome: z.string().min(2),
});
const Posicoes = z.object({
  /** Posição de cada candidato (id do TSE), tirada de plano de governo, projeto ou fala dele. */
  candidatos: z.record(z.string(), z.array(PosicaoVerde)),
  /** Posição oficial de cada partido (sigla), vale para os candidatos que não têm posição própria no assunto. */
  partidos: z.record(z.string(), z.array(PosicaoVerde)),
});

const PosicaoContra = z.object({
  topico: z.enum(TOPICOS_CONTRA),
  texto: z.string().min(20),
  fonte: z.string().url(),
  fonte_nome: z.string().min(2),
});
const PosicoesContra = z.object({
  candidatos: z.record(z.string(), z.array(PosicaoContra)),
  partidos: z.record(z.string(), z.array(PosicaoContra)),
});

const VotosCamara = z.object({
  deputados: z.record(z.string(), z.object({ nome: z.string(), nomeCivil: z.string(), partido: z.string() })),
  votos: z.record(z.string(), z.record(z.string(), z.string())),
});

// ---------- leitura ----------

const tse = TseLista.parse(ler("data/raw/tse-candidatos.json"));
const detalhes = TseDetalhes.parse(ler("data/raw/tse-detalhes.json"));
const partidos = Partidos.parse(ler("data/partidos.json"));
const camara = VotosCamara.parse(ler("data/raw/camara-votos.json"));
const presidente = z.array(Majoritario).parse(ler("data/research/presidente.json"));
const spMajoritarios = z
  .object({ governador: z.array(Majoritario), senador: z.array(Majoritario) })
  .parse(ler("data/research/sp-majoritarios.json"));
const alertasFederal = AlertasProporcionais.parse(ler("data/research/deputado-federal.json"));
const alertasEstadual = AlertasProporcionais.parse(ler("data/research/deputado-estadual.json"));
const alesp = VotosAlesp.parse(ler("data/research/alesp-votos.json"));
const Parentesco = z.object({
  pares: z.array(
    z.object({
      pai: z.number(),
      filho: z.number(),
      relacao: z.enum(["pai", "mãe"]),
      fonte: z.string().url(),
      fonte_nome: z.string().min(2),
    }),
  ),
});
const parentesco = Parentesco.parse(ler("data/research/parentesco.json"));
const posicoesContra = PosicoesContra.parse(ler("data/research/posicoes-contra.json"));
const posicoes = Posicoes.parse(ler("data/research/posicoes.json"));
const elosys = Elosys.parse(ler("data/research/elosys.json"));
// Deputados federais cujo nome civil na Câmara difere do registrado no TSE:
// id na Câmara → id da candidatura no TSE.
const apelidosCamara = z.record(z.string(), z.number()).parse(ler("data/camara-para-tse.json"));

// ---------- motivos por candidato ----------

const motivosPorId = new Map<number, Motivo[]>();
function acrescentar(id: number, motivo: Motivo) {
  const lista = motivosPorId.get(id) ?? [];
  if (!lista.some((m) => m.texto === motivo.texto)) lista.push(motivo);
  motivosPorId.set(id, lista);
}

const dePesquisa = (m: z.infer<typeof MotivoPesquisa>): Motivo => ({
  tipo: m.tipo,
  texto: m.texto,
  ...(m.status && m.status !== "fato" ? { status: m.status } : {}),
  fonte: m.fonte,
  fonteNome: m.fonte_nome,
});

const CARGOS_TSE: Record<CargoSlug, { chave: string; chaveVice?: string; uf: string }> = {
  presidente: { chave: "pres", chaveVice: "vice", uf: "BR" },
  governador: { chave: "gov", chaveVice: "vgov", uf: "SP" },
  senador: { chave: "sen", uf: "SP" },
  "deputado-federal": { chave: "fed", uf: "SP" },
  "deputado-estadual": { chave: "est", uf: "SP" },
};

const todos = Object.values(CARGOS_TSE).flatMap((c) => tse[c.chave]);
const idsValidos = new Set(todos.map((c) => c.id));

// 1. Votações nominais da Câmara
const porNomeCompleto = new Map<string, TseCandidato[]>();
for (const c of todos) {
  const chave = normalizar(c.nomeCompleto);
  porNomeCompleto.set(chave, [...(porNomeCompleto.get(chave) ?? []), c]);
}
const naoCandidatos: string[] = [];
// Quem votou "Não" nas votações de privilégio (aumento do próprio salário, blindagem...) e nunca "Sim".
const votouContra = new Map<number, { texto: string; fonte: string; fonteNome: string }[]>();
const votouAFavor = new Set<number>();
for (const [idCamara, deputado] of Object.entries(camara.deputados)) {
  const alvo = apelidosCamara[idCamara]
    ? todos.filter((c) => c.id === apelidosCamara[idCamara])
    : (porNomeCompleto.get(normalizar(deputado.nomeCivil)) ?? []);
  if (alvo.length === 0) {
    naoCandidatos.push(deputado.nome);
    continue;
  }
  for (const candidato of alvo) {
    for (const votacao of VOTACOES_CAMARA.filter((v) => v.tipo === "beneficio_proprio")) {
      const voto = camara.votos[votacao.chave]?.[idCamara];
      if (voto === votacao.votoAlerta) votouAFavor.add(candidato.id);
      else if (voto === "Não") {
        if (!votacao.texto.startsWith("Votou a favor")) throw new Error(`${votacao.chave}: texto não começa com "Votou a favor"`);
        votouContra.set(candidato.id, [
          ...(votouContra.get(candidato.id) ?? []),
          {
            texto: votacao.texto.replace(/^Votou a favor (da|do|de) /, (_, art: string) => `Votou contra ${art === "da" ? "a " : art === "do" ? "o " : ""}`),
            fonte: urlProposicao(votacao.idProposicao),
            fonteNome: `Câmara dos Deputados, votação nominal do ${votacao.projeto}`,
          },
        ]);
      }
    }
  }
  for (const votacao of VOTACOES_CAMARA) {
    if (camara.votos[votacao.chave]?.[idCamara] !== votacao.votoAlerta) continue;
    for (const candidato of alvo) {
      acrescentar(candidato.id, {
        tipo: votacao.tipo,
        texto: votacao.texto,
        fonte: urlProposicao(votacao.idProposicao),
        fonteNome: `Câmara dos Deputados, votação nominal do ${votacao.projeto}`,
      });
    }
  }
}

// 2. Votações nominais da Assembleia Legislativa de SP
for (const votacao of alesp.votacoes) {
  for (const voto of votacao.votaram_sim) {
    if (voto.id === null) continue;
    if (!idsValidos.has(voto.id)) throw new Error(`ALESP ${votacao.chave}: id ${voto.id} não é candidato`);
    acrescentar(voto.id, {
      tipo: votacao.tipo,
      texto: votacao.texto ?? votacao.descricao,
      fonte: votacao.fonte,
      fonteNome: votacao.fonte_nome,
    });
  }
}

// 3. Apuração com fontes (deputados)
for (const arquivo of [alertasFederal, alertasEstadual]) {
  for (const item of arquivo.candidatos) {
    if (!idsValidos.has(item.id)) throw new Error(`Apuração: id ${item.id} não é candidato`);
    for (const m of item.motivos) acrescentar(item.id, dePesquisa(m));
  }
}

// 4. Registro negado por inelegibilidade (dado oficial do TSE)
const INELEGIBILIDADE = "Inelegibilidade infraconstitucional(LC 64/90)";
const urlTse = (uf: string, id: number) =>
  `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2026/20322002026/${uf}/${id}`;
for (const [slug, cargo] of Object.entries(CARGOS_TSE)) {
  for (const c of tse[cargo.chave]) {
    if (!detalhes[String(c.id)]?.ms.includes(INELEGIBILIDADE)) continue;
    const recurso = c.situacao.includes("recurso") ? " Ainda cabe recurso." : "";
    acrescentar(c.id, {
      tipo: "justica",
      texto: `A Justiça Eleitoral negou o registro desta candidatura por inelegibilidade (Lei Complementar 64/90, a lei que inclui a Ficha Limpa).${recurso}`,
      status: recurso ? "registro negado, com recurso" : "registro negado",
      fonte: urlTse(cargo.uf, c.id),
      fonteNome: `TSE, DivulgaCand (${slug})`,
    });
  }
}

// 5. Sanções federais (CEIS/CNEP, via EloSys): dado oficial, entra em vermelho
for (const [id, item] of Object.entries(elosys.candidatos)) {
  if (!idsValidos.has(Number(id))) continue;
  for (const s of item.sancoes) {
    acrescentar(Number(id), { tipo: "justica", texto: s.texto, status: s.status, fonte: s.fonte, fonteNome: s.fonteNome });
  }
}
const estreantes = new Set(elosys.estreantes);
const indiciosPorId = new Map<number, Indicio[]>(
  Object.entries(elosys.candidatos)
    .filter(([, v]) => v.indicios.length > 0)
    .map(([id, v]) => [Number(id), v.indicios]),
);

const deVerde = (origem: Verde["origem"]) => (p: z.infer<typeof PosicaoVerde>): Verde => ({
  topico: p.topico,
  origem: p.origem ?? origem,
  texto: p.texto,
  fonte: p.fonte,
  fonteNome: p.fonte_nome,
});
for (const id of Object.keys(posicoes.candidatos)) {
  if (!idsValidos.has(Number(id))) throw new Error(`Posições: id ${id} não é candidato`);
}
/** Cada posição contrária anula o selo verde do assunto oposto, e vice-versa. */
const OPOSTOS: Record<(typeof TOPICOS_CONTRA)[number], string[]> = {
  favor_aborto: ["contra_aborto"],
  favor_drogas: ["contra_drogas"],
  contra_pena_de_morte: ["pena_de_morte"],
  contra_penas_duras: ["penas_mais_duras", "contra_saidinha"],
};
const contraDe = (verde: string) => TOPICOS_CONTRA.find((t) => OPOSTOS[t].includes(verde));

/** Vermelho por posição contrária: a própria vale mais; a do partido só entra se a pessoa não disse o contrário. */
function contrasDe(id: number, partido: string): Motivo[] {
  const proprias = posicoesContra.candidatos[String(id)] ?? [];
  const verdesProprios = new Set((posicoes.candidatos[String(id)] ?? []).map((v) => v.topico));
  const temos = new Set(proprias.map((p) => p.topico));
  const doPartido = (posicoesContra.partidos[partido] ?? []).filter(
    (p) => !temos.has(p.topico) && !OPOSTOS[p.topico].some((v) => verdesProprios.has(v as never)),
  );
  const motivo = (status: string) => (p: z.infer<typeof PosicaoContra>): Motivo => ({
    tipo: "posicao",
    texto: p.texto,
    status,
    fonte: p.fonte,
    fonteNome: p.fonte_nome,
  });
  return [...proprias.map(motivo("posição própria")), ...doPartido.map(motivo("posição do partido"))];
}

/** Posição própria vale mais que a do partido: o partido só entra nos assuntos em que o candidato não tem nada. */
function verdesDe(id: number, partido: string): Verde[] {
  const proprios = (posicoes.candidatos[String(id)] ?? []).map(deVerde("candidato"));
  const contra = votouContra.get(id);
  if (contra && !votouAFavor.has(id)) {
    proprios.push({
      topico: PRIVILEGIOS,
      origem: "voto",
      texto: `${contra.map((c) => c.texto).join(" ")} Nunca votou a favor de nenhuma das votações de privilégio que contamos.`,
      fonte: contra[0].fonte,
      fonteNome: contra[0].fonteNome,
    });
  }
  const temos = new Set(proprios.map((v) => v.topico));
  const contrariados = new Set((posicoesContra.candidatos[String(id)] ?? []).map((c) => c.topico));
  const doPartido = (posicoes.partidos[partido] ?? [])
    .filter((p) => !temos.has(p.topico) && !(contraDe(p.topico) && contrariados.has(contraDe(p.topico)!)))
    .map(deVerde("partido"));
  return [...proprios, ...doPartido];
}

// ---------- montagem por cargo ----------

const majoritarios: Partial<Record<CargoSlug, Majoritario[]>> = {
  presidente,
  governador: spMajoritarios.governador,
  senador: spMajoritarios.senador,
};

function notaDoPartido(sigla: string): number {
  const partido = partidos.partidos[sigla];
  if (!partido) throw new Error(`Partido sem nota: ${sigla}`);
  return partido.nota;
}

// Candidaturas que saíram da disputa (renúncia ou pedido repetido) não entram.
const SAIU = ["Renúncia", "Pedido não conhecido"];

function montar(slug: CargoSlug): Candidato[] {
  const cargo = CARGOS_TSE[slug];
  const pesquisa = majoritarios[slug];
  const usados = new Set<Majoritario>();
  const lista = tse[cargo.chave]
    .filter((c) => !SAIU.includes(c.situacao))
    .map((c): Candidato => {
      const naUrna = detalhes[String(c.id)]?.s !== "Não consta da urna";
      const analise = pesquisa?.find(
        (p) => p.numero === c.numero && normalizar(p.nomeUrna) === normalizar(c.nomeUrna),
      );
      if (pesquisa && !analise) throw new Error(`${slug}: falta análise de ${c.numero} ${c.nomeUrna}`);
      if (analise) {
        usados.add(analise);
        for (const m of analise.motivos) acrescentar(c.id, dePesquisa(m));
      }
      const vice = cargo.chaveVice
        ? tse[cargo.chaveVice].find(
            (v) =>
              v.numero === c.numero &&
              !SAIU.includes(v.situacao) &&
              (detalhes[String(v.id)]?.s !== "Não consta da urna") === naUrna &&
              normalizar(v.nomeCompleto) !== normalizar(c.nomeCompleto),
          )
        : undefined;
      const motivosVice = [...(analise?.vice_motivos.map(dePesquisa) ?? []), ...(vice ? (motivosPorId.get(vice.id) ?? []) : [])];
      return {
        id: c.id,
        numero: c.numero,
        nome: c.nomeUrna,
        nomeCompleto: c.nomeCompleto,
        partido: c.partido,
        nota: analise ? analise.score : notaDoPartido(c.partido),
        origemNota: analise ? "analise" : "partido",
        situacao: c.situacao,
        naUrna,
        motivos: [...(motivosPorId.get(c.id) ?? []), ...contrasDe(c.id, c.partido)],
        ...(indiciosPorId.has(c.id) ? { indicios: indiciosPorId.get(c.id) } : {}),
        ...(estreantes.has(c.id) ? { estreante: true } : {}),
        ...(elosys.trajetoria[String(c.id)] ? { trajetoria: elosys.trajetoria[String(c.id)] } : {}),
        ...(verdesDe(c.id, c.partido).length > 0 ? { verdes: verdesDe(c.id, c.partido) } : {}),
        ...(vice ? { vice: vice.nomeUrna } : {}),
        ...(vice && motivosVice.length > 0 ? { motivosVice } : {}),
        ...(analise
          ? {
              justificativa: analise.justificativa,
              propostas: analise.propostas.map((p) => ({ texto: p.texto, ...(p.fonte ? { fonte: p.fonte } : {}) })),
              notaEconomia: analise.score_economia,
              notaCostumes: analise.score_costumes,
              ...(analise.situacao_nota ? { observacao: analise.situacao_nota } : {}),
            }
          : {}),
      };
    });
  if (pesquisa && usados.size !== pesquisa.length) throw new Error(`${slug}: análise sem candidato correspondente`);
  return ordenarDireitaParaEsquerda(lista);
}

const slugs = Object.keys(CARGOS_TSE) as CargoSlug[];
const cargos = slugs.map((slug) => ({ slug, candidatos: montar(slug) }));

// Pai ou mãe de candidato em vermelho ou amarelo fica amarelo. Só conta o alerta próprio do filho:
// o amarelo de parentesco não passa de geração em geração.
const porId = new Map(cargos.flatMap((c) => c.candidatos.map((x) => [x.id, { candidato: x, cargo: c.slug }] as const)));
const alertaProprio = new Set([...porId.values()].filter(({ candidato }) => temAlerta(candidato) || temIndicio(candidato)).map(({ candidato }) => candidato.id));
for (const par of parentesco.pares) {
  const pai = porId.get(par.pai);
  const filho = porId.get(par.filho);
  if (!pai || !filho) throw new Error(`Parentesco: id ${par.pai} ou ${par.filho} não é candidato`);
  if (!alertaProprio.has(par.filho)) continue;
  const cor = temAlerta(filho.candidato) ? "vermelho" : "amarelo";
  const cargoFilho = CARGOS.find((c) => c.slug === filho.cargo)?.tituloCurto.toLowerCase();
  (pai.candidato.indicios ??= []).push({
    tipo: "parentesco",
    severidade: "low",
    texto:
      `${par.relacao === "mãe" ? "É mãe" : "É pai"} de ${filho.candidato.nome} (nº ${filho.candidato.numero}, ${filho.candidato.partido}), ` +
      `também candidato(a) a ${cargoFilho}, que aparece em ${cor} neste site. O parentesco, por si só, não diz nada sobre ` +
      `este candidato; fica como aviso para quem quer olhar a família toda.`,
    fonte: par.fonte,
    fonteNome: par.fonte_nome,
  });
}

for (const cargo of cargos) {
  writeFileSync(resolve(raiz, `src/data/${cargo.slug}.json`), JSON.stringify(cargo) + "\n");
}

const votacoes: VotacaoResumo[] = [
  ...VOTACOES_CAMARA.map(
    (v): VotacaoResumo => ({
      chave: v.chave,
      tipo: v.tipo,
      projeto: v.projeto,
      data: v.data,
      votoAlerta: v.votoAlerta,
      texto: v.texto,
      fonte: urlProposicao(v.idProposicao),
      casa: "Câmara dos Deputados",
    }),
  ),
  ...alesp.votacoes.map(
    (v): VotacaoResumo => ({
      chave: v.chave,
      tipo: v.tipo,
      projeto: v.projeto,
      data: v.data,
      votoAlerta: "Sim",
      texto: v.texto ?? v.descricao,
      fonte: v.fonte,
      casa: "Assembleia Legislativa de SP",
    }),
  ),
];

const usadosNoSite = new Set(cargos.flatMap((c) => c.candidatos.map((x) => x.partido)));
const listaPartidos: Partido[] = Object.entries(partidos.partidos)
  .filter(([sigla]) => usadosNoSite.has(sigla))
  .map(([sigla, p]) => ({ sigla, ...p }))
  .sort((a, b) => b.nota - a.nota);

const resumo: Resumo = {
  geradoEm: new Date().toISOString().slice(0, 10),
  cargos: cargos.map((c) => {
    const naUrna = c.candidatos.filter((x) => x.naUrna);
    return {
      slug: c.slug,
      total: naUrna.length,
      comAlerta: naUrna.filter(temAlerta).length,
      soIndicio: naUrna.filter((x) => !temAlerta(x) && temIndicio(x)).length,
      comVerde: naUrna.filter(temVerde).length,
    };
  }),
  pesquisados: {
    "deputado-federal": alertasFederal.candidatos.length + alertasFederal.verificados_sem_achados.length,
    "deputado-estadual": alertasEstadual.candidatos.length + alertasEstadual.verificados_sem_achados.length,
  },
  partidos: listaPartidos,
  fontePartidos: partidos.fonte,
  votacoes,
};
writeFileSync(resolve(raiz, "src/data/resumo.json"), JSON.stringify(resumo, null, 1) + "\n");

for (const c of resumo.cargos) console.log(`${c.slug}: ${c.total} na urna, ${c.comAlerta} com alerta, ${c.soIndicio} só com indício, ${c.comVerde} com verde`);
console.log(`Deputados de SP nas votações que não são candidatos: ${naoCandidatos.sort().join(", ")}`);
