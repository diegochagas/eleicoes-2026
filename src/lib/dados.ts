import resumoJson from "@/data/resumo.json";
import type { CargoSlug, DadosCargo, Resumo } from "./tipos";

export const resumo = resumoJson as Resumo;

// Cada cargo fica em um arquivo para a página só carregar a lista que mostra.
const carregadores: Record<CargoSlug, () => Promise<{ default: unknown }>> = {
  presidente: () => import("@/data/presidente.json"),
  governador: () => import("@/data/governador.json"),
  senador: () => import("@/data/senador.json"),
  "deputado-federal": () => import("@/data/deputado-federal.json"),
  "deputado-estadual": () => import("@/data/deputado-estadual.json"),
};

export async function carregarCargo(slug: CargoSlug): Promise<DadosCargo> {
  return (await carregadores[slug]()).default as DadosCargo;
}

export function dataPorExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
