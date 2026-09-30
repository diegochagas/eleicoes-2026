// Faixas da régua direita–esquerda. Os limites são os da pesquisa com
// cientistas políticos (Bolognesi, Ribeiro, Codato e Silva, 2025). O vermelho
// fica fora da paleta de propósito: ele é reservado para os alertas.

export type ChaveFaixa =
  | "bem-direita"
  | "direita"
  | "centro-direita"
  | "centro"
  | "centro-esquerda"
  | "esquerda"
  | "bem-esquerda";

export interface Faixa {
  chave: ChaveFaixa;
  rotulo: string;
  /** Nota mínima (inclusive) para cair na faixa. */
  minimo: number;
  cor: string;
  corTexto: string;
}

// Da direita para a esquerda, na ordem em que o site lista.
export const FAIXAS: Faixa[] = [
  { chave: "bem-direita", rotulo: "Bem à direita", minimo: 8.51, cor: "#1e3a8a", corTexto: "#ffffff" },
  { chave: "direita", rotulo: "Direita", minimo: 7.01, cor: "#2563eb", corTexto: "#ffffff" },
  { chave: "centro-direita", rotulo: "Centro-direita", minimo: 5.51, cor: "#7dd3fc", corTexto: "#0c4a6e" },
  { chave: "centro", rotulo: "Centro", minimo: 4.5, cor: "#86efac", corTexto: "#14532d" },
  { chave: "centro-esquerda", rotulo: "Centro-esquerda", minimo: 3.01, cor: "#d8b4fe", corTexto: "#581c87" },
  { chave: "esquerda", rotulo: "Esquerda", minimo: 1.51, cor: "#9333ea", corTexto: "#ffffff" },
  { chave: "bem-esquerda", rotulo: "Bem à esquerda", minimo: 0, cor: "#581c87", corTexto: "#ffffff" },
];

export function faixaDaNota(nota: number): Faixa {
  return FAIXAS.find((f) => nota >= f.minimo) ?? FAIXAS[FAIXAS.length - 1];
}
