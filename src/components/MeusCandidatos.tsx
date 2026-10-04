"use client";

import Link from "next/link";
import { CARGOS } from "@/lib/cargos";
import { useFavoritos } from "@/lib/favoritos";

export function MeusCandidatos() {
  const { favoritos, remover } = useFavoritos();
  const total = CARGOS.reduce((n, c) => n + c.vagas, 0);
  const escolhidos = CARGOS.reduce((n, c) => n + (favoritos[c.slug]?.length ?? 0), 0);

  return (
    <div className="space-y-4">
      <p aria-live="polite" className="font-bold text-slate-800">
        {escolhidos} de {total} votos escolhidos
        {escolhidos === total ? ". Tudo pronto! 🎉" : `, faltam ${total - escolhidos}.`}
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {CARGOS.map((c) => {
          const lista = favoritos[c.slug] ?? [];
          const faltam = c.vagas - lista.length;
          return (
            <li
              key={c.slug}
              data-cargo={c.slug}
              data-escolhido={lista.length > 0}
              data-completo={faltam === 0}
              className={`rounded-3xl border-4 border-slate-900 p-5 shadow-[6px_6px_0_0_#0f172a] ${
                faltam === 0 ? `bg-gradient-to-br ${c.cor}` : "bg-white"
              }`}
            >
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                <Link href={`/${c.slug}`} className="underline-offset-4 hover:underline">
                  <span aria-hidden>{c.emoji}</span> {c.titulo}
                </Link>
              </h2>
              <ul className="mt-2 space-y-3">
                {lista.map((f) => (
                  <li key={f.id} className="space-y-1">
                    <p className="font-display text-3xl font-extrabold text-slate-900">
                      <span aria-hidden>⭐ </span>
                      {f.nome}
                    </p>
                    <p className="font-bold text-slate-900">
                      Número {f.numero} · {f.partido}
                    </p>
                    <button
                      type="button"
                      onClick={() => remover(c.slug, f.id)}
                      aria-label={`Tirar ${f.nome} de ${c.tituloCurto}`}
                      className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-sm font-bold"
                    >
                      Tirar
                    </button>
                  </li>
                ))}
              </ul>
              {faltam > 0 && (
                <p className="mt-3 rounded-2xl border-2 border-dashed border-slate-900 bg-white px-3 py-2 text-lg text-slate-800">
                  <strong>{faltam === 1 ? "Falta escolher 1." : `Faltam escolher ${faltam}.`}</strong>{" "}
                  <Link href={`/${c.slug}`} className="font-bold text-blue-800 underline">
                    Ver candidatos a {c.tituloCurto.toLowerCase()}
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-slate-700">
        Suas escolhas ficam só neste navegador, não vão para nenhum servidor. Cada cargo tem um voto, e senador tem dois.
      </p>
    </div>
  );
}
