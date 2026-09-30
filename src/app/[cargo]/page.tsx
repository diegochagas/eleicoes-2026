import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AbasCargos } from "@/components/AbasCargos";
import { ListaCandidatos } from "@/components/ListaCandidatos";
import { Regua } from "@/components/Regua";
import { CARGOS, infoDoCargo } from "@/lib/cargos";
import { carregarCargo } from "@/lib/dados";

export const dynamicParams = false;

export function generateStaticParams() {
  return CARGOS.map((c) => ({ cargo: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[cargo]">): Promise<Metadata> {
  const info = infoDoCargo((await params).cargo);
  return info ? { title: info.titulo } : {};
}

export default async function PaginaCargo({ params }: PageProps<"/[cargo]">) {
  const info = infoDoCargo((await params).cargo);
  if (!info) notFound();
  const { candidatos } = await carregarCargo(info.slug);

  return (
    <div className="space-y-6">
      <AbasCargos atual={info.slug} />

      <section className={`rounded-3xl border-4 border-slate-900 bg-gradient-to-br ${info.cor} p-5 shadow-[6px_6px_0_0_#0f172a]`}>
        <h1 className="font-display text-4xl font-extrabold text-slate-900">
          <span aria-hidden>{info.emoji}</span> {info.titulo}
        </h1>
        <p className="mt-1 text-xl font-bold text-slate-900">{info.oQueFaz}</p>
        <p className="mt-3 inline-block rounded-2xl border-2 border-slate-900 bg-white px-3 py-1.5 font-bold">
          🔢 Na urna, o número tem {info.digitos} dígitos.{info.dica ? ` ${info.dica}` : ""}
        </p>
      </section>

      <Regua />

      <ListaCandidatos candidatos={candidatos} comFiltros={candidatos.length > 40} />
    </div>
  );
}
