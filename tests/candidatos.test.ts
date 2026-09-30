import { describe, expect, it } from "vitest";
import { FILTRO_INICIAL, filtrar, normalizar, ordenarDireitaParaEsquerda, partidosDe, temAlerta } from "@/lib/candidatos";
import { FAIXAS, faixaDaNota } from "@/lib/espectro";
import type { Candidato, Motivo } from "@/lib/tipos";

const motivo: Motivo = {
  tipo: "imposto",
  texto: "Votou a favor de um imposto de exemplo.",
  fonte: "https://example.org/votacao",
  fonteNome: "Exemplo",
};

function candidato(parcial: Partial<Candidato>): Candidato {
  return {
    id: 1,
    numero: 1000,
    nome: "FULANA",
    nomeCompleto: "FULANA DE TAL",
    partido: "AAA",
    nota: 5,
    origemNota: "partido",
    situacao: "Deferido",
    naUrna: true,
    motivos: [],
    ...parcial,
  };
}

describe("normalizar", () => {
  it("tira acentos, maiúsculas e pontuação", () => {
    expect(normalizar("  SÂMIA  Bomfim-Çá ")).toBe("samia bomfim ca");
  });
});

describe("ordenarDireitaParaEsquerda", () => {
  it("põe a nota mais alta (direita) primeiro e a mais baixa (esquerda) por último", () => {
    const lista = [
      candidato({ id: 1, nota: 2.68 }),
      candidato({ id: 2, nota: 8.8 }),
      candidato({ id: 3, nota: 6.5 }),
    ];
    expect(ordenarDireitaParaEsquerda(lista).map((c) => c.id)).toEqual([2, 3, 1]);
  });

  it("desempata pelo número da urna e não altera a lista original", () => {
    const lista = [candidato({ id: 1, numero: 2299 }), candidato({ id: 2, numero: 2200 })];
    expect(ordenarDireitaParaEsquerda(lista).map((c) => c.numero)).toEqual([2200, 2299]);
    expect(lista.map((c) => c.numero)).toEqual([2299, 2200]);
  });
});

describe("faixaDaNota", () => {
  it.each([
    [10, "bem-direita"],
    [8.51, "bem-direita"],
    [8.5, "direita"],
    [7.01, "direita"],
    [7, "centro-direita"],
    [5.51, "centro-direita"],
    [5.5, "centro"],
    [4.5, "centro"],
    [4.49, "centro-esquerda"],
    [3.01, "centro-esquerda"],
    [3, "esquerda"],
    [1.51, "esquerda"],
    [1.5, "bem-esquerda"],
    [0, "bem-esquerda"],
  ])("nota %s cai em %s", (nota, chave) => {
    expect(faixaDaNota(nota).chave).toBe(chave);
  });

  it("não usa vermelho, que é reservado aos alertas", () => {
    for (const f of FAIXAS) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(f.cor.slice(i, i + 2), 16));
      expect(r > 180 && g < 110 && b < 110, `${f.chave} parece vermelho`).toBe(false);
    }
  });
});

describe("temAlerta e filtrar", () => {
  const limpo = candidato({ id: 1, numero: 1301, nome: "JOSÉ DA PADARIA", nomeCompleto: "JOSÉ SILVA", partido: "AAA" });
  const vermelho = candidato({ id: 2, numero: 2222, nome: "MARIA", partido: "BBB", motivos: [motivo] });
  const foraDaUrna = candidato({ id: 3, numero: 1390, nome: "SAIU", naUrna: false });
  const lista = [limpo, vermelho, foraDaUrna];

  it("fica em alerta só quem tem motivo", () => {
    expect(temAlerta(limpo)).toBe(false);
    expect(temAlerta(vermelho)).toBe(true);
  });

  it("esconde quem ficou fora da urna, a menos que se peça", () => {
    expect(filtrar(lista, FILTRO_INICIAL).map((c) => c.id)).toEqual([1, 2]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, mostrarForaDaUrna: true })).toHaveLength(3);
  });

  it("busca por nome sem acento, por nome completo e pelo começo do número", () => {
    expect(filtrar(lista, { ...FILTRO_INICIAL, busca: "jose" }).map((c) => c.id)).toEqual([1]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, busca: "silva" }).map((c) => c.id)).toEqual([1]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, busca: "22" }).map((c) => c.id)).toEqual([2]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, busca: "01" })).toEqual([]);
  });

  it("filtra por partido e por alerta", () => {
    expect(filtrar(lista, { ...FILTRO_INICIAL, partido: "BBB" }).map((c) => c.id)).toEqual([2]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, alerta: "com" }).map((c) => c.id)).toEqual([2]);
    expect(filtrar(lista, { ...FILTRO_INICIAL, alerta: "sem" }).map((c) => c.id)).toEqual([1]);
  });

  it("lista os partidos em ordem alfabética, sem repetir", () => {
    expect(partidosDe(lista)).toEqual(["AAA", "BBB"]);
  });
});
