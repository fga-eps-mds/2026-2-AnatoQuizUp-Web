import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, CircleSlash2, Loader2, XCircle } from 'lucide-react';
import { buscarDetalheEntrega } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import type { DetalheEntrega, DetalheQuestaoEntrega } from '../../../entities/dashboardTurma/model/types';

type Props = {
  turmaId: string;
  listaId: string;
  alunoId: string;
  nomeAluno: string;
  onBack: () => void;
};

const resultadoVisual: Record<DetalheQuestaoEntrega['resultado'], {
  texto: string;
  classe: string;
  Icone: typeof CheckCircle2;
}> = {
  ACERTO: { texto: 'Acertou', classe: 'bg-emerald-50 text-emerald-700', Icone: CheckCircle2 },
  ERRO: { texto: 'Errou', classe: 'bg-red-50 text-red-700', Icone: XCircle },
  NAO_RESPONDIDA: { texto: 'Não respondida', classe: 'bg-amber-50 text-amber-800', Icone: CircleSlash2 },
};

const formatarDataPublicacao = (dataPublicacao: string) => {
  const data = new Date(dataPublicacao);
  return Number.isNaN(data.getTime()) ? dataPublicacao : data.toLocaleDateString('pt-BR');
};

/** Modal reutilizavel do detalhe de uma entrega dentro do dashboard do professor. */
export const ModalDetalheEntrega = ({ turmaId, listaId, alunoId, nomeAluno, onBack }: Props) => {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 px-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe-entrega"
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Entrega de {nomeAluno}</p>
            <h3 id="titulo-detalhe-entrega" className="mt-1 text-lg font-bold text-gray-900">
              {detalhe?.lista.nome ?? 'Carregando entrega...'}
            </h3>
            {detalhe && (
              <p className="mt-1 text-xs text-gray-500">
                Publicada em {formatarDataPublicacao(detalhe.lista.publicadaEm)}
              </p>
            )}
          </div>
          <button type="button" aria-label="Fechar detalhes da entrega" onClick={onBack} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {!detalhe && !erro && (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin text-teal-500" /> Carregando resultado da entrega...
            </div>
          )}

          {erro && (
            <div role="alert" className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-red-700">
              <AlertCircle size={24} /> Não foi possível carregar esta entrega.
            </div>
          )}

          {detalhe && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ResumoCard rotulo="Acertos" valor={detalhe.resumo.acertos} classe="text-emerald-700" />
                <ResumoCard rotulo="Erros" valor={detalhe.resumo.erros} classe="text-red-700" />
                <ResumoCard rotulo="Não respondidas" valor={detalhe.resumo.naoRespondidas} classe="text-amber-800" />
                <ResumoCard rotulo="Taxa de acerto" valor={`${detalhe.resumo.taxaAcerto}%`} classe="text-teal-700" />
              </div>

              <ol className="space-y-3">
                {detalhe.questoes.map((questao) => {
                  const visual = resultadoVisual[questao.resultado];
                  const Icone = visual.Icone;
                  return (
                    <li key={questao.questaoId} className="rounded-xl border border-gray-200 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <p className="font-semibold text-gray-900">{questao.ordem}. {questao.enunciado}</p>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${visual.classe}`}>
                          <Icone size={14} /> {visual.texto}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Resposta do aluno: </span>
                        {questao.respostaAluno
                          ? `${questao.respostaAluno.alternativa}. ${questao.respostaAluno.texto}`
                          : 'Não respondida'}
                      </p>
                      {questao.gabarito && (
                        <p className="mt-2 text-sm text-teal-800">
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

        <footer className="border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            <ArrowLeft size={16} /> Voltar à visualização anterior
          </button>
        </footer>
      </section>
    </div>
  );
};

const ResumoCard = ({ rotulo, valor, classe }: { rotulo: string; valor: string | number; classe: string }) => (
  <div className="rounded-lg bg-gray-50 p-3 text-center">
    <p className={`text-lg font-bold ${classe}`}>{valor}</p>
    <p className="text-xs text-gray-500">{rotulo}</p>
  </div>
);
