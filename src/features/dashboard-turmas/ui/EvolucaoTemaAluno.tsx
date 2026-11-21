import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { buscarEvolucaoTemasAluno } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import type { EvolucaoTema } from '../../../entities/dashboardTurma/model/types';
import { ModalDetalheEntrega } from './ModalDetalheEntrega';

type Props = {
  turmaId: string;
  alunoId: string;
  nomeAluno: string;
  periodo?: { inicio: string; fim: string };
};

type Semestre = 1 | 2;

const periodoDoSemestre = (ano: number, semestre: Semestre) => {
  if (semestre === 1) {
    return {
      inicio: `${ano}-01-01T00:00:00.000Z`,
      fim: `${ano}-06-30T23:59:59.999Z`,
    };
  }
  return {
    inicio: `${ano}-07-01T00:00:00.000Z`,
    fim: `${ano}-12-31T23:59:59.999Z`,
  };
};

const formatarData = (data: string) =>
  new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

const formatarVariacao = (variacao: number | null) => {
  if (variacao === null) return '—';
  return `${variacao > 0 ? '+' : ''}${variacao} pp`;
};

export const EvolucaoTemaAluno = ({ turmaId, alunoId, nomeAluno, periodo }: Props) => {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const [semestre, setSemestre] = useState<Semestre>(agora.getMonth() < 6 ? 1 : 2);
  const [temas, setTemas] = useState<EvolucaoTema[]>([]);
  const [temaSelecionadoId, setTemaSelecionadoId] = useState<string | null>(null);
  const [listaSelecionadaId, setListaSelecionadaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const periodoConsulta = useMemo(
    () => periodo ?? periodoDoSemestre(anoAtual, semestre),
    [anoAtual, periodo, semestre],
  );
  const periodoInicio = periodoConsulta.inicio;
  const periodoFim = periodoConsulta.fim;

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setCarregando(true);
      setErro(false);

      try {
        const dados = await buscarEvolucaoTemasAluno(turmaId, alunoId, {
          inicio: periodoInicio,
          fim: periodoFim,
        });
        if (!ativo) return;

        setTemas(dados.temas);
        setTemaSelecionadoId((atual) => {
          if (atual && dados.temas.some((tema) => tema.temaId === atual)) return atual;
          return dados.temas[0]?.temaId ?? null;
        });
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, [turmaId, alunoId, periodoInicio, periodoFim]);

  const temaSelecionado = useMemo(
    () => temas.find((tema) => tema.temaId === temaSelecionadoId) ?? null,
    [temas, temaSelecionadoId],
  );

  if (carregando) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin text-teal-500" />
        Carregando evolução por tema...
      </div>
    );
  }

  if (erro) {
    return (
      <div role="alert" className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-red-700">
        <AlertCircle size={22} />
        Não foi possível carregar a evolução por tema.
      </div>
    );
  }

  if (temas.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Nenhuma lista com temas foi encontrada no período.
      </p>
    );
  }

  return (
    <>
      {!periodo && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">Período de {anoAtual}</p>
          <div className="flex rounded-lg bg-gray-100 p-1">
            {([1, 2] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setSemestre(opcao)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  semestre === opcao
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opcao}º semestre
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Selecione um tema
        </p>
        <div className="flex flex-wrap gap-2">
          {temas.map((tema) => {
            const selecionado = tema.temaId === temaSelecionadoId;
            return (
              <button
                key={tema.temaId}
                type="button"
                onClick={() => setTemaSelecionadoId(tema.temaId)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  selecionado
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                }`}
              >
                {tema.nome}
              </button>
            );
          })}
        </div>
      </div>

      {temaSelecionado && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Publicação</th>
                  <th className="px-4 py-3">Lista</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Acerto</th>
                  <th className="px-4 py-3">Variação</th>
                  <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {temaSelecionado.resultados.map((resultado) => {
                  const entregue = resultado.status === 'SUBMETIDA';
                  return (
                    <tr key={resultado.listaTurmaId}>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {formatarData(resultado.publicadaEm)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{resultado.nomeLista}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {entregue ? `${resultado.acertos} de ${resultado.totalQuestoes}` : 'Pendente'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {entregue ? `${resultado.taxaAcerto}%` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatarVariacao(resultado.variacaoPp)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {entregue && (
                          <button
                            type="button"
                            onClick={() => setListaSelecionadaId(resultado.listaTurmaId)}
                            className="font-semibold text-teal-700 hover:text-teal-900"
                          >
                            Ver entrega
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {temaSelecionado.mensagem && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {temaSelecionado.mensagem}
            </p>
          )}
        </>
      )}

      {listaSelecionadaId && (
        <ModalDetalheEntrega
          turmaId={turmaId}
          listaId={listaSelecionadaId}
          alunoId={alunoId}
          nomeAluno={nomeAluno}
          onBack={() => setListaSelecionadaId(null)}
        />
      )}
    </>
  );
};
