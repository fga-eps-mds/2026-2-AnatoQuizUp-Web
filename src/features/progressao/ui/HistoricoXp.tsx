import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, SearchX, Sparkles } from 'lucide-react';

import { buscarHistoricoXp } from '../progressaoService';
import type { HistoricoXpItem, OrigemXp } from '../types';

const LIMITE = 10;

// Rotulo legivel de cada origem de XP.
const ROTULO_ORIGEM: Record<OrigemXp, string> = {
  QUIZ_CONCLUIDO: 'Quiz concluído',
};

const formatarData = (iso: string) => {
  const data = new Date(iso);
  return Number.isNaN(data.getTime())
    ? '—'
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

/** Descricao do quiz relacionado a uma entrada de XP (tema, dificuldade e placar). */
const descreverQuiz = (item: HistoricoXpItem) => {
  if (!item.quiz) return '—';
  const partes = [item.quiz.tema ?? 'Quiz', item.quiz.dificuldade].filter(Boolean).join(' · ');
  return `${partes} (${item.quiz.totalAcertos}/${item.quiz.totalQuestoes} acertos)`;
};

/**
 * Historico de XP recebido pelo aluno: data, origem, quiz relacionado e valor,
 * com paginacao.
 */
export const HistoricoXp = () => {
  const [itens, setItens] = useState<HistoricoXpItem[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    buscarHistoricoXp({ page: pagina, limit: LIMITE })
      .then((resposta) => {
        if (!ativo) return;
        setItens(resposta.dados);
        setTotalPaginas(Math.max(1, resposta.metadados.totalPages));
        setErro(null);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setItens([]);
        setErro(error instanceof Error ? error.message : 'Erro ao carregar o histórico de XP.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [pagina]);

  const irPara = (novaPagina: number) => {
    setCarregando(true);
    setPagina(novaPagina);
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#14D5C2]" />
        <p className="font-bold text-[#0A1128]">Carregando seu XP...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <p className="m-6 rounded-2xl bg-rose-50 px-4 py-4 text-sm font-bold text-rose-600">{erro}</p>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="mb-4 h-12 w-12 text-[#0A1128]/20" />
        <p className="text-lg font-bold text-[#0A1128]">Nenhum XP recebido ainda</p>
        <p className="mt-1 text-sm text-[#0A1128]/50">Conclua um quiz para ganhar XP.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto p-6">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wider text-[#0A1128]/50">
              <th scope="col" className="px-4 pb-4">Data</th>
              <th scope="col" className="px-4 pb-4">Origem</th>
              <th scope="col" className="px-4 pb-4">Quiz</th>
              <th scope="col" className="px-4 pb-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[#0A1128]">
                  {formatarData(item.data)}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-[#0A1128]/70">
                  {ROTULO_ORIGEM[item.origem] ?? item.origem}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-[#0A1128]/70">
                  {descreverQuiz(item)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black tabular-nums text-[#7C3AED]">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />+
                    {item.valor.toLocaleString('pt-BR')} XP
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-end gap-1 border-t border-gray-100 bg-gray-50 p-6">
          <button
            type="button"
            aria-label="Página anterior"
            onClick={() => irPara(pagina - 1)}
            disabled={pagina === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0A1128] hover:bg-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm font-bold tabular-nums text-[#0A1128]">
            {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            onClick={() => irPara(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0A1128] hover:bg-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
