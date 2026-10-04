import type { Metadata } from "next";
import { MeusCandidatos } from "@/components/MeusCandidatos";

export const metadata: Metadata = { title: "Meus candidatos" };

export default function PaginaMeusCandidatos() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border-4 border-slate-900 bg-gradient-to-br from-yellow-300 to-orange-300 p-5 shadow-[6px_6px_0_0_#0f172a]">
        <h1 className="font-display text-4xl font-extrabold text-slate-900">⭐ Meus candidatos</h1>
        <p className="mt-1 text-xl font-bold text-slate-900">
          Seu voto em cada cargo e o que ainda falta escolher. Use o botão Favoritar nas listas.
        </p>
      </section>
      <MeusCandidatos />
    </div>
  );
}
