import { useSyncExternalStore } from "react";
import { CARGOS, infoDoCargo } from "./cargos";
import type { Candidato, CargoSlug } from "./tipos";

export interface Favorito {
  id: number;
  numero: number;
  nome: string;
  partido: string;
}

/** Favoritos por cargo, na ordem em que foram escolhidos; no máximo `vagas` do cargo. */
export type Favoritos = Partial<Record<CargoSlug, Favorito[]>>;

export const CHAVE_FAVORITOS = "regua-do-voto:favoritos";

const VAZIO: Favoritos = {};

export function resumoDoFavorito(c: Candidato): Favorito {
  return { id: c.id, numero: c.numero, nome: c.nome, partido: c.partido };
}

export function vagasDoCargo(cargo: CargoSlug): number {
  return infoDoCargo(cargo)?.vagas ?? 1;
}

/** Marca o candidato; se já era favorito, desmarca. Com o cargo cheio, sai o favorito mais antigo. */
export function alternarFavorito(atuais: Favoritos, cargo: CargoSlug, c: Candidato): Favoritos {
  const lista = atuais[cargo] ?? [];
  if (lista.some((f) => f.id === c.id)) return removerFavorito(atuais, cargo, c.id);
  return { ...atuais, [cargo]: [...lista, resumoDoFavorito(c)].slice(-vagasDoCargo(cargo)) };
}

export function removerFavorito(atuais: Favoritos, cargo: CargoSlug, id: number): Favoritos {
  const resto = (atuais[cargo] ?? []).filter((f) => f.id !== id);
  const novos = { ...atuais, [cargo]: resto };
  if (resto.length === 0) delete novos[cargo];
  return novos;
}

export function lerFavoritos(texto: string | null): Favoritos {
  if (!texto) return VAZIO;
  try {
    const dados: unknown = JSON.parse(texto);
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) return VAZIO;
    const lidos: Favoritos = {};
    for (const c of CARGOS) {
      // Versão antiga guardava um único favorito por cargo, sem lista.
      const valor = (dados as Record<string, unknown>)[c.slug];
      const lista = (Array.isArray(valor) ? valor : valor ? [valor] : []) as Favorito[];
      if (lista.length > 0) lidos[c.slug] = lista.slice(-c.vagas);
    }
    return lidos;
  } catch {
    return VAZIO;
  }
}

const ouvintes = new Set<() => void>();
let textoEmCache: string | null | undefined;
let favoritosEmCache: Favoritos = VAZIO;

function textoSalvo(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_FAVORITOS);
  } catch {
    return null;
  }
}

function snapshot(): Favoritos {
  const texto = textoSalvo();
  if (texto !== textoEmCache) {
    textoEmCache = texto;
    favoritosEmCache = lerFavoritos(texto);
  }
  return favoritosEmCache;
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

function salvar(novos: Favoritos) {
  try {
    window.localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(novos));
  } catch {
    // Armazenamento bloqueado (aba anônima): não dá para guardar a escolha.
  }
  ouvintes.forEach((avisar) => avisar());
}

export function useFavoritos() {
  const favoritos = useSyncExternalStore(assinar, snapshot, () => VAZIO);
  return {
    favoritos,
    alternar: (cargo: CargoSlug, c: Candidato) => salvar(alternarFavorito(snapshot(), cargo, c)),
    remover: (cargo: CargoSlug, id: number) => salvar(removerFavorito(snapshot(), cargo, id)),
  };
}
