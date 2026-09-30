import type { Candidato, TipoMotivo } from "./tipos";

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

/** Da direita para a esquerda; empate se resolve pelo número da urna. */
export function ordenarDireitaParaEsquerda<T extends Pick<Candidato, "nota" | "numero" | "id">>(
  candidatos: readonly T[],
): T[] {
  return [...candidatos].sort((a, b) => b.nota - a.nota || a.numero - b.numero || a.id - b.id);
}

export type FiltroAlerta = "todos" | "com" | "sem";

export interface Filtro {
  busca: string;
  partido: string;
  alerta: FiltroAlerta;
  mostrarForaDaUrna: boolean;
}

export const FILTRO_INICIAL: Filtro = {
  busca: "",
  partido: "",
  alerta: "todos",
  mostrarForaDaUrna: false,
};

export function filtrar(candidatos: readonly Candidato[], filtro: Filtro): Candidato[] {
  const busca = normalizar(filtro.busca);
  return candidatos.filter((c) => {
    if (!filtro.mostrarForaDaUrna && !c.naUrna) return false;
    if (filtro.partido && c.partido !== filtro.partido) return false;
    if (filtro.alerta === "com" && !temAlerta(c)) return false;
    if (filtro.alerta === "sem" && temAlerta(c)) return false;
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

export const ROTULO_MOTIVO: Record<TipoMotivo, { rotulo: string; emoji: string }> = {
  beneficio_proprio: { rotulo: "Vantagem para os próprios políticos", emoji: "💰" },
  imposto: { rotulo: "Mais imposto", emoji: "🧾" },
  corrupcao: { rotulo: "Dinheiro público sob suspeita", emoji: "🚨" },
  justica: { rotulo: "Problema com a Justiça", emoji: "⚖️" },
};
