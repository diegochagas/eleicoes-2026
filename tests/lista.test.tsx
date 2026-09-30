import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ListaCandidatos } from "@/components/ListaCandidatos";
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
    render(<ListaCandidatos candidatos={[vermelho, limpa]} comFiltros={false} />);

    expect(screen.getByText("JOÃO VERMELHO").className).toContain("text-red-700");
    expect(screen.getByText("MARIA LIMPA").className).not.toContain("text-red");

    const linha = within(linhaDe("JOÃO VERMELHO"));
    expect(linha.getByText("Votou a favor de aumentar o próprio salário (exemplo).")).toBeTruthy();
    expect(linha.getByText("situação: réu")).toBeTruthy();
    expect(linha.getByRole("link", { name: /Fonte de Exemplo/ }).getAttribute("href")).toBe("https://example.org/voto");
    expect(within(linhaDe("MARIA LIMPA")).getByText("Nada encontrado na nossa pesquisa.")).toBeTruthy();
  });

  it("separa a lista por faixa da régua, direita primeiro", () => {
    render(<ListaCandidatos candidatos={[vermelho, limpa]} comFiltros={false} />);
    const faixas = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(faixas.slice(-2)).toEqual(["📏 Bem à direita", "📏 Esquerda"]);
  });

  it("lista curta mostra também quem ficou fora da urna, com aviso", () => {
    render(<ListaCandidatos candidatos={[vermelho, fora]} comFiltros={false} />);
    expect(within(linhaDe("PEDRO FORA")).getByText("Fora da urna")).toBeTruthy();
  });

  it("filtra pela busca, pelo alerta e esconde quem está fora da urna", async () => {
    const usuario = userEvent.setup();
    render(<ListaCandidatos candidatos={[vermelho, limpa, fora]} comFiltros />);

    expect(screen.queryByText("PEDRO FORA")).toBeNull();
    expect(screen.getByText("2 candidatos, 1 em vermelho.")).toBeTruthy();

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
    render(<ListaCandidatos candidatos={muitos} comFiltros />);

    expect(screen.getAllByText(/^CANDIDATO \d+$/)).toHaveLength(50);
    await usuario.click(screen.getByRole("button", { name: /Mostrar mais 20/ }));
    expect(screen.getAllByText(/^CANDIDATO \d+$/)).toHaveLength(70);
    expect(screen.queryByRole("button", { name: /Mostrar mais/ })).toBeNull();
  });
});
