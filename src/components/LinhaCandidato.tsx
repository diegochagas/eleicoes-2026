import { ROTULO_MOTIVO, temAlerta } from "@/lib/candidatos";
import { faixaDaNota } from "@/lib/espectro";
import type { Candidato, Motivo } from "@/lib/tipos";

const COR_STATUS: Record<string, string> = {
  condenado: "bg-red-100 text-red-900 border-red-300",
  cassado: "bg-red-100 text-red-900 border-red-300",
  preso: "bg-red-100 text-red-900 border-red-300",
  "registro negado": "bg-red-100 text-red-900 border-red-300",
  "registro negado, com recurso": "bg-orange-100 text-orange-900 border-orange-300",
  réu: "bg-orange-100 text-orange-900 border-orange-300",
  denunciado: "bg-orange-100 text-orange-900 border-orange-300",
  investigado: "bg-amber-100 text-amber-900 border-amber-300",
  multado: "bg-amber-100 text-amber-900 border-amber-300",
  "contas irregulares": "bg-amber-100 text-amber-900 border-amber-300",
};
// Arquivado, anulado, absolvido, prescrito: o caso acabou sem punição.
const COR_STATUS_ENCERRADO = "bg-slate-100 text-slate-800 border-slate-300";

function ListaMotivos({ motivos }: { motivos: Motivo[] }) {
  return (
    <ul className="space-y-2">
      {motivos.map((m) => {
        const rotulo = ROTULO_MOTIVO[m.tipo];
        return (
          <li key={m.texto} className="rounded-2xl border-2 border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
              <span aria-hidden>{rotulo.emoji}</span> {rotulo.rotulo}
              {m.status && (
                <span
                  className={`ml-2 rounded-full border px-2 py-0.5 normal-case tracking-normal ${COR_STATUS[m.status] ?? COR_STATUS_ENCERRADO}`}
                >
                  situação: {m.status}
                </span>
              )}
            </p>
            <p className="mt-1 text-slate-900">{m.texto}</p>
            <a
              href={m.fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-bold text-blue-800 underline"
            >
              Fonte: {m.fonteNome} ↗
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Digitos({ numero }: { numero: number }) {
  return (
    <span className="inline-flex gap-1">
      <span className="sr-only">Número {numero}</span>
      {String(numero)
        .split("")
        .map((d, i) => (
          <span
            key={i}
            aria-hidden
            className="flex h-10 w-8 items-center justify-center rounded-lg border-2 border-slate-900 bg-white font-display text-2xl font-extrabold text-slate-900 shadow-[2px_2px_0_0_#0f172a]"
          >
            {d}
          </span>
        ))}
    </span>
  );
}

const nota = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function LinhaCandidato({ candidato: c }: { candidato: Candidato }) {
  const alerta = temAlerta(c);
  const faixa = faixaDaNota(c.nota);
  const viceEmAlerta = (c.motivosVice?.length ?? 0) > 0;

  return (
    <tr
      data-alerta={alerta}
      className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-b-2 border-dashed border-slate-300 p-4 last:border-b-0 md:table-row md:p-0 ${c.naUrna ? "" : "bg-slate-100"}`}
    >
      <td className="align-top md:w-44 md:px-4 md:py-4">
        <Digitos numero={c.numero} />
      </td>
      <td className="align-top md:w-80 md:px-4 md:py-4">
        <p
          className={`font-display text-xl font-extrabold leading-tight ${alerta ? "text-red-700" : "text-slate-900"}`}
        >
          {alerta && (
            <span aria-hidden className="mr-1">
              🔴
            </span>
          )}
          {c.nome}
          {alerta && <span className="sr-only"> (em vermelho: tem motivo de alerta)</span>}
        </p>
        <p className="text-sm text-slate-600">{c.nomeCompleto}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className="rounded-full border-2 border-slate-900 bg-white px-2.5 py-0.5">{c.partido}</span>
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: faixa.cor, color: faixa.corTexto }}
            title={`Nota ${nota(c.nota)} na régua (0 = esquerda, 10 = direita)`}
          >
            {faixa.rotulo} · {nota(c.nota)}
          </span>
          {c.situacao !== "Deferido" && (
            <span className="rounded-full border-2 border-amber-500 bg-amber-100 px-2.5 py-0.5 text-amber-950">
              {c.naUrna ? `Registro: ${c.situacao.toLowerCase()}` : "Fora da urna"}
            </span>
          )}
        </p>
        {c.vice && (
          <p className="mt-2 text-sm text-slate-700">
            Vice:{" "}
            <strong className={viceEmAlerta ? "text-red-700" : undefined}>
              {viceEmAlerta && <span aria-hidden>🔴 </span>}
              {c.vice}
            </strong>
          </p>
        )}
      </td>
      <td className="col-span-2 align-top md:px-4 md:py-4">
        {alerta ? (
          <ListaMotivos motivos={c.motivos} />
        ) : (
          <p className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            Nada encontrado na nossa pesquisa.
          </p>
        )}
        {viceEmAlerta && c.motivosVice && (
          <div className="mt-3">
            <p className="mb-1 text-sm font-extrabold text-slate-800">Sobre o(a) vice, {c.vice}:</p>
            <ListaMotivos motivos={c.motivosVice} />
          </div>
        )}
        {c.observacao && <p className="mt-2 text-sm text-slate-700">ℹ️ {c.observacao}</p>}
        {c.justificativa && (
          <details className="mt-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2">
            <summary className="cursor-pointer font-bold text-slate-900">
              📏 Por que está neste lugar da régua?
            </summary>
            <p className="mt-2 text-slate-800">{c.justificativa}</p>
            {c.notaEconomia !== undefined && c.notaCostumes !== undefined && (
              <p className="mt-2 text-sm text-slate-700">
                Nota em economia: <strong>{nota(c.notaEconomia)}</strong> · Nota em costumes e segurança:{" "}
                <strong>{nota(c.notaCostumes)}</strong> (0 = esquerda, 10 = direita)
              </p>
            )}
            {c.propostas && c.propostas.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
                {c.propostas.map((p) => (
                  <li key={p.texto}>
                    {p.texto}
                    {p.fonte && (
                      <>
                        {" "}
                        <a
                          href={p.fonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-800 underline"
                        >
                          fonte ↗
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </details>
        )}
      </td>
    </tr>
  );
}
