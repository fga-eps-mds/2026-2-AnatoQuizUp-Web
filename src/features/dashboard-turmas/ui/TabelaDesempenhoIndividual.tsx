import { useEffect, useState } from 'react';
import { HistoricoListasAluno } from './HistoricoListasAluno';
import { EvolucaoTemaAluno } from './EvolucaoTemaAluno';
import { ModalDetalheEntrega } from './ModalDetalheEntrega';
import { BarChart3, X } from 'lucide-react';
import { buscarDesempenhoIndividual } from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import { buscarUsuariosPorIds } from '../../../entities/usuarios/api/usuarioApi';
import type { DesempenhoAluno } from '../../../entities/dashboardTurma/model/types';
import type { UsuarioResumo } from '../../../entities/usuarios/model/types';

// Une as estatisticas de desempenho do aluno com seus dados de usuario (ou null se nao resolvido).
type AlunoComDesempenho = DesempenhoAluno & { usuario: UsuarioResumo | null };

interface Props {
  turmaId: string;
}

// Paleta de cores dos avatares; a cor e escolhida de forma deterministica pelo id do aluno.
const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-cyan-500',
];

/** Escolhe deterministicamente uma cor de avatar a partir do id (soma dos code points). */
function avatarColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Deriva as iniciais (1 a 2 letras) do nome para exibir no avatar. */
function initials(nome: string): string {
  const parts = nome.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
}

/**
 * Formata a data da ultima atividade de forma relativa ("Hoje"/"Ontem" com hora)
 * ou como data curta em PT-BR para dias anteriores.
 */
function formatarData(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);

  // Compara apenas dia/mes/ano, ignorando o horario.
  const mesmodia = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');

  if (mesmodia(d, hoje)) return `Hoje, ${hh}h${mm}`;
  if (mesmodia(d, ontem)) return `Ontem, ${hh}h${mm}`;
  return d.toLocaleDateString('pt-BR');
}

/** Cor da barra de progresso conforme a taxa de acerto (verde/ambar/vermelho). */
function barColor(taxa: number): string {
  if (taxa >= 70) return 'bg-green-500';
  if (taxa >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Cor do texto da taxa de acerto, alinhada a mesma faixa da barra. */
function textColor(taxa: number): string {
  if (taxa >= 70) return 'text-green-600';
  if (taxa >= 40) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Tabela de desempenho individual dos alunos da turma (dashboard do professor).
 * Cada linha abre um modal com estatisticas gerais e desempenho por tema.
 */
export const TabelaDesempenhoIndividual = ({ turmaId }: Props) => {
  // Alunos com desempenho, estado de carga e aluno selecionado para o modal.
  const [alunos, setAlunos] = useState<AlunoComDesempenho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AlunoComDesempenho | null>(null);

  // Busca o desempenho individual e cruza com os dados de usuario por id.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const individual = await buscarDesempenhoIndividual(turmaId);
        const ids = individual.alunos.map((a) => a.alunoId);
        // Resolve os usuarios em lote e indexa por id para o merge seguinte.
        const usuarios = ids.length > 0 ? await buscarUsuariosPorIds(ids) : [];
        const porId = new Map(usuarios.map((u) => [u.id, u]));

        setAlunos(
          individual.alunos.map((stats) => ({
            ...stats,
            usuario: porId.get(stats.alunoId) ?? null,
          })),
        );
      } catch (err) {
        console.error('Erro ao carregar desempenho individual:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [turmaId]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Carregando desempenho individual...
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Nenhum aluno encontrado na turma.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Alunos da turma</span>
        <span className="text-xs text-gray-400">clique em um aluno para ver histórico detalhado</span>
      </div>

      {/* Tabela: avatar/nome, total respondidas, barra de taxa de acerto e ultima atividade. */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Aluno</th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Questões Respondidas
              </th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Taxa de Acerto
              </th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Última Atividade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {alunos.map((aluno) => {
              const nome = aluno.usuario?.nome ?? 'Aluno desconhecido';
              const email = aluno.usuario?.email ?? aluno.alunoId;

              return (
                <tr
                  key={aluno.alunoId}
                  onClick={() => setSelected(aluno)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(aluno.alunoId)}`}
                      >
                        {initials(nome)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{nome}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-gray-900">{aluno.totalRespondidas}</td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${barColor(aluno.taxaAcerto)}`}
                          style={{ width: `${aluno.taxaAcerto}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${textColor(aluno.taxaAcerto)}`}>
                        {aluno.taxaAcerto}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-500">{formatarData(aluno.ultimaAtividade)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de detalhe do aluno selecionado: resumo e desempenho por tema. */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(selected.alunoId)}`}
                >
                  {initials(selected.usuario?.nome ?? '?')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selected.usuario?.nome ?? 'Aluno'}</h3>
                  <p className="text-sm text-gray-400">{selected.usuario?.email}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar detalhes do aluno"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cards de resumo: questoes, acertos e taxa geral. */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{selected.totalRespondidas}</p>
                <p className="text-xs text-gray-500">Questões</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-green-600">{selected.totalAcertos}</p>
                <p className="text-xs text-gray-500">Acertos</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className={`text-lg font-bold ${textColor(selected.taxaAcerto)}`}>{selected.taxaAcerto}%</p>
                <p className="text-xs text-gray-500">Taxa Geral</p>
              </div>
            </div>

            {selected.desempenhoPorTema.length > 0 ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Desempenho por Tema</span>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {selected.desempenhoPorTema.map((tema) => (
                    <div key={tema.nome} className="flex items-center gap-3">
                      <span className="w-1/3 truncate text-sm font-medium text-gray-700">{tema.nome}</span>
                      <div className="flex-1">
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full ${barColor(tema.taxaAcerto)}`}
                            style={{ width: `${tema.taxaAcerto}%` }}
                          />
                        </div>
                      </div>
                      <span className={`w-10 text-right text-sm font-bold ${textColor(tema.taxaAcerto)}`}>
                        {tema.taxaAcerto}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-gray-400">Nenhuma questão respondida ainda.</p>
            )}
            <AcompanhamentoAluno key={selected.alunoId} turmaId={turmaId} alunoId={selected.alunoId} nomeAluno={selected.usuario?.nome ?? 'Aluno'} />
          </div>
        </div>
      )}
    </>
  );
};

const AcompanhamentoAluno = ({ turmaId, alunoId, nomeAluno }: { turmaId: string; alunoId: string; nomeAluno: string }) => {
  const [evolucao, setEvolucao] = useState(false);
  const [listaId, setListaId] = useState<string | null>(null);

  return (
    <div className="mt-5">
      <div className="flex gap-3 border-b border-gray-200">
        <button type="button" aria-pressed={!evolucao} onClick={() => setEvolucao(false)}
          className={`border-b-2 px-3 py-2 text-sm font-bold ${!evolucao ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-600'}`}>
          Histórico
        </button>
        <button type="button" aria-pressed={evolucao} onClick={() => setEvolucao(true)}
          className={`border-b-2 px-3 py-2 text-sm font-bold ${evolucao ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-600'}`}>
          Evolução por tema
        </button>
      </div>
      {evolucao ? (
        <div className="mt-4">
          <EvolucaoTemaAluno turmaId={turmaId} alunoId={alunoId} onVerEntrega={setListaId} />
        </div>
      ) : <HistoricoListasAluno turmaId={turmaId} alunoId={alunoId} onVerEntrega={setListaId} />}
      {listaId && (
        <ModalDetalheEntrega turmaId={turmaId} alunoId={alunoId} listaId={listaId} nomeAluno={nomeAluno} onBack={() => setListaId(null)} />
      )}
    </div>
  );
};
