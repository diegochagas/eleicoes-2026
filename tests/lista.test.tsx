import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ListaCandidatos } from "@/components/ListaCandidatos";
import { CARGOS } from "@/lib/cargos";
import { MeusCandidatos } from "@/components/MeusCandidatos";
import type { Candidato } from "@/lib/tipos";

afterEach(cleanup);

function candidato(i: number, parcial: Partial<Candidato> = {}): Candidato {
  return {
    id: i,
    numero: 1000 + i,
    nome: `CANDIDATO ${i}`,
    nomeCompleto: `CANDIDATO NUMERO ${i}`,
    partido: i % 2 ? "AAA" : "BBB",
    nota: 8,
    origemNota: "partido",
    situacao: "Deferido",
    naUrna: true,
    motivos: [],
    ...parcial,
  };
}

const vermelho = candidato(1, {
  nome: "JOÃO VERMELHO",
  nota: 9,
  motivos: [
    {
      tipo: "beneficio_proprio",
      texto: "Votou a favor de aumentar o próprio salário (exemplo).",
      status: "réu",
      fonte: "https://example.org/voto",
      fonteNome: "Fonte de Exemplo",
    },
  ],
});
const limpa = candidato(2, { nome: "MARIA LIMPA", nota: 2 });
const fora = candidato(3, { nome: "PEDRO FORA", naUrna: false, situacao: "Indeferido" });

const linhaDe = (nome: string) => screen.getByText(nome).closest("tr") as HTMLTableRowElement;

describe("ListaCandidatos", () => {
  it("pinta de vermelho só quem tem motivo e mostra o motivo com a fonte", () => {
    render(<ListaCandidatos cargo="presidente" candidatos={[vermelho, limpa]} comFiltros={false} />);

    expect(screen.getByText("JOÃO VERMELHO").className).toContain("text-red-700");
    expect(screen.getByText("MARIA LIMPA").className).not.toContain("text-red");

    const linha = within(linhaDe("JOÃO VERMELHO"));
    expect(linha.getByText("Votou a favor de aumentar o próprio salário (exemplo).")).toBeTruthy();
    expect(linha.getByText("situação: réu")).toBeTruthy();
    expect(linha.getByRole("link", { name: /Fonte de Exemplo/ }).getAttribute("href")).toBe("https://example.org/voto");
    expect(within(linhaDe("MARIA LIMPA")).getByText("Nada encontrado na nossa pesquisa.")).toBeTruthy();
  });

  it("separa a lista por faixa da régua, direita primeiro", () => {
    render(<ListaCandidatos cargo="presidente" candidatos={[vermelho, limpa]} comFiltros={false} />);
    const faixas = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(faixas.slice(-2)).toEqual(["📏 Bem à direita", "📏 Esquerda"]);
  });

  it("lista curta mostra também quem ficou fora da urna, com aviso", () => {
    render(<ListaCandidatos cargo="presidente" candidatos={[vermelho, fora]} comFiltros={false} />);
    expect(within(linhaDe("PEDRO FORA")).getByText("Fora da urna")).toBeTruthy();
  });

  it("filtra pela busca, pelo alerta e esconde quem está fora da urna", async () => {
    const usuario = userEvent.setup();
    render(<ListaCandidatos cargo="presidente" candidatos={[vermelho, limpa, fora]} comFiltros />);

    expect(screen.queryByText("PEDRO FORA")).toBeNull();
    expect(screen.getByText("2 candidatos, 1 em vermelho, 0 em amarelo.")).toBeTruthy();

    await usuario.type(screen.getByRole("searchbox"), "maria");
    expect(screen.queryByText("JOÃO VERMELHO")).toBeNull();
    expect(screen.getByText("MARIA LIMPA")).toBeTruthy();

    await usuario.clear(screen.getByRole("searchbox"));
    await usuario.click(screen.getByRole("button", { name: /Só em vermelho/ }));
    expect(screen.getByText("JOÃO VERMELHO")).toBeTruthy();
    expect(screen.queryByText("MARIA LIMPA")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Todos" }));
    await usuario.click(screen.getByRole("checkbox", { name: /fora da urna/ }));
    expect(screen.getByText("PEDRO FORA")).toBeTruthy();
  });

  it("mostra 50 por vez e carrega mais ao clicar", async () => {
    const usuario = userEvent.setup();
    const muitos = Array.from({ length: 70 }, (_, i) => candidato(i + 10));
    render(<ListaCandidatos cargo="presidente" candidatos={muitos} comFiltros />);

    expect(screen.getAllByText(/^CANDIDATO \d+$/)).toHaveLength(50);
    await usuario.click(screen.getByRole("button", { name: /Mostrar mais 20/ }));
    expect(screen.getAllByText(/^CANDIDATO \d+$/)).toHaveLength(70);
    expect(screen.queryByRole("button", { name: /Mostrar mais/ })).toBeNull();
  });
});

describe("indícios (amarelo)", () => {
  const amarelo = candidato(5, {
    nome: "ANA AMARELA",
    indicios: [
      {
        tipo: "despesa_desproporcional",
        severidade: "high",
        texto: "Em campanha anterior, uma despesa de R$ 40.000,00 ficou muito acima do usual (exemplo).",
        fonte: "https://example.org/elosys",
        fonteNome: "EloSys (exemplo)",
      },
    ],
  });

  it("marca de amarelo, explica o motivo e não pinta de vermelho", () => {
    render(<ListaCandidatos cargo="presidente" candidatos={[amarelo, limpa]} comFiltros={false} />);
    expect(screen.getByText("ANA AMARELA").className).toContain("bg-yellow-200");
    expect(screen.getByText("ANA AMARELA").closest("p")?.className).not.toContain("text-red");
    const linha = within(linhaDe("ANA AMARELA"));
    expect(linha.getByText(/não são acusação/)).toBeTruthy();
    expect(linha.getByText("indício forte")).toBeTruthy();
    expect(linha.getByRole("link", { name: /EloSys \(exemplo\)/ }).getAttribute("href")).toBe("https://example.org/elosys");
    expect(linha.queryByText("Nada encontrado na nossa pesquisa.")).toBeNull();
  });

  it("vermelho vence o amarelo e o filtro 'Com indício' acha os amarelos", async () => {
    const usuario = userEvent.setup();
    const ambos = candidato(6, { ...vermelho, id: 6, nome: "BETO AMBOS", indicios: amarelo.indicios });
    render(<ListaCandidatos cargo="presidente" candidatos={[ambos, amarelo, limpa]} comFiltros />);
    expect(screen.getByText("BETO AMBOS").className).not.toContain("bg-yellow");
    expect(screen.getByText("3 candidatos, 1 em vermelho, 1 em amarelo.")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: /Com indício/ }));
    expect(screen.getByText("ANA AMARELA")).toBeTruthy();
    expect(screen.queryByText("MARIA LIMPA")).toBeNull();
  });
});

describe("primeira candidatura", () => {
  it("mostra o selo e o filtro deixa só os estreantes", async () => {
    const usuario = userEvent.setup();
    const novo = candidato(8, { nome: "NOEMI NOVATA", estreante: true });
    render(<ListaCandidatos cargo="presidente" candidatos={[novo, limpa]} comFiltros />);
    expect(within(linhaDe("NOEMI NOVATA")).getByText(/Primeira candidatura/)).toBeTruthy();
    expect(within(linhaDe("MARIA LIMPA")).queryByText(/Primeira candidatura/)).toBeNull();

    await usuario.click(screen.getByRole("checkbox", { name: /Só primeira candidatura/ }));
    expect(screen.getByText("NOEMI NOVATA")).toBeTruthy();
    expect(screen.queryByText("MARIA LIMPA")).toBeNull();
  });
});

describe("tempo de política", () => {
  it("mostra desde quando, eleições disputadas e vezes eleito", () => {
    const veterano = candidato(9, {
      nome: "VERA VETERANA",
      trajetoria: { desde: 2016, eleicoes: 3, eleito: 2, cargosEleito: ["vereador"] },
    });
    const velho = candidato(10, { nome: "OTO ANTIGO", trajetoria: { desde: 2014, eleicoes: 1, eleito: 0, cargosEleito: [] } });
    render(<ListaCandidatos cargo="presidente" candidatos={[veterano, velho]} comFiltros={false} />);
    expect(within(linhaDe("VERA VETERANA")).getByText(/Candidato\(a\) desde 2016 \(10 anos\) · 3 eleições · eleito\(a\) 2 vezes/)).toBeTruthy();
    expect(within(linhaDe("OTO ANTIGO")).getByText(/desde 2014 ou antes \(12 anos\) · 1 eleição · nunca eleito/)).toBeTruthy();
  });
});

describe("selos verdes", () => {
  it("vermelho e amarelo vencem o verde no nome", () => {
    const comVerde = [{ topico: "seguranca" as const, origem: "partido" as const, texto: "O programa do partido defende segurança (exemplo).", fonte: "https://example.org/p", fonteNome: "Programa (exemplo)" }];
    const rubro = candidato(11, { ...vermelho, id: 11, nome: "ROSA RUBRA", verdes: comVerde });
    render(<ListaCandidatos cargo="presidente" candidatos={[rubro]} comFiltros={false} />);
    expect(screen.getByText("ROSA RUBRA").className).toContain("text-red-700");
    expect(within(linhaDe("ROSA RUBRA")).getByRole("list", { name: "Selos verdes" })).toBeTruthy();
  });

  const verde = candidato(7, {
    nome: "VERA VERDE",
    verdes: [
      {
        topico: "contra_aborto",
        origem: "candidato",
        texto: "O plano de governo diz que defende a vida desde a concepção (exemplo).",
        fonte: "https://example.org/plano",
        fonteNome: "Plano de governo (exemplo)",
      },
    ],
  });

  it("mostra o selo, o motivo, a origem e a fonte, e o nome fica verde se não há alerta", () => {
    render(<ListaCandidatos cargo="presidente" candidatos={[verde, limpa]} comFiltros={false} />);
    const linha = within(linhaDe("VERA VERDE"));
    expect(linha.getByRole("list", { name: "Selos verdes" })).toBeTruthy();
    expect(linha.getByText("posição do próprio candidato")).toBeTruthy();
    expect(linha.getByRole("link", { name: /Plano de governo \(exemplo\)/ }).getAttribute("href")).toBe("https://example.org/plano");
    expect(screen.getByText("VERA VERDE").className).toContain("bg-green-200");
  });

  it("o filtro por assunto mostra só quem tem o selo", async () => {
    const usuario = userEvent.setup();
    render(<ListaCandidatos cargo="presidente" candidatos={[verde, limpa]} comFiltros />);
    await usuario.selectOptions(screen.getByLabelText(/Selo verde/), "contra_aborto");
    expect(screen.getByText("VERA VERDE")).toBeTruthy();
    expect(screen.queryByText("MARIA LIMPA")).toBeNull();
  });
});

describe("favoritos", () => {
  beforeEach(() => window.localStorage.clear());

  it("só aceita um favorito por cargo e o último escolhido troca o anterior", async () => {
    const usuario = userEvent.setup();
    render(<ListaCandidatos cargo="presidente" candidatos={[vermelho, limpa]} comFiltros={false} />);

    await usuario.click(screen.getByRole("button", { name: /Favoritar JOÃO VERMELHO/ }));
    expect(screen.getByRole("button", { name: /Meu voto JOÃO VERMELHO/ }).getAttribute("aria-pressed")).toBe("true");

    await usuario.click(screen.getByRole("button", { name: /Favoritar MARIA LIMPA/ }));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Meu voto MARIA LIMPA/ })).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: /Meu voto MARIA LIMPA/ }));
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("a página Meus candidatos mostra escolhidos e faltantes", async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(<ListaCandidatos cargo="governador" candidatos={[limpa]} comFiltros={false} />);
    await usuario.click(screen.getByRole("button", { name: /Favoritar MARIA LIMPA/ }));
    unmount();

    render(<MeusCandidatos />);
    expect(screen.getByText(/1 de 6 votos escolhidos, faltam 5/)).toBeTruthy();
    expect(document.querySelector('[data-cargo="governador"]')?.textContent).toContain("MARIA LIMPA");
    expect(document.querySelector('[data-cargo="senador"]')?.textContent).toContain("Faltam escolher 2.");

    await usuario.click(screen.getByRole("button", { name: /Tirar/ }));
    expect(screen.getByText(/0 de 6 votos escolhidos/)).toBeTruthy();
  });

  it("senador aceita dois favoritos e o terceiro troca o mais antigo", async () => {
    const usuario = userEvent.setup();
    const tres = [candidato(21), candidato(22), candidato(23)];
    const { unmount } = render(<ListaCandidatos cargo="senador" candidatos={tres} comFiltros={false} />);

    await usuario.click(screen.getByRole("button", { name: /Favoritar CANDIDATO 21/ }));
    await usuario.click(screen.getByRole("button", { name: /Favoritar CANDIDATO 22/ }));
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    expect(screen.getByText("Troca CANDIDATO 21")).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: /Favoritar CANDIDATO 23/ }));
    expect(screen.getByRole("button", { name: /Favoritar CANDIDATO 21/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    unmount();

    render(<MeusCandidatos />);
    expect(screen.getByText(/2 de 6 votos escolhidos, faltam 4/)).toBeTruthy();
    expect(document.querySelector('[data-cargo="senador"]')?.getAttribute("data-completo")).toBe("true");
  });

  it("aceita o formato antigo, com um favorito sem lista", () => {
    window.localStorage.setItem(
      "regua-do-voto:favoritos",
      JSON.stringify({ senador: { id: 5, numero: 123, nome: "ANTIGO", partido: "AAA" } }),
    );
    render(<MeusCandidatos />);
    expect(screen.getByText("ANTIGO")).toBeTruthy();
    expect(document.querySelector('[data-cargo="senador"]')?.textContent).toContain("Falta escolher 1.");
  });
});

describe("ordem dos cargos", () => {
  it("segue a ordem da urna em todas as páginas", () => {
    expect(CARGOS.map((c) => c.slug)).toEqual([
      "deputado-federal",
      "deputado-estadual",
      "senador",
      "governador",
      "presidente",
    ]);
  });
});
