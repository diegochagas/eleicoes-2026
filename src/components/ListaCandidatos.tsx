"use client";

import { Fragment, useMemo, useState } from "react";
import { FILTRO_INICIAL, ROTULO_VERDE, TOPICOS_VERDES, filtrar, partidosDe, temAlerta, temIndicio, type Filtro, type FiltroAlerta } from "@/lib/candidatos";
import { faixaDaNota } from "@/lib/espectro";
import type { Candidato, CargoSlug } from "@/lib/tipos";
import { LinhaCandidato } from "./LinhaCandidato";

const POR_PAGINA = 50;

const OPCOES_ALERTA: { valor: FiltroAlerta; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "com", rotulo: "🔴 Só em vermelho" },
  { valor: "indicio", rotulo: "🟡 Com indício" },
  { valor: "sem", rotulo: "Só sem alerta" },
];

interface Props {
  cargo: CargoSlug;
  candidatos: Candidato[];
  /** Listas curtas (presidente, governador, senador) aparecem inteiras, sem filtros. */
  comFiltros: boolean;
}

export function ListaCandidatos({ cargo, candidatos, comFiltros }: Props) {
  const [filtro, setFiltro] = useState<Filtro>({ ...FILTRO_INICIAL, mostrarForaDaUrna: !comFiltros });
  const [limite, setLimite] = useState(POR_PAGINA);

  const partidos = useMemo(() => partidosDe(candidatos), [candidatos]);
  const filtrados = useMemo(() => filtrar(candidatos, filtro), [candidatos, filtro]);
  const visiveis = comFiltros ? filtrados.slice(0, limite) : filtrados;
  const emVermelho = filtrados.filter(temAlerta).length;
  const soAmarelo = filtrados.filter((c) => !temAlerta(c) && temIndicio(c)).length;
  const foraDaUrna = filtrados.filter((c) => !c.naUrna).length;

  function mudar(parte: Partial<Filtro>) {
    setFiltro((atual) => ({ ...atual, ...parte }));
    setLimite(POR_PAGINA);
  }

  return (
    <div className="space-y-4">
      {comFiltros && (
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="grid gap-3 rounded-3xl border-4 border-slate-900 bg-yellow-100 p-4 shadow-[6px_6px_0_0_#0f172a] md:grid-cols-[2fr_1fr]"
        >
          <label className="block font-bold">
            🔎 Procure pelo nome ou pelo número
            <input
              type="search"
              value={filtro.busca}
              onChange={(e) => mudar({ busca: e.target.value })}
              placeholder="Ex.: 1234 ou Maria"
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-lg font-normal"
            />
          </label>
          <label className="block font-bold">
            Partido
            <select
              value={filtro.partido}
              onChange={(e) => mudar({ partido: e.target.value })}
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-lg font-normal"
            >
              <option value="">Todos os partidos</option>
              {partidos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-bold md:col-span-2">
            🟢 Selo verde
            <select
              value={filtro.verde}
              onChange={(e) => mudar({ verde: e.target.value as Filtro["verde"] })}
              className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-lg font-normal"
            >
              <option value="">Qualquer assunto</option>
              {TOPICOS_VERDES.map((t) => (
                <option key={t} value={t}>
                  {ROTULO_VERDE[t].rotulo}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-wrap items-center gap-2 md:col-span-2">
            <legend className="sr-only">Mostrar</legend>
            {OPCOES_ALERTA.map((o) => (
              <button
                key={o.valor}
                type="button"
                aria-pressed={filtro.alerta === o.valor}
                onClick={() => mudar({ alerta: o.valor })}
                className={`rounded-full border-2 border-slate-900 px-4 py-1.5 font-bold ${
                  filtro.alerta === o.valor ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                }`}
              >
                {o.rotulo}
              </button>
            ))}
            <label className="flex items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={filtro.soEstreantes}
                onChange={(e) => mudar({ soEstreantes: e.target.checked })}
                className="h-5 w-5 accent-slate-900"
              />
              🌱 Só primeira candidatura
            </label>
            <label className="ml-auto flex items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={filtro.mostrarForaDaUrna}
                onChange={(e) => mudar({ mostrarForaDaUrna: e.target.checked })}
                className="h-5 w-5 accent-slate-900"
              />
              Mostrar quem ficou fora da urna
            </label>
          </fieldset>
        </form>
      )}

      <p aria-live="polite" className="font-bold text-slate-800">
        {filtrados.length === 0
          ? "Nenhum candidato encontrado."
          : `${filtrados.length} ${filtrados.length === 1 ? "candidato" : "candidatos"}, ${emVermelho} em vermelho, ${soAmarelo} em amarelo${
              foraDaUrna > 0 ? `, ${foraDaUrna} fora da urna` : ""
            }.`}
      </p>

      {visiveis.length > 0 && (
        <div className="overflow-hidden rounded-3xl border-4 border-slate-900 bg-white shadow-[6px_6px_0_0_#0f172a]">
          <table className="block w-full md:table">
            <caption className="sr-only">Candidatos, da direita para a esquerda</caption>
            <thead className="sr-only md:not-sr-only md:table-header-group">
              <tr className="bg-slate-900 text-left font-display text-lg text-white">
                <th scope="col" className="px-4 py-3">
                  Número
                </th>
                <th scope="col" className="px-4 py-3">
                  Nome
                </th>
                <th scope="col" className="px-4 py-3">
                  Por que tem alerta
                </th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {visiveis.map((c, i) => {
                const faixa = faixaDaNota(c.nota);
                const mudouDeFaixa = i === 0 || faixaDaNota(visiveis[i - 1].nota).chave !== faixa.chave;
                return (
                  <Fragment key={c.id}>
                    {mudouDeFaixa && (
                      <tr className="block md:table-row">
                        <th
                          scope="colgroup"
                          colSpan={3}
                          style={{ backgroundColor: faixa.cor, color: faixa.corTexto }}
                          className="block px-4 py-2 text-left font-display text-lg font-extrabold md:table-cell"
                        >
                          📏 {faixa.rotulo}
                        </th>
                      </tr>
                    )}
                    <LinhaCandidato candidato={c} cargo={cargo} />
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {comFiltros && filtrados.length > limite && (
        <button
          type="button"
          onClick={() => setLimite((n) => n + POR_PAGINA)}
          className="mx-auto block rounded-full border-4 border-slate-900 bg-yellow-300 px-6 py-2 font-display text-xl font-extrabold shadow-[4px_4px_0_0_#0f172a]"
        >
          Mostrar mais {Math.min(POR_PAGINA, filtrados.length - limite)} ⬇️
        </button>
      )}
    </div>
  );
}
