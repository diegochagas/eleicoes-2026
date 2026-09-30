export type CargoSlug =
  | "presidente"
  | "governador"
  | "senador"
  | "deputado-federal"
  | "deputado-estadual";

export type TipoMotivo = "beneficio_proprio" | "imposto" | "corrupcao" | "justica";

export interface Motivo {
  tipo: TipoMotivo;
  /** Frase factual, em português simples. */
  texto: string;
  /** Situação atual do caso (réu, condenado, arquivado...) quando se aplica. */
  status?: string;
  fonte: string;
  fonteNome: string;
}

export interface Proposta {
  texto: string;
  fonte?: string;
}

/** De onde veio a nota de posição: análise individual ou nota do partido. */
export type OrigemNota = "analise" | "partido";

export interface Candidato {
  id: number;
  numero: number;
  /** Nome que aparece na urna. */
  nome: string;
  nomeCompleto: string;
  partido: string;
  /** 0 = mais à esquerda, 10 = mais à direita. */
  nota: number;
  origemNota: OrigemNota;
  /** Situação do registro no TSE (Deferido, Indeferido com recurso...). */
  situacao: string;
  /** Falso quando o TSE informa que o nome não vai para a urna. */
  naUrna: boolean;
  motivos: Motivo[];
  vice?: string;
  motivosVice?: Motivo[];
  justificativa?: string;
  propostas?: Proposta[];
  notaEconomia?: number;
  notaCostumes?: number;
  observacao?: string;
}

export interface DadosCargo {
  slug: CargoSlug;
  candidatos: Candidato[];
}

export interface Partido {
  sigla: string;
  nome: string;
  nota: number;
  origem: "pesquisa" | "fusao" | "estimativa";
  observacao?: string;
}

export interface ResumoCargo {
  slug: CargoSlug;
  total: number;
  comAlerta: number;
}

export interface VotacaoResumo {
  chave: string;
  tipo: TipoMotivo;
  projeto: string;
  data: string;
  votoAlerta: string;
  texto: string;
  fonte: string;
  casa: "Câmara dos Deputados" | "Assembleia Legislativa de SP";
}

export interface Resumo {
  geradoEm: string;
  cargos: ResumoCargo[];
  /** Quantos candidatos a deputado tiveram a vida pública pesquisada um a um. */
  pesquisados: { "deputado-federal": number; "deputado-estadual": number };
  partidos: Partido[];
  fontePartidos: { citacao: string; url: string; nota: string };
  votacoes: VotacaoResumo[];
}
