import type { CargoSlug } from "./tipos";

export interface InfoCargo {
  slug: CargoSlug;
  titulo: string;
  tituloCurto: string;
  emoji: string;
  /** O que a pessoa eleita faz, em uma frase simples. */
  oQueFaz: string;
  digitos: number;
  /** Quantos votos a pessoa dá neste cargo (2 para senador em 2026). */
  vagas: number;
  /** Posição do voto na urna eletrônica em 2026. */
  ordemNaUrna: number;
  /** Classes de cor do cartão e da aba. */
  cor: string;
  dica?: string;
}

const CARGOS_SEM_ORDEM: InfoCargo[] = [
  {
    slug: "presidente",
    titulo: "Presidente do Brasil",
    tituloCurto: "Presidente",
    emoji: "🇧🇷",
    oQueFaz: "Cuida do Brasil inteiro.",
    digitos: 2,
    vagas: 1,
    ordemNaUrna: 6,
    cor: "from-emerald-400 to-teal-500",
  },
  {
    slug: "governador",
    titulo: "Governador de São Paulo",
    tituloCurto: "Governador",
    emoji: "🏛️",
    oQueFaz: "Cuida do estado de São Paulo.",
    digitos: 2,
    vagas: 1,
    ordemNaUrna: 5,
    cor: "from-amber-300 to-orange-400",
  },
  {
    slug: "senador",
    titulo: "Senador por São Paulo",
    tituloCurto: "Senador",
    emoji: "📜",
    oQueFaz: "Representa São Paulo no Senado, em Brasília.",
    digitos: 3,
    vagas: 2,
    ordemNaUrna: 3,
    cor: "from-sky-400 to-indigo-500",
    dica: "Em 2026 você vota em 2 senadores diferentes.",
  },
  {
    slug: "deputado-federal",
    titulo: "Deputado federal por São Paulo",
    tituloCurto: "Deputado federal",
    emoji: "🏢",
    oQueFaz: "Faz as leis do Brasil, em Brasília.",
    digitos: 4,
    vagas: 1,
    ordemNaUrna: 1,
    cor: "from-fuchsia-400 to-pink-500",
  },
  {
    slug: "deputado-estadual",
    titulo: "Deputado estadual de São Paulo",
    tituloCurto: "Deputado estadual",
    emoji: "🏠",
    oQueFaz: "Faz as leis do estado de São Paulo.",
    digitos: 5,
    vagas: 1,
    ordemNaUrna: 2,
    cor: "from-lime-300 to-green-500",
  },
];

/** Na ordem em que se vota na urna: deputado federal primeiro, presidente por último. */
export const CARGOS: InfoCargo[] = [...CARGOS_SEM_ORDEM].sort((a, b) => a.ordemNaUrna - b.ordemNaUrna);

export function infoDoCargo(slug: string): InfoCargo | undefined {
  return CARGOS.find((c) => c.slug === slug);
}
