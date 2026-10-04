import type { Candidato, OrigemVerde, TipoIndicio, TipoMotivo, TopicoVerde } from "./tipos";

/** Minúsculas e sem acentos, para busca e para casar nomes entre fontes. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function temAlerta(candidato: Pick<Candidato, "motivos">): boolean {
  return candidato.motivos.length > 0;
}

export function temIndicio(candidato: Pick<Candidato, "indicios">): boolean {
  return (candidato.indicios?.length ?? 0) > 0;
}

/** Da direita para a esquerda; empate se resolve pelo número da urna. */
export function ordenarDireitaParaEsquerda<T extends Pick<Candidato, "nota" | "numero" | "id">>(
  candidatos: readonly T[],
): T[] {
  return [...candidatos].sort((a, b) => b.nota - a.nota || a.numero - b.numero || a.id - b.id);
}

export type FiltroAlerta = "todos" | "com" | "indicio" | "sem";

export interface Filtro {
  busca: string;
  partido: string;
  alerta: FiltroAlerta;
  /** Vazio = qualquer; senão só quem tem selo verde neste assunto. */
  verde: TopicoVerde | "";
  /** Só quem nunca tinha sido candidato. */
  soEstreantes: boolean;
  mostrarForaDaUrna: boolean;
}

export const FILTRO_INICIAL: Filtro = {
  busca: "",
  partido: "",
  alerta: "todos",
  verde: "",
  soEstreantes: false,
  mostrarForaDaUrna: false,
};

export function filtrar(candidatos: readonly Candidato[], filtro: Filtro): Candidato[] {
  const busca = normalizar(filtro.busca);
  return candidatos.filter((c) => {
    if (!filtro.mostrarForaDaUrna && !c.naUrna) return false;
    if (filtro.partido && c.partido !== filtro.partido) return false;
    if (filtro.alerta === "com" && !temAlerta(c)) return false;
    if (filtro.alerta === "indicio" && !temIndicio(c)) return false;
    if (filtro.alerta === "sem" && (temAlerta(c) || temIndicio(c))) return false;
    if (filtro.soEstreantes && !c.estreante) return false;
    if (filtro.verde && !c.verdes?.some((v) => v.topico === filtro.verde)) return false;
    if (!busca) return true;
    return (
      String(c.numero).startsWith(busca) ||
      normalizar(c.nome).includes(busca) ||
      normalizar(c.nomeCompleto).includes(busca)
    );
  });
}

export function partidosDe(candidatos: readonly Candidato[]): string[] {
  return [...new Set(candidatos.map((c) => c.partido))].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export const ROTULO_VERDE: Record<TopicoVerde, { rotulo: string; emoji: string }> = {
  pena_de_morte: { rotulo: "A favor da pena de morte", emoji: "⚖️" },
  penas_mais_duras: { rotulo: "Penas mais duras para crimes hediondos", emoji: "🔒" },
  infraestrutura: { rotulo: "Obras: estradas, saneamento e espaços públicos", emoji: "🚧" },
  seguranca: { rotulo: "Mais segurança pública", emoji: "🛡️" },
  contra_aborto: { rotulo: "Contra o aborto", emoji: "👶" },
  contra_drogas: { rotulo: "Contra as drogas", emoji: "🚫" },
  contra_saidinha: { rotulo: "Contra a saidinha dos presos", emoji: "🚷" },
  contra_privilegios: { rotulo: "Votou contra privilégios de políticos", emoji: "🗳️" },
};

export const ROTULO_ORIGEM_VERDE: Record<OrigemVerde, string> = {
  candidato: "posição do próprio candidato",
  voto: "voto dado por ele",
  partido: "posição oficial do partido",
};

export const TOPICOS_VERDES = Object.keys(ROTULO_VERDE) as TopicoVerde[];

export function temVerde(candidato: Pick<Candidato, "verdes">): boolean {
  return (candidato.verdes?.length ?? 0) > 0;
}

/** Nome em verde: tem selo verde e nenhum alerta (vermelho ou amarelo). */
export function nomeEmVerde(c: Pick<Candidato, "motivos" | "indicios" | "verdes">): boolean {
  return !temAlerta(c) && !temIndicio(c) && temVerde(c);
}

export const ROTULO_INDICIO: Record<TipoIndicio, { rotulo: string; emoji: string }> = {
  despesa_desproporcional: { rotulo: "Gasto de campanha muito acima do usual", emoji: "🧮" },
  doacao_circular: { rotulo: "Dinheiro de campanha que volta ao início", emoji: "🔄" },
  parentesco: { rotulo: "Filho(a) também candidato(a) com alerta", emoji: "👪" },
  socio_fornecedor: { rotulo: "Possível sócio de fornecedor de campanha", emoji: "🏢" },
};

export const ROTULO_MOTIVO: Record<TipoMotivo, { rotulo: string; emoji: string }> = {
  beneficio_proprio: { rotulo: "Vantagem para os próprios políticos", emoji: "💰" },
  imposto: { rotulo: "Mais imposto", emoji: "🧾" },
  corrupcao: { rotulo: "Dinheiro público sob suspeita", emoji: "🚨" },
  justica: { rotulo: "Problema com a Justiça", emoji: "⚖️" },
  posicao: { rotulo: "Posição contrária ao que você procura", emoji: "🙅" },
};
