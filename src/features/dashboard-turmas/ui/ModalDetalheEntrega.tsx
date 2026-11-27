import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { buscarDetalheEntrega } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import type { DetalheEntrega, DetalheQuestaoEntrega } from '../../../entities/dashboardTurma/model/types';

type Props = {
  turmaId: string;
  listaId: string;
  alunoId: string;
  rotuloVoltar: string;
  onBack: () => void;
};

const resultadoVisual: Record<DetalheQuestaoEntrega['resultado'], {
  texto: string;
  classe: string;
}> = {
  ACERTO: { texto: 'Acertou', classe: 'bg-gray-50 text-emerald-700' },
  ERRO: { texto: 'Errou', classe: 'bg-red-50 text-red-700' },
  NAO_RESPONDIDA: { texto: 'Não respondida', classe: 'bg-amber-50 text-amber-800' },
};

const formatarDataPublicacao = (dataPublicacao: string) => {
  const data = new Date(dataPublicacao);
  return Number.isNaN(data.getTime()) ? dataPublicacao : data.toLocaleDateString('pt-BR');
};

/** Detalhe de uma entrega dentro da janela de acompanhamento do aluno. */
export const ModalDetalheEntrega = ({ turmaId, listaId, alunoId, rotuloVoltar, onBack }: Props) => {
  const [detalhe, setDetalhe] = useState<DetalheEntrega | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setDetalhe(null);
      setErro(false);

      try {
        const dados = await buscarDetalheEntrega(turmaId, listaId, alunoId);
        if (ativo) setDetalhe(dados);
      } catch {
        if (ativo) setErro(true);
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, [turmaId, listaId, alunoId]);

  return (
    <section aria-labelledby="titulo-detalhe-entrega" className="pt-5">
      <h4 id="titulo-detalhe-entrega" className="text-lg font-bold text-gray-900">
        {detalhe?.lista.nome ?? 'Detalhe da entrega'}
      </h4>
      {detalhe && (
        <p className="mt-1 text-sm text-gray-700">
          Publicada em {formatarDataPublicacao(detalhe.lista.publicadaEm)}
        </p>
      )}
      <div className="mt-2">
        {!detalhe && !erro && (
          <div role="status" className="flex items-center gap-2 py-4 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin text-teal-500" /> Carregando resultado da entrega...
          </div>
        )}

        {erro && (
          <div role="alert" className="flex items-center gap-2 py-4 text-sm text-red-700">
            <AlertCircle size={24} /> Não foi possível carregar esta entrega.
          </div>
        )}

        {detalhe && (
          <>
            <p className="mb-5 text-sm font-bold text-emerald-700">
              {detalhe.resumo.acertos} {detalhe.resumo.acertos === 1 ? 'acerto' : 'acertos'}
              {' · '}{detalhe.resumo.erros} {detalhe.resumo.erros === 1 ? 'erro' : 'erros'}
              {detalhe.resumo.naoRespondidas > 0 && ` · ${detalhe.resumo.naoRespondidas} sem resposta`}
              {' · '}{detalhe.resumo.taxaAcerto}% de acerto
            </p>

            <ol className="space-y-2">
              {detalhe.questoes.map((questao) => {
                const visual = resultadoVisual[questao.resultado];
                return (
                  <li key={questao.questaoId} className={`rounded-lg p-3 ${visual.classe}`}>
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-words text-sm font-bold text-gray-900">{questao.ordem}. {questao.enunciado}</p>
                      <span className="shrink-0 text-xs font-bold">
                        {visual.texto}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Resposta do aluno: </span>
                      {questao.respostaAluno
                        ? `${questao.respostaAluno.alternativa}. ${questao.respostaAluno.texto}`
                        : 'Não respondida'}
                    </p>
                    {questao.gabarito && (
                      <p className="mt-1 text-sm text-gray-900">
                        <span className="font-semibold">Gabarito: </span>
                        {questao.gabarito.alternativa}. {questao.gabarito.texto}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      <footer className="mt-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-50">
          <ArrowLeft size={14} aria-hidden="true" /> {rotuloVoltar}
        </button>
      </footer>
    </section>
  );
};
