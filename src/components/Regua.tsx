import { FAIXAS } from "@/lib/espectro";

/** Legenda da régua: a lista de candidatos sempre segue esta ordem. */
export function Regua() {
  return (
    <figure className="rounded-3xl border-4 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_#0f172a]">
      <figcaption className="mb-3 flex items-center gap-3 font-display text-base font-extrabold sm:text-lg">
        <span>Começo da lista: direita</span>
        <span aria-hidden className="h-1 flex-1 rounded-full bg-slate-900" />
        <span aria-hidden>➡️</span>
        <span aria-hidden className="h-1 flex-1 rounded-full bg-slate-900" />
        <span className="text-right">Fim da lista: esquerda</span>
      </figcaption>
      <ol className="flex flex-wrap gap-1.5 text-center text-sm font-bold leading-tight sm:grid sm:grid-cols-7 sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border-2 sm:border-slate-900">
        {FAIXAS.map((f) => (
          <li
            key={f.chave}
            style={{ backgroundColor: f.cor, color: f.corTexto }}
            className="flex items-center justify-center rounded-full px-3 py-1.5 sm:min-h-14 sm:rounded-none sm:px-1 sm:py-2"
          >
            {f.rotulo}
          </li>
        ))}
      </ol>
    </figure>
  );
}
