import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { buscarEvolucaoTemasAluno } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import type { EvolucaoTema } from '../../../entities/dashboardTurma/model/types';

type Props = {
  onVerEntrega?: (listaId: string) => void;
  turmaId: string;
  alunoId: string;
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
  new Date(data)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .replace(' de ', ' ')
    .replace('.', '');

const formatarVariacao = (variacao: number | null) => {
  if (variacao === null) return '—';
  return `${variacao > 0 ? '+' : ''}${variacao} pontos percentuais`;
};

export const EvolucaoTemaAluno = ({ turmaId, alunoId, periodo, onVerEntrega }: Props) => {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const [semestre, setSemestre] = useState<Semestre>(agora.getMonth() < 6 ? 1 : 2);
  const [temas, setTemas] = useState<EvolucaoTema[]>([]);
  const [temaSelecionadoId, setTemaSelecionadoId] = useState<string | null>(null);
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
  const variacaoMaisRecente = useMemo(
    () => [...(temaSelecionado?.resultados ?? [])]
      .reverse()
      .find((resultado) => resultado.variacaoPp !== null)?.variacaoPp ?? null,
    [temaSelecionado],
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

  return (
    <>
      <div className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {temas.map((tema) => {
            const selecionado = tema.temaId === temaSelecionadoId;
            return (
              <button
                key={tema.temaId}
                type="button"
                onClick={() => setTemaSelecionadoId(tema.temaId)}
                className={`max-w-full break-words rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  selecionado
                    ? 'border-teal-100 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tema.nome}
              </button>
            );
          })}
        </div>

        {!periodo && (
          <div className="flex shrink-0 gap-2 whitespace-nowrap" aria-label={`Período de ${anoAtual}`}>
            {([1, 2] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setSemestre(opcao)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  semestre === opcao
                    ? 'border-teal-100 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opcao}º semestre
              </button>
            ))}
          </div>
        )}
      </div>

      {temas.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Nenhuma lista com temas foi encontrada no período.</p>
      )}

      {temaSelecionado && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-3 pr-4">Publicação</th>
                  <th className="px-4 pb-3">Lista</th>
                  <th className="px-4 pb-3">Resultado</th>
                  <th className="px-4 pb-3">Acerto</th>
                </tr>
              </thead>
              <tbody>
                {temaSelecionado.resultados.map((resultado) => {
                  const entregue = resultado.status === 'SUBMETIDA';
                  return (
                    <tr key={resultado.listaTurmaId}>
                      <td className="whitespace-nowrap py-3 pr-4 text-gray-600">
                        {formatarData(resultado.publicadaEm)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{resultado.nomeLista}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {entregue ? `${resultado.acertos} de ${resultado.totalQuestoes}` : 'Pendente'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {entregue ? `${resultado.taxaAcerto}%` : '—'}
                        {entregue && onVerEntrega && (
                          <button type="button" className="ml-3 font-semibold text-teal-700" onClick={() => onVerEntrega(resultado.listaTurmaId)}>
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

          {variacaoMaisRecente !== null ? (
            <p className="mt-4 text-sm font-bold text-green-600">
              Variação entre entregas: {formatarVariacao(variacaoMaisRecente)}
            </p>
          ) : temaSelecionado.mensagem ? (
            <p className="mt-4 text-sm font-medium text-amber-700">{temaSelecionado.mensagem}</p>
          ) : null}

        </>
      )}

    </>
  );
};
