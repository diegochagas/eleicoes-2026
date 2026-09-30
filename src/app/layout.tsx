import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Link from "next/link";
import { dataPorExtenso, resumo } from "@/lib/dados";
import "./globals.css";

const titulo = Baloo_2({ variable: "--font-titulo", subsets: ["latin"], weight: ["600", "800"] });
const corpo = Nunito({ variable: "--font-corpo", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Régua do Voto — Eleições 2026 em São Paulo",
    template: "%s · Régua do Voto 2026",
  },
  description:
    "Todos os candidatos de 2026 para quem vota em São Paulo, da direita para a esquerda, com os motivos de alerta de cada um e as fontes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b-4 border-slate-900 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-display text-2xl font-extrabold text-slate-900">
              <span aria-hidden className="text-3xl">
                🗳️
              </span>
              Régua do Voto
              <span className="rounded-full bg-yellow-300 px-3 py-0.5 text-base">2026</span>
            </Link>
            <nav aria-label="Principal" className="flex gap-4 text-base font-bold">
              <Link href="/" className="text-slate-800 underline-offset-4 hover:underline">
                Início
              </Link>
              <Link href="/como-funciona" className="text-slate-800 underline-offset-4 hover:underline">
                Como funciona
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t-4 border-slate-900 bg-white">
          <div className="mx-auto w-full max-w-6xl space-y-2 px-4 py-5 text-sm text-slate-700">
            <p>
              <strong>Nome em vermelho não quer dizer culpado.</strong> Quer dizer que achamos um fato público sobre a
              pessoa, com fonte. E nome sem vermelho não é garantia de nada: só quer dizer que a nossa pesquisa não
              achou. Na dúvida, clique na fonte e leia.
            </p>
            <p>
              Lista de candidatos: Tribunal Superior Eleitoral (DivulgaCand). Votações: Câmara dos Deputados e Assembleia
              Legislativa de SP. Dados atualizados em {dataPorExtenso(resumo.geradoEm)}.{" "}
              <Link href="/como-funciona" className="font-bold underline">
                Veja como o site foi feito
              </Link>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
