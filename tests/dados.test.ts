// Integridade dos dados gerados: o site faz afirmações sobre pessoas reais, então
// todo nome em vermelho precisa de motivo com fonte, e a ordem precisa ser a da régua.
import { describe, expect, it } from "vitest";
import { ordenarDireitaParaEsquerda, ROTULO_MOTIVO } from "@/lib/candidatos";
import { CARGOS } from "@/lib/cargos";
import { carregarCargo, resumo } from "@/lib/dados";
import type { Candidato, Motivo } from "@/lib/tipos";

const listas = await Promise.all(CARGOS.map(async (c) => ({ info: c, ...(await carregarCargo(c.slug)) })));
const todosOsMotivos = (c: Candidato): Motivo[] => [...c.motivos, ...(c.motivosVice ?? [])];

describe.each(listas)("$info.slug", ({ info, candidatos }) => {
  it("tem candidatos, sem id repetido", () => {
    expect(candidatos.length).toBeGreaterThan(5);
    expect(new Set(candidatos.map((c) => c.id)).size).toBe(candidatos.length);
  });

  it("está em ordem da direita para a esquerda", () => {
    expect(candidatos.map((c) => c.id)).toEqual(ordenarDireitaParaEsquerda(candidatos).map((c) => c.id));
  });

  it("tem número com a quantidade de dígitos da urna e nota entre 0 e 10", () => {
    for (const c of candidatos) {
      expect(String(c.numero), c.nome).toHaveLength(info.digitos);
      expect(c.nota, c.nome).toBeGreaterThanOrEqual(0);
      expect(c.nota, c.nome).toBeLessThanOrEqual(10);
    }
  });

  it("só tem partidos com nota na régua", () => {
    const siglas = new Set(resumo.partidos.map((p) => p.sigla));
    for (const c of candidatos) expect(siglas.has(c.partido), `${c.nome}: ${c.partido}`).toBe(true);
  });

  it("todo motivo tem texto, tipo conhecido e fonte em https", () => {
    for (const c of candidatos) {
      for (const m of todosOsMotivos(c)) {
        expect(m.texto.length, c.nome).toBeGreaterThan(20);
        expect(ROTULO_MOTIVO[m.tipo], `${c.nome}: ${m.tipo}`).toBeDefined();
        expect(m.fonte, c.nome).toMatch(/^https:\/\//);
        expect(m.fonteNome.length, c.nome).toBeGreaterThan(1);
      }
    }
  });

  it("não repete o mesmo motivo no mesmo candidato", () => {
    for (const c of candidatos) {
      const textos = c.motivos.map((m) => m.texto);
      expect(new Set(textos).size, c.nome).toBe(textos.length);
    }
  });

  // Nomes de crimes e de operações ("corrupção passiva", "Operação Vectura Corrupta") podem
  // aparecer; chamar a pessoa de corrupta, ladra ou bandida, não.
  it("não usa palavras de julgamento nos motivos", () => {
    for (const c of candidatos) {
      for (const m of todosOsMotivos(c)) {
        expect(m.texto, c.nome).not.toMatch(/\b(é|são|foi|era|um|uma)\s+(corrupt[oa]s?|ladr(ão|ões|a|as)|bandid[oa]s?)\b/i);
      }
    }
  });
});

describe("resumo", () => {
  it("bate com as listas", () => {
    for (const { info, candidatos } of listas) {
      const r = resumo.cargos.find((x) => x.slug === info.slug);
      const naUrna = candidatos.filter((c) => c.naUrna);
      expect(r?.total).toBe(naUrna.length);
      expect(r?.comAlerta).toBe(naUrna.filter((c) => c.motivos.length > 0).length);
    }
  });

  it("lista os partidos da direita para a esquerda", () => {
    const notas = resumo.partidos.map((p) => p.nota);
    expect(notas).toEqual([...notas].sort((a, b) => b - a));
  });
});

describe("presidente, governador e senador", () => {
  it("têm análise individual com justificativa", () => {
    for (const { info, candidatos } of listas.filter((l) => l.info.digitos <= 3)) {
      for (const c of candidatos) {
        expect(c.origemNota, `${info.slug} ${c.nome}`).toBe("analise");
        expect(c.justificativa?.length ?? 0, c.nome).toBeGreaterThan(20);
      }
    }
  });
});
