// Integridade dos dados gerados: o site faz afirmações sobre pessoas reais, então
// todo nome em vermelho precisa de motivo com fonte, e a ordem precisa ser a da régua.
import { describe, expect, it } from "vitest";
import { ordenarDireitaParaEsquerda, ROTULO_MOTIVO, ROTULO_VERDE } from "@/lib/candidatos";
import { CARGOS } from "@/lib/cargos";
import { carregarCargo, resumo } from "@/lib/dados";
import type { Candidato, Motivo } from "@/lib/tipos";

const listas = await Promise.all(CARGOS.map(async (c) => ({ info: c, ...(await carregarCargo(c.slug)) })));
const todosOsCandidatos = listas.flatMap((l) => l.candidatos);
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

  it("todo indício tem texto que lembra que não é prova, fonte em https e nenhum CPF", () => {
    for (const c of candidatos) {
      for (const i of (c.indicios ?? []).filter((x) => x.tipo !== "parentesco")) {
        expect(i.texto, c.nome).toMatch(/indício|vínculo/);
        expect(i.fonte, c.nome).toMatch(/^https:\/\//);
        expect(i.texto, c.nome).not.toMatch(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\d{11,14}/);
      }
    }
  });

  it("todo aviso de parentesco aponta para um filho que tem alerta próprio", () => {
    for (const c of candidatos) {
      for (const i of (c.indicios ?? []).filter((x) => x.tipo === "parentesco")) {
        const filho = todosOsCandidatos.find((x) => i.texto.includes(`${x.nome} (nº ${x.numero}, ${x.partido})`));
        expect(filho, c.nome).toBeDefined();
        const alertaProprio = filho!.motivos.length > 0 || (filho!.indicios ?? []).some((x) => x.tipo !== "parentesco");
        expect(alertaProprio, `${c.nome} → ${filho!.nome}`).toBe(true);
        expect(i.fonte, c.nome).toMatch(/^https:\/\//);
      }
    }
  });

  it("todo selo verde tem assunto conhecido, texto e fonte em https, sem assunto repetido", () => {
    for (const c of candidatos) {
      const topicos = (c.verdes ?? []).map((v) => v.topico);
      expect(new Set(topicos).size, c.nome).toBe(topicos.length);
      for (const v of c.verdes ?? []) {
        expect(ROTULO_VERDE[v.topico], c.nome).toBeDefined();
        expect(v.texto.length, c.nome).toBeGreaterThan(20);
        expect(v.fonte, c.nome).toMatch(/^https:\/\//);
      }
    }
  });

  it("selo de voto contra privilégios só vai a quem nunca votou a favor", () => {
    for (const c of candidatos) {
      const v = c.verdes?.find((x) => x.topico === "contra_privilegios");
      if (!v) continue;
      expect(v.origem, c.nome).toBe("voto");
      expect(v.texto, c.nome).toMatch(/^Votou contra /);
      expect(v.texto, c.nome).not.toMatch(/contra d[aoe] /);
    }
  });

  it("trajetória e estreante batem entre si", () => {
    for (const c of candidatos) {
      expect(c.estreante && c.trajetoria, c.nome).toBeFalsy();
      if (!c.trajetoria) continue;
      expect(c.trajetoria.desde, c.nome).toBeGreaterThanOrEqual(2014);
      expect(c.trajetoria.desde, c.nome).toBeLessThan(2026);
      expect(c.trajetoria.eleito, c.nome).toBeLessThanOrEqual(c.trajetoria.eleicoes);
      expect(c.trajetoria.eleicoes, c.nome).toBeGreaterThan(0);
    }
  });

  it("vermelho por posição contrária diz se vem do candidato ou do partido", () => {
    for (const c of candidatos) {
      for (const m of c.motivos.filter((x) => x.tipo === "posicao")) {
        expect(["posição própria", "posição do partido"], c.nome).toContain(m.status);
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
      expect(r?.comVerde).toBe(naUrna.filter((c) => (c.verdes?.length ?? 0) > 0).length);
      expect(r?.soIndicio).toBe(naUrna.filter((c) => c.motivos.length === 0 && (c.indicios?.length ?? 0) > 0).length);
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
