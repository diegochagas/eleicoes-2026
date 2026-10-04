export type CargoSlug =
  | "presidente"
  | "governador"
  | "senador"
  | "deputado-federal"
  | "deputado-estadual";

export type TipoMotivo = "beneficio_proprio" | "imposto" | "corrupcao" | "justica" | "posicao";

export interface Motivo {
  tipo: TipoMotivo;
  /** Frase factual, em português simples. */
  texto: string;
  /** Situação atual do caso (réu, condenado, arquivado...) quando se aplica. */
  status?: string;
  fonte: string;
  fonteNome: string;
}

export type TipoIndicio = "despesa_desproporcional" | "doacao_circular" | "socio_fornecedor" | "parentesco";

/** Sinal automático do EloSys: um indício para conferir, não uma acusação. Deixa o nome em amarelo. */
export interface Indicio {
  tipo: TipoIndicio;
  severidade: "low" | "medium" | "high";
  texto: string;
  fonte: string;
  fonteNome: string;
}

export type TopicoVerde =
  | "pena_de_morte"
  | "penas_mais_duras"
  | "infraestrutura"
  | "seguranca"
  | "contra_aborto"
  | "contra_drogas"
  | "contra_saidinha"
  | "contra_privilegios";

/** De onde vem a posição: do próprio candidato, de voto dele no Legislativo ou do programa do partido. */
export type OrigemVerde = "candidato" | "voto" | "partido";

/** Posição que combina com o que o dono do site procura. Fica como selo verde, separado de vermelho e amarelo. */
export interface Verde {
  topico: TopicoVerde;
  origem: OrigemVerde;
  texto: string;
  fonte: string;
  fonteNome: string;
}

export interface Trajetoria {
  /** Primeiro ano com candidatura registrada; 2014 é o limite da base, então pode ser mais antigo. */
  desde: number;
  /** Eleições disputadas de 2014 a 2024 (anos distintos). */
  eleicoes: number;
  /** Eleições em que foi eleito. */
  eleito: number;
  cargosEleito: string[];
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
  indicios?: Indicio[];
  verdes?: Verde[];
  /** Sem nenhuma candidatura registrada de 2014 a 2024 (dados do TSE via EloSys). */
  estreante?: boolean;
  /** Tempo de política segundo os registros do TSE de 2014 a 2024. */
  trajetoria?: Trajetoria;
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
  /** Candidatos sem motivo vermelho, mas com ao menos um indício (amarelo). */
  soIndicio: number;
  /** Candidatos com ao menos um selo verde. */
  comVerde: number;
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
