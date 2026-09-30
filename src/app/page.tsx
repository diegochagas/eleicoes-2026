import Link from "next/link";
import { Regua } from "@/components/Regua";
import { CARGOS } from "@/lib/cargos";
import { resumo } from "@/lib/dados";

const numero = (n: number) => n.toLocaleString("pt-BR");

export default function Inicio() {
  const naOrdemDaUrna = [...CARGOS].sort((a, b) => a.ordemNaUrna - b.ordemNaUrna);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border-4 border-slate-900 bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-400 p-6 shadow-[6px_6px_0_0_#0f172a] md:p-10">
        <h1 className="font-display text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
          Quem são os candidatos de 2026?
        </h1>
        <p className="mt-3 max-w-3xl text-xl font-bold text-slate-900">
          No domingo, 4 de outubro, quem mora no estado de São Paulo escolhe 6 pessoas em 5 cargos. Aqui estão todos os
          candidatos, arrumados em uma régua e com os alertas de cada um.
        </p>
      </section>

      <section aria-labelledby="como-ler" className="space-y-4">
        <h2 id="como-ler" className="font-display text-3xl font-extrabold">
          Como ler as listas
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0_0_#0f172a]">
            <h3 className="font-display text-2xl font-extrabold">📏 A régua</h3>
            <p className="mt-1 text-lg">
              Cada lista começa por quem está mais à <strong>direita</strong> e termina em quem está mais à{" "}
              <strong>esquerda</strong>. O lugar na régua vem das propostas e de estudos técnicos, não do que as pessoas
              falam na internet.
            </p>
          </div>
          <div className="rounded-3xl border-4 border-slate-900 bg-white p-5 shadow-[6px_6px_0_0_#0f172a]">
            <h3 className="font-display text-2xl font-extrabold">
              <span className="text-red-700">🔴 Nome em vermelho</span>
            </h3>
            <p className="mt-1 text-lg">
              O nome fica vermelho quando a pessoa votou para aumentar o próprio salário ou para se proteger, votou por
              mais impostos, ou tem acusação ou condenação na Justiça. Ao lado você lê o motivo e abre a fonte.
            </p>
          </div>
        </div>
        <Regua />
      </section>

      <section aria-labelledby="cargos" className="space-y-4">
        <h2 id="cargos" className="font-display text-3xl font-extrabold">
          Escolha um cargo
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARGOS.map((c) => {
            const r = resumo.cargos.find((x) => x.slug === c.slug);
            return (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  className={`block h-full rounded-3xl border-4 border-slate-900 bg-gradient-to-br ${c.cor} p-5 shadow-[6px_6px_0_0_#0f172a] transition-transform hover:-translate-y-1`}
                >
                  <span aria-hidden className="text-5xl">
                    {c.emoji}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-slate-900">{c.titulo}</h3>
                  <p className="font-bold text-slate-900">{c.oQueFaz}</p>
                  {r && (
                    <p className="mt-3 inline-block rounded-2xl border-2 border-slate-900 bg-white px-3 py-1 font-bold text-slate-900">
                      {numero(r.total)} candidatos · <span className="text-red-700">{numero(r.comAlerta)} em vermelho</span>
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="ordem" className="space-y-4">
        <h2 id="ordem" className="font-display text-3xl font-extrabold">
          A ordem na urna
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {naOrdemDaUrna.map((c) => (
            <li key={c.slug} className="rounded-2xl border-2 border-slate-900 bg-white p-3">
              <p className="font-display text-xl font-extrabold">
                {c.ordemNaUrna === 3 ? "3º e 4º" : `${c.ordemNaUrna}º`} <span aria-hidden>{c.emoji}</span>
              </p>
              <p className="font-bold">{c.tituloCurto}</p>
              <p className="text-slate-700">
                {c.digitos} dígitos{c.slug === "senador" ? ", duas vezes" : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
