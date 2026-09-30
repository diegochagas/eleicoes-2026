import type { Metadata } from "next";
import { Regua } from "@/components/Regua";
import { ROTULO_MOTIVO } from "@/lib/candidatos";
import { dataPorExtenso, resumo } from "@/lib/dados";
import { faixaDaNota } from "@/lib/espectro";
import type { Partido } from "@/lib/tipos";

export const metadata: Metadata = { title: "Como funciona" };

const nota = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ORIGEM: Record<Partido["origem"], string> = {
  pesquisa: "Pesquisa com cientistas políticos",
  fusao: "Média dos partidos que se juntaram",
  estimativa: "Estimativa deste site",
};

function Cartao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-3 rounded-3xl border-4 border-slate-900 bg-white p-5 text-lg shadow-[6px_6px_0_0_#0f172a]"
    >
      <h2 id={id} className="font-display text-3xl font-extrabold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function ComoFunciona() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl font-extrabold">Como este site foi feito</h1>

      <Cartao id="lista" titulo="🗂️ De onde vem a lista">
        <p>
          A lista de candidatos, os números e a situação de cada registro vêm do{" "}
          <a className="font-bold text-blue-800 underline" href="https://divulgacandcontas.tse.jus.br/">
            DivulgaCand, do Tribunal Superior Eleitoral
          </a>
          . Pegamos os cargos em que vota quem mora no estado de São Paulo (como em Praia Grande): presidente,
          governador, senador, deputado federal e deputado estadual. Quem renunciou não aparece. Quem teve o registro
          negado e ficou fora da urna só aparece se você pedir.
        </p>
      </Cartao>

      <Cartao id="regua" titulo="📏 Como montamos a régua">
        <Regua />
        <p>
          A régua vai de 0 (mais à esquerda) a 10 (mais à direita). Ela não usa o que as pessoas dizem dos candidatos
          nem o que eles dizem de si mesmos.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Presidente, governador e senador:</strong> cada candidato recebeu uma nota em economia (tamanho do
            governo, privatizações, impostos, gastos) e outra em costumes e segurança (polícia, drogas, armas, aborto,
            religião). A nota final é a média das duas. Olhamos os planos de governo entregues ao TSE (o
            texto inteiro para quase todos os candidatos a presidente; para governador e senador, reportagens que resumem
            os planos), como a pessoa votou quando foi parlamentar e o que fez quando governou. Quem não publicou
            propostas ficou com a nota do partido, e a explicação da linha avisa. Em cada linha, o botão
            “Por que está neste lugar da régua?” mostra o motivo e as propostas.
          </li>
          <li>
            <strong>Deputados:</strong> são mais de dois mil candidatos e quase nenhum publica plano de governo. Por
            isso cada um recebe a nota do seu partido, tirada de uma pesquisa em que cientistas políticos brasileiros
            deram notas a todos os partidos. Dentro do mesmo partido, a ordem é a do número na urna.
          </li>
        </ul>
        <p className="text-base text-slate-700">
          Fonte das notas dos partidos: {resumo.fontePartidos.citacao}{" "}
          <a className="font-bold text-blue-800 underline" href={resumo.fontePartidos.url}>
            Abrir o estudo ↗
          </a>{" "}
          {resumo.fontePartidos.nota} As faixas (“direita”, “centro-esquerda”…) usam os mesmos limites do estudo. Onde o
          estudo escreve “extrema”, o site escreve “bem à”, porque a palavra ali só indica a ponta da régua.
        </p>
        <div className="overflow-x-auto" role="region" aria-label="Nota de cada partido na régua" tabIndex={0}>
          <table className="w-full min-w-[36rem] text-left text-base">
            <caption className="sr-only">Nota de cada partido na régua</caption>
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th scope="col" className="py-2 pr-3">
                  Partido
                </th>
                <th scope="col" className="py-2 pr-3">
                  Nota
                </th>
                <th scope="col" className="py-2 pr-3">
                  Faixa
                </th>
                <th scope="col" className="py-2">
                  De onde vem a nota
                </th>
              </tr>
            </thead>
            <tbody>
              {resumo.partidos.map((p) => {
                const faixa = faixaDaNota(p.nota);
                return (
                  <tr key={p.sigla} className="border-b border-slate-200 align-top">
                    <th scope="row" className="py-2 pr-3">
                      {p.sigla}
                      <span className="block text-sm font-normal text-slate-600">{p.nome}</span>
                    </th>
                    <td className="py-2 pr-3 font-bold">{nota(p.nota)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap"
                        style={{ backgroundColor: faixa.cor, color: faixa.corTexto }}
                      >
                        {faixa.rotulo}
                      </span>
                    </td>
                    <td className="py-2 text-sm">
                      {ORIGEM[p.origem]}
                      {p.observacao && <span className="block text-slate-600">{p.observacao}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cartao>

      <Cartao id="vermelho" titulo="🔴 Quando o nome fica vermelho">
        <p>O nome fica vermelho quando existe pelo menos um destes fatos, sempre com fonte:</p>
        <ul className="space-y-2">
          <li>
            <strong>
              {ROTULO_MOTIVO.beneficio_proprio.emoji} {ROTULO_MOTIVO.beneficio_proprio.rotulo}:
            </strong>{" "}
            votou, assinou ou aprovou aumento do próprio salário ou regra que ajuda os próprios políticos.
          </li>
          <li>
            <strong>
              {ROTULO_MOTIVO.imposto.emoji} {ROTULO_MOTIVO.imposto.rotulo}:
            </strong>{" "}
            votou a favor de criar ou aumentar imposto, ou criou ou aumentou imposto quando governava. O motivo diz qual
            imposto e quem paga, para você julgar.
          </li>
          <li>
            <strong>
              {ROTULO_MOTIVO.corrupcao.emoji} {ROTULO_MOTIVO.corrupcao.rotulo}:
            </strong>{" "}
            investigação, denúncia, processo ou condenação por corrupção ou mau uso de dinheiro público.
          </li>
          <li>
            <strong>
              {ROTULO_MOTIVO.justica.emoji} {ROTULO_MOTIVO.justica.rotulo}:
            </strong>{" "}
            outras condenações, processos como réu, punições da Justiça Eleitoral ou registro negado por
            inelegibilidade.
          </li>
        </ul>
        <p>
          A regra é a mesma para todos os partidos. Cada motivo mostra a <strong>situação</strong> do caso: investigado,
          denunciado, réu, condenado, e também quando o caso foi arquivado, anulado ou terminou em absolvição. Uma
          denúncia não é uma condenação.
        </p>
      </Cartao>

      <Cartao id="votacoes" titulo="🗳️ As votações que contamos">
        <p>
          Só entram votações em que o voto de cada deputado ficou registrado. Votações “simbólicas”, sem lista de
          nomes, ficam de fora porque não dá para saber quem votou como. Foi o caso do aumento do fundo eleitoral de
          2026, do reajuste dos servidores do Congresso e, na Assembleia de SP, do aumento de 5% no salário do governador
          em 2025.
        </p>
        <ul className="space-y-3">
          {resumo.votacoes.map((v) => (
            <li key={v.chave} className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 text-base">
              <p className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
                {ROTULO_MOTIVO[v.tipo].emoji} {v.casa} · {v.projeto} · {dataPorExtenso(v.data)} · entra quem votou “
                {v.votoAlerta}”
              </p>
              <p className="mt-1">{v.texto}</p>
              <a className="text-sm font-bold text-blue-800 underline" href={v.fonte}>
                Ver o projeto ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="text-base text-slate-700">
          A reforma tributária de 2023 não entra como “mais imposto”: ela troca impostos antigos por novos e foi
          desenhada para não aumentar o total cobrado.
        </p>
      </Cartao>

      <Cartao id="limites" titulo="⚠️ O que este site não consegue dizer">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Vermelho não quer dizer culpado, e nome sem vermelho não quer dizer ficha limpa. Quer dizer só que a nossa
            pesquisa não achou nada com fonte confiável.
          </li>
          <li>
            A pesquisa de processos olhou um a um os candidatos a presidente, governador e senador,{" "}
            {resumo.pesquisados["deputado-federal"]} candidatos a deputado federal e{" "}
            {resumo.pesquisados["deputado-estadual"]} a deputado estadual (quem já tem mandato e os nomes mais
            conhecidos). Os outros candidatos a deputado <strong>não foram pesquisados</strong>: neles, “nada
            encontrado” quer dizer só que não olhamos.
          </li>
          <li>
            Quem nunca foi deputado não tem voto registrado. Por isso os deputados atuais aparecem mais em vermelho do
            que os novatos.
          </li>
          <li>
            A nota do partido é uma média. Dois candidatos do mesmo partido podem pensar bem diferente um do outro.
          </li>
          <li>Os dados são de {dataPorExtenso(resumo.geradoEm)}. Processos e registros podem mudar depois disso.</li>
        </ul>
      </Cartao>
    </div>
  );
}
