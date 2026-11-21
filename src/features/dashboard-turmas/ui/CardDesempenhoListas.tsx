import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCcw,
  Users,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { 
  buscarDesempenhoPorListas, 
  buscarDesempenhoListaIndividual,
} from '../../../entities/dashboardTurma/api/dashboardTurmaApi';
import { buscarUsuariosPorIds } from '../../../entities/usuarios/api/usuarioApi';
import type { DesempenhoLista, DesempenhoListaIndividual } from '../../../entities/dashboardTurma/model/types';
import { ModalTopErros } from './ModalTopErros';

interface CardDesempenhoListasProps {
  turmaId: string;
}

/**
 * Formata a data de prazo para o padrao dd/mm/aaaa em PT-BR.
 * @param prazo Data ISO ou null; retorna "Sem prazo" quando ausente/invalida.
 */
const formatarPrazo = (prazo: string | null) => {
  if (!prazo) return 'Sem prazo';

  const data = new Date(prazo);
  if (Number.isNaN(data.getTime())) return prazo;

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata a taxa media de acerto como percentual, ou "-" quando nao ha respostas.
 * @param taxa Valor numerico da taxa.
 * @param temRespostas Indica se houve submissoes (sem elas a taxa nao faz sentido).
 */
const formatarTaxa = (taxa: number, temRespostas: boolean) => {
  if (!temRespostas) return '-';

  return `${taxa.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(taxa) ? 0 : 1,
  })}%`;
};

/**
 * Calcula o percentual de alunos que submeteram a lista (limitado a 0–100).
 * @param lista Dados agregados de desempenho da lista.
 */
const calcularPercentual = (lista: DesempenhoLista) => {
  if (lista.totalAlunos <= 0) return 0;

  return Math.min(100, Math.round((lista.totalSubmeteram / lista.totalAlunos) * 100));
};

/**
 * Indica se o prazo informado ja passou em relacao ao momento atual.
 * @param prazo Data ISO ou null.
 */
const prazoExpirado = (prazo: string | null) => {
  if (!prazo) return false;

  const data = new Date(prazo);
  if (Number.isNaN(data.getTime())) return false;

  return data.getTime() < Date.now();
};

/**
 * Modal que detalha o desempenho individual dos alunos em uma lista especifica.
 * Carrega o desempenho e resolve os nomes dos alunos a partir dos seus ids.
 */
const ModalAlunos = ({ turmaId, listaId, onClose }: { turmaId: string, listaId: string, onClose: () => void }) => {
  // Desempenho detalhado da lista e mapa id->nome dos alunos (resolvido a parte).
  const [detalhes, setDetalhes] = useState<DesempenhoListaIndividual | null>(null);
  const [loading, setLoading] = useState(true);

  const [nomesAlunos, setNomesAlunos] = useState<Record<string, string>>({});

  // Carrega o desempenho da lista e, em seguida, os nomes dos alunos envolvidos.
  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        const dadosDesempenho = await buscarDesempenhoListaIndividual(turmaId, listaId);
        setDetalhes(dadosDesempenho);

        const idsAlunos = dadosDesempenho.desempenhoAlunos.map((a) => a.alunoId);

        // So busca os usuarios se houver alunos para resolver.
        if (idsAlunos.length > 0) {
          const usuarios = await buscarUsuariosPorIds(idsAlunos);
          
          const mapaNomes: Record<string, string> = {};
          usuarios.forEach((u) => {
            mapaNomes[u.id] = u.nome;
          });
          
          setNomesAlunos(mapaNomes);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do modal:', error);
      } finally {
        setLoading(false);
      }
    };

    void carregarTudo();
  }, [turmaId, listaId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <FileText size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              {detalhes ? detalhes.nomeLista : 'Carregando...'}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin text-teal-500" />
              Buscando desempenho dos alunos...
            </div>
          ) : !detalhes ? (
            <div className="flex h-40 items-center justify-center text-sm text-red-500 font-medium">
              Erro ao carregar os dados desta lista.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Uma linha por aluno: nome, entrega, acertos e selo de status. */}
              {detalhes.desempenhoAlunos.map((aluno) => {
                const submeteu = aluno.status === 'SUBMETIDA';
                const naoRespondeu = aluno.status === 'NAO_RESPONDEU';
                
                return (
                  <div key={aluno.alunoId} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${submeteu ? 'border-gray-200 bg-white' : 'border-red-100 bg-red-50/30'}`}>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 font-sans">
                        {nomesAlunos[aluno.alunoId] ?? 'Aluno desconhecido'}
                      </p>
                      
                      <p className="mt-1 text-[11px] text-gray-500">
                        {submeteu && aluno.submissaoEm ? `Entregue em ${new Date(aluno.submissaoEm).toLocaleString('pt-BR')}` : 'Sem registro de entrega'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {submeteu ? (
                          <p className="text-[13px] font-bold text-gray-900">
                            {aluno.totalAcertos} <span className="text-[11px] font-medium text-gray-500">/ {detalhes.totalQuestoes} acertos</span>
                          </p>
                        ) : (
                          <p className="text-[13px] font-bold text-gray-400">-</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                        submeteu ? 'bg-green-100 text-green-700' :
                        naoRespondeu ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {aluno.mensagem}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Card do dashboard do professor com o desempenho por lista publicada na turma.
 * Lista as publicacoes com taxa de submissao/acerto e abre os modais de detalhe
 * por aluno e de questoes com mais erros.
 */
export const CardDesempenhoListas = ({ turmaId }: CardDesempenhoListasProps) => {
  // Listas com desempenho agregado, estado de carga/erro e listas abertas nos modais.
  const [listas, setListas] = useState<DesempenhoLista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [listaSelecionadaId, setListaSelecionadaId] = useState<string | null>(null);
  const [listaTopErros, setListaTopErros] = useState<DesempenhoLista | null>(null);

  // Busca o desempenho por lista da turma; memoizado para uso no efeito e no retry.
  const carregarDesempenho = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    try {
      const dados = await buscarDesempenhoPorListas(turmaId);
      setListas(dados);
    } catch (error) {
      console.error('Erro ao carregar desempenho por lista', error);
      setErro('Nao foi possivel carregar o desempenho por lista.');
    } finally {
      setIsLoading(false);
    }
  }, [turmaId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregarDesempenho();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregarDesempenho]);

  const totalPublicacoes = useMemo(() => listas.length, [listas]);

  // Estado de carregamento.
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" />
        Carregando desempenho por lista...
      </div>
    );
  }

  // Estado de erro, com botao para tentar novamente.
  if (erro) {
    return (
      <div
        role="alert"
        className="flex h-64 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-800"
      >
        <AlertCircle size={24} className="mb-3" />
        <p className="font-semibold">{erro}</p>
        <button
          type="button"
          onClick={() => void carregarDesempenho()}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
        >
          <RefreshCcw size={14} />
          Tentar novamente
        </button>
      </div>
    );
  }

  // Estado vazio: turma sem listas publicadas.
  if (listas.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 text-center">
        <ClipboardList size={32} className="mb-3 text-gray-300" />
        <h4 className="text-sm font-bold text-gray-900">Nenhuma lista publicada nesta turma.</h4>
        <p className="mt-1 text-xs text-gray-500">
          As publicacoes aparecem aqui assim que forem vinculadas a turma.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-gray-500">
        <span>{totalPublicacoes} lista(s) publicada(s)</span>
        <span>submissoes</span>
      </div>

      {/* Uma linha por lista publicada: prazo, barra de submissoes e estatisticas. */}
      <ul className="space-y-3">
        {listas.map((lista) => {
          const percentual = calcularPercentual(lista);
          const temRespostas = lista.totalSubmeteram > 0;
          const expirado = prazoExpirado(lista.prazo);

          return (
            <li
              key={lista.listaTurmaId}
              className="rounded-lg border border-gray-200 bg-gray-50/70 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{lista.nomeLista}</p>
                  <p
                    className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
                      expirado ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    <CalendarClock size={13} />
                    {expirado ? 'Prazo expirado' : formatarPrazo(lista.prazo)}
                  </p>
                </div>

                <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-bold text-gray-700">
                  {percentual}%
                </span>
              </div>

              <div className="mb-4 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${percentual}%` }}
                />
              </div>

              {/* Tres metricas resumidas: responderam, pendentes e acerto medio. */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white px-2 py-2">
                  <p className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                    <CheckCircle2 size={14} className="text-teal-600" />
                    {lista.totalSubmeteram}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500">responderam</p>
                </div>
                <div className="rounded-md bg-white px-2 py-2">
                  <p className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                    <Users size={14} className="text-amber-600" />
                    {lista.totalPendentes}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500">pendentes</p>
                </div>
                <div className="rounded-md bg-white px-2 py-2">
                  <p className="text-sm font-bold text-gray-900">
                    {formatarTaxa(lista.taxaMediaAcerto, temRespostas)}
                  </p>
                  <p className="text-[11px] font-medium text-gray-500">acerto medio</p>
                </div>
              </div>
              
              <button
                onClick={() => setListaSelecionadaId(lista.listaTurmaId)}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 py-2 text-[12px] font-bold text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              >
                <Eye size={14} /> Ver desempenho dos alunos
              </button>

              {/* Botao para abrir o modal de questoes com mais erros desta lista. */}
              <button
                type="button"
                onClick={() => setListaTopErros(lista)}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 py-2 text-[12px] font-bold text-teal-600 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              >
                Ver questões com mais erros
              </button>

            </li>
          );
        })}
      </ul>

      {/* Modal de detalhe por aluno da lista selecionada. */}
      {listaSelecionadaId && (
        <ModalAlunos
          turmaId={turmaId} 
          listaId={listaSelecionadaId} 
          onClose={() => setListaSelecionadaId(null)} 
        />
      )}

      {/* Modal de questoes com mais erros da lista selecionada. */}
      {listaTopErros && (
        <ModalTopErros
          turmaId={turmaId}
          listaId={listaTopErros.listaTurmaId}
          nomeLista={listaTopErros.nomeLista}
          onClose={() => setListaTopErros(null)}
        />
      )}

    </div>
  );
};