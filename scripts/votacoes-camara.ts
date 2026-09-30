// Votações nominais da Câmara dos Deputados usadas como "motivo de alerta".
// Só entram votações com registro oficial de voto por deputado.
// `votoAlerta` é o voto que gera o alerta (nem sempre é "Sim").

export type TipoMotivo = "beneficio_proprio" | "imposto" | "corrupcao" | "justica";

export interface VotacaoCamara {
  chave: string;
  tipo: TipoMotivo;
  idVotacao: string;
  idProposicao: number;
  projeto: string;
  data: string;
  votoAlerta: "Sim" | "Não";
  /** Frase simples mostrada no site para quem deu o voto de alerta. */
  texto: string;
}

export const VOTACOES_CAMARA: VotacaoCamara[] = [
  {
    chave: "salario-2022",
    tipo: "beneficio_proprio",
    idVotacao: "2344790-8",
    idProposicao: 2344711,
    projeto: "PDL 471/2022",
    data: "2022-12-20",
    votoAlerta: "Sim",
    texto:
      "Votou a favor da urgência do projeto que aumentou o salário dos próprios deputados, dos senadores, do presidente e dos ministros (dezembro de 2022).",
  },
  {
    chave: "ficha-limpa-2023",
    tipo: "beneficio_proprio",
    idVotacao: "2387067-33",
    idProposicao: 2387067,
    projeto: "PLP 192/2023",
    data: "2023-09-14",
    votoAlerta: "Sim",
    texto:
      "Votou a favor do projeto que encurta o tempo em que políticos condenados ficam proibidos de se candidatar (mudança na Lei da Ficha Limpa, setembro de 2023).",
  },
  {
    chave: "anistia-partidos-2024",
    tipo: "beneficio_proprio",
    idVotacao: "2352476-149",
    idProposicao: 2352476,
    projeto: "PEC 9/2023",
    data: "2024-07-11",
    votoAlerta: "Sim",
    texto:
      "Votou a favor da PEC que perdoou multas dos partidos que não cumpriram as cotas de dinheiro para candidaturas de mulheres e de pessoas negras (julho de 2024).",
  },
  {
    chave: "mais-deputados-2025",
    tipo: "beneficio_proprio",
    idVotacao: "2383019-54",
    idProposicao: 2383019,
    projeto: "PLP 177/2023",
    data: "2025-05-06",
    votoAlerta: "Sim",
    texto:
      "Votou a favor de aumentar o número de deputados federais de 513 para 531 (maio de 2025).",
  },
  {
    chave: "blindagem-2025",
    tipo: "beneficio_proprio",
    idVotacao: "2270800-135",
    idProposicao: 2270800,
    projeto: "PEC 3/2021",
    data: "2025-09-16",
    votoAlerta: "Sim",
    texto:
      "Votou a favor da “PEC da Blindagem”, que dificultava processar e prender deputados e senadores (setembro de 2025).",
  },
  {
    chave: "offshores-2023",
    tipo: "imposto",
    idVotacao: "2383287-43",
    idProposicao: 2383287,
    projeto: "PL 4173/2023",
    data: "2023-10-25",
    votoAlerta: "Sim",
    texto:
      "Votou a favor de criar a cobrança de imposto sobre fundos exclusivos e investimentos no exterior (offshores) (outubro de 2023).",
  },
  {
    chave: "iof-2025",
    tipo: "imposto",
    idVotacao: "2515648-44",
    idProposicao: 2515648,
    projeto: "PDL 214/2025",
    data: "2025-06-25",
    votoAlerta: "Não",
    texto:
      "Votou para manter o aumento do IOF (imposto sobre operações financeiras) decretado pelo governo — votou contra derrubar o aumento (junho de 2025).",
  },
  {
    chave: "mp-1303-2025",
    tipo: "imposto",
    idVotacao: "2525180-26",
    idProposicao: 2525180,
    projeto: "MPV 1303/2025",
    data: "2025-10-08",
    votoAlerta: "Não",
    texto:
      "Votou contra retirar de pauta a medida provisória que aumentava impostos sobre aplicações financeiras, apostas (bets) e fintechs — ou seja, quis que ela fosse votada (outubro de 2025).",
  },
  {
    chave: "plp-128-2025",
    tipo: "imposto",
    idVotacao: "2520670-52",
    idProposicao: 2520670,
    projeto: "PLP 128/2025",
    data: "2025-12-16",
    votoAlerta: "Sim",
    texto:
      "Votou a favor do projeto que cortou benefícios fiscais e aumentou impostos sobre apostas (bets), fintechs e juros sobre capital próprio (dezembro de 2025).",
  },
];

export function urlProposicao(idProposicao: number): string {
  return `https://www.camara.leg.br/propostas-legislativas/${idProposicao}`;
}
