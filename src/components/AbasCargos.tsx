import Link from "next/link";
import { CARGOS } from "@/lib/cargos";
import type { CargoSlug } from "@/lib/tipos";

export function AbasCargos({ atual }: { atual: CargoSlug }) {
  return (
    <nav aria-label="Cargos" className="flex flex-wrap gap-2">
      {CARGOS.map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}`}
          aria-current={c.slug === atual ? "page" : undefined}
          className={`rounded-full border-2 border-slate-900 px-4 py-1.5 font-bold ${
            c.slug === atual ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-yellow-200"
          }`}
        >
          <span aria-hidden>{c.emoji}</span> {c.tituloCurto}
        </Link>
      ))}
    </nav>
  );
}
