// Resultado da estacao OSCE: as duas medidas que o BFF devolve ao finalizar — o
// checklist ponderado (detalhe item a item) e a nota global do examinador (julgamento
// holistico, independente da soma). Mostrar as duas e o padrao em OSCE; mostrar quando
// elas discordam e o que impede o aluno de confiar num numero que nao se sustenta.
// Ver docs/arquitetura/chatbot-osce.md, secao 5.
import { AlertTriangle, CheckCircle2, CircleSlash, MinusCircle, Scale } from 'lucide-react';

import type {
  AvaliacaoOsce,
  ItemAvaliado,
  NivelChecklist,
  NivelDesempenho,
} from '../../../features/osce/osceService';

const CORES_CHECKLIST: Record<NivelChecklist, string> = {
  excelente: 'bg-emerald-100 text-emerald-800',
  bom: 'bg-teal-100 text-teal-800',
  suficiente: 'bg-sky-100 text-sky-800',
  limitrofe: 'bg-amber-100 text-amber-800',
  insuficiente: 'bg-rose-100 text-rose-800',
};

const NIVEL_ITEM: Record<
  NivelDesempenho,
  { rotulo: string; cor: string; Icone: typeof CheckCircle2 }
> = {
  competente: { rotulo: 'Competente', cor: 'text-emerald-600', Icone: CheckCircle2 },
  parcial: { rotulo: 'Parcialmente', cor: 'text-amber-600', Icone: MinusCircle },
  nao_realizado: { rotulo: 'Não realizado', cor: 'text-rose-600', Icone: CircleSlash },
};

// Mantem a ordem em que os dominios aparecem no checklist do cenario.
function agruparPorDominio(itens: ItemAvaliado[]): [string, ItemAvaliado[]][] {
  const grupos = new Map<string, ItemAvaliado[]>();
  for (const item of itens) {
    grupos.set(item.dominio, [...(grupos.get(item.dominio) ?? []), item]);
  }
  return [...grupos.entries()];
}

// "1.5 / 2" sem casa decimal desnecessaria — meio ponto so aparece quando existe.
const formatarPontos = (valor: number) => (Number.isInteger(valor) ? `${valor}` : valor.toFixed(1));

export const FeedbackResultado = ({ avaliacao }: { avaliacao: AvaliacaoOsce }) => (
  <section
    aria-label="Resultado da estação OSCE"
    className="mt-5 rounded-lg border border-[#0D9488]/30 bg-white p-4 shadow-sm"
  >
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#0D9488]">
          Feedback do examinador
        </p>
        <p className="text-sm font-medium text-[#64748B]">
          Diagnóstico esperado: {avaliacao.diagnosticoEsperado}
        </p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          avaliacao.aprovado ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}
      >
        {avaliacao.aprovado ? 'Aprovado' : 'Não aprovado'}
      </span>
    </header>

    {/* As duas medidas lado a lado, como num OSCE real: checklist e nota global. */}
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-[#F8FAFC] p-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
          Checklist ponderado
        </p>
        <p className="mt-1 text-sm font-black text-[#0A1128]">
          {formatarPontos(avaliacao.pontuacao)} / {avaliacao.pontuacaoMaxima} pts
          <span className="ml-1.5 font-bold text-[#64748B]">({avaliacao.percentual}%)</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-black ${CORES_CHECKLIST[avaliacao.nivelChecklist]}`}
          >
            {avaliacao.rotuloChecklist}
          </span>
        </p>
      </div>

      <div className="rounded-lg bg-[#F8FAFC] p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#64748B]">
          <Scale className="h-3 w-3" aria-hidden="true" />
          Nota global ({avaliacao.notaGlobal}/4)
        </p>
        <p className="mt-1 text-sm font-black text-[#0A1128]">{avaliacao.rotuloNotaGlobal}</p>
        <p className="mt-0.5 text-xs font-medium text-[#64748B]">{avaliacao.ancoraNotaGlobal}</p>
        {avaliacao.justificativaNotaGlobal && (
          <p className="mt-1 text-xs font-medium italic text-[#0A1128]/70">
            {avaliacao.justificativaNotaGlobal}
          </p>
        )}
      </div>
    </div>

    {avaliacao.divergente && (
      <p
        role="alert"
        className="mt-3 flex gap-2 rounded-lg bg-sky-50 p-3 text-xs font-bold text-sky-900"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          O checklist e a nota global discordaram bastante nesta simulação. Isso costuma
          significar que o caso saiu do que esta avaliação consegue medir, então leve o resultado
          ao professor em vez de tomá-lo como veredito.
        </span>
      </p>
    )}

    {avaliacao.itensCriticosNaoCumpridos.length > 0 && (
      <p
        role="alert"
        className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Item crítico não cumprido — a nota do checklist fica limitada a &quot;Limítrofe&quot;
          mesmo com bom desempenho no restante: {avaliacao.itensCriticosNaoCumpridos.join('; ')}.
        </span>
      </p>
    )}

    {agruparPorDominio(avaliacao.itens).map(([dominio, itens]) => {
      const pontos = itens.reduce((total, item) => total + item.pontos, 0);
      const maximo = itens.reduce((total, item) => total + item.pontosMaximos, 0);

      return (
        <div key={dominio} className="mt-4">
          <p className="flex items-baseline justify-between text-xs font-black uppercase tracking-wider text-[#0A1128]">
            {dominio}
            <span className="font-bold text-[#64748B]">
              {formatarPontos(pontos)} / {maximo} pts
            </span>
          </p>

          <ul className="mt-2 flex flex-col gap-2">
            {itens.map((item) => {
              const { rotulo, cor, Icone } = NIVEL_ITEM[item.nivel];

              return (
                <li key={item.id} className="rounded-lg bg-[#F8FAFC] p-3">
                  <div className="flex items-start gap-2">
                    <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${cor}`} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0A1128]">
                        {item.descricao}
                        {item.critico && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                            Crítico
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#64748B]">
                        Crédito cheio: {item.ancoras.competente}
                      </p>
                      {item.ancoras.parcial && (
                        <p className="text-xs font-medium text-[#64748B]">
                          Crédito parcial: {item.ancoras.parcial}
                        </p>
                      )}
                      {item.justificativa && (
                        <p className="mt-1 text-xs font-medium italic text-[#0A1128]/70">
                          {item.justificativa}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-black ${cor}`}>
                      {rotulo} · {formatarPontos(item.pontos)}/{item.pontosMaximos}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      );
    })}

    {avaliacao.comentarioFinal && (
      <p className="mt-4 whitespace-pre-wrap border-t border-[#E2E8F0] pt-3 text-sm font-medium leading-relaxed text-[#0A1128]/80">
        {avaliacao.comentarioFinal}
      </p>
    )}

    <p className="mt-3 border-t border-[#E2E8F0] pt-2 text-[11px] font-medium text-[#94A3B8]">
      Resultado formativo: uma estação isolada avaliada por IA não substitui um OSCE (a
      literatura pede 14–18 estações para uma medida confiável) nem vale como nota da disciplina.
    </p>
  </section>
);
