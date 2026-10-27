import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ChevronRight, ChevronLeft, Loader2, SearchX, Target, BookOpen } from 'lucide-react';
import { buscarHistoricoQuiz } from '../../../features/historico-quiz/historicoQuizService';
import { buscarQuantidadeDeQuestoesPorTema } from '../../../features/random-quiz/randomQuizService';
import type { ItemHistoricoQuiz } from '../../../features/historico-quiz/types';
import { HistoricoXp } from '../../../features/progressao/ui/HistoricoXp';

// Abas da pagina: sessoes de pratica (respostas) e XP recebido.
type AbaHistorico = 'pratica' | 'erros' | 'xp';

const ABAS: Array<{ key: AbaHistorico; label: string }> = [
  { key: 'pratica', label: 'Sessões de prática' },
  { key: 'erros', label: 'Revisar erros' },
  { key: 'xp', label: 'XP recebido' },
];

/**
 * Pagina de historico de pratica do aluno: lista as respostas, filtra por tema e
 * agrupa por data+tema+dificuldade em "sessoes" clicaveis que levam aos detalhes.
 * A aba "XP recebido" mostra o historico de XP (data, origem, quiz e valor).
 */
export const HistoricoPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Itens crus do historico e os temas disponiveis para filtro.
  const [historicoBruto, setHistoricoBruto] = useState<ItemHistoricoQuiz[]>([]);
  const [temasFiltro, setTemasFiltro] = useState<{ nome: string }[]>([]);
  const [temaSelecionado, setTemaSelecionado] = useState<string>('Todos');
  const aba: AbaHistorico = searchParams.get('aba') === 'erros' ? 'erros' : searchParams.get('aba') === 'xp' ? 'xp' : 'pratica';
  const [erroCarregamento, setErroCarregamento] = useState(false);

  // Estado de carga e controle de paginacao.
  const [isLoading, setIsLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limit = 50;

  // Carrega os temas disponiveis para os botoes de filtro (uma vez).
  useEffect(() => {
    buscarQuantidadeDeQuestoesPorTema()
      .then(res => setTemasFiltro(res))
      .catch(err => console.error('Erro ao carregar filtros', err));
  }, []);

  /**
   * Busca uma pagina do historico aplicando o filtro de tema.
   * @param page Pagina solicitada.
   * @param tema Tema selecionado ('Todos' = sem filtro).
   */
  const carregarHistorico = async (page: number, tema: string) => {
    try {
      setIsLoading(true);
      setErroCarregamento(false);

      const params = {
        page,
        limit,
        tema: tema !== 'Todos' ? tema : undefined,
        ...(aba === 'erros' && { somenteErros: true }),
      };

      const response = await buscarHistoricoQuiz(params);

      setHistoricoBruto(response.dados);
      setTotalItens(response.metadados.total);
      setTotalPaginas(response.metadados.totalPages);
      setPaginaAtual(page);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setErroCarregamento(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Recarrega a primeira pagina quando tema ou modo de revisao muda.
  useEffect(() => {
    let deveAtualizarEstado = true;
    setIsLoading(true);
    setErroCarregamento(false);

    buscarHistoricoQuiz({
      page: 1,
      limit,
      tema: temaSelecionado !== 'Todos' ? temaSelecionado : undefined,
      ...(aba === 'erros' && { somenteErros: true }),
    })
      .then((response) => {
        if (!deveAtualizarEstado) return;

        setHistoricoBruto(response.dados);
        setTotalItens(response.metadados.total);
        setTotalPaginas(response.metadados.totalPages);
        setPaginaAtual(1);
      })
      .catch((error) => {
        console.error('Erro ao buscar histórico:', error);
        if (deveAtualizarEstado) setErroCarregamento(true);
      })
      .finally(() => {
        if (!deveAtualizarEstado) return;

        setIsLoading(false);
      });

    return () => {
      deveAtualizarEstado = false;
    };
  }, [temaSelecionado, aba]);

  // Agrupa as respostas em sessoes pela combinacao data + tema + dificuldade.
  const sessoesAgrupadas = useMemo(() => {
    const grupos: Record<string, ItemHistoricoQuiz[]> = {};

    historicoBruto.forEach(item => {
      // A chave composta define o que e considerado uma mesma sessao de estudo.
      const data = new Date(item.criadoEm).toLocaleDateString('pt-BR');
      const tema = item.questao.tema.nome;
      const dificuldade = item.questao.dificuldade;
      const chave = `${data}|${tema}|${dificuldade}`;

      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(item);
    });

    return Object.entries(grupos).map(([chave, itens]) => {
      const [data, tema, dificuldade] = chave.split('|');
      return { id: chave, data, tema, dificuldade, itens };
    });
  }, [historicoBruto]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#0A1128]">Histórico de Prática</h1>
            <p className="text-[#0A1128]/60 mt-1 font-medium">Consulte suas respostas e revise as questões que errou.</p>
          </div>

          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E6FCFA] text-[#14D5C2] rounded-full flex items-center justify-center font-black">
              <Target className="w-5 h-5" />
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-[#0A1128]/40 tracking-wider">{aba === 'erros' ? 'Erros encontrados' : 'Total de respostas'}</p>
              <p className="text-xl font-black text-[#0A1128]">{totalItens}</p>
            </div>
          </div>
        </div>

        {/* Alterna entre as sessoes de pratica e o historico de XP. */}
        <div className="mb-4 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="grid grid-cols-3">
            {ABAS.map((opcao) => {
              const ativa = aba === opcao.key;

              return (
                <button
                  key={opcao.key}
                  type="button"
                  onClick={() => setSearchParams(opcao.key === 'pratica' ? {} : { aba: opcao.key })}
                  aria-pressed={ativa}
                  className={`min-h-12 border-r border-gray-100 px-3 text-sm font-black transition-colors last:border-r-0 ${
                    ativa
                      ? 'bg-[#E6FCFA] text-[#0A1128]'
                      : 'bg-white text-[#0A1128]/60 hover:bg-gray-50 hover:text-[#0A1128]'
                  }`}
                >
                  {opcao.label}
                </button>
              );
            })}
          </div>
        </div>

        {aba === 'xp' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <HistoricoXp />
          </div>
        ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Barra de filtros por tema (rolavel horizontalmente). */}
          <div className="p-4 border-b border-gray-100 overflow-x-auto custom-scrollbar">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setTemaSelecionado('Todos')}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${temaSelecionado === 'Todos' ? 'bg-[#0A1128] text-white' : 'bg-gray-50 text-[#0A1128]/60 hover:bg-gray-100'}`}
              >
                Todos os Temas
              </button>

              {temasFiltro.map(t => (
                <button
                  key={t.nome}
                  onClick={() => setTemaSelecionado(t.nome)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${temaSelecionado === t.nome ? 'bg-[#0A1128] text-white' : 'bg-gray-50 text-[#0A1128]/60 hover:bg-gray-100'}`}
                >
                  {t.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {aba === 'pratica' && <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-[#0A1128]/50 uppercase tracking-wider mb-4 px-4">
              <div className="col-span-3">Data da Sessão</div>
              <div className="col-span-5">Tema e Dificuldade</div>
              <div className="col-span-3 text-center">Volume</div>
              <div className="col-span-1 text-center">Revisar</div>
            </div>}

            {erroCarregamento ? (
              <div role="alert" className="py-12 text-center">
                <p className="font-bold text-rose-700">Não foi possível carregar suas respostas.</p>
                <button type="button" onClick={() => carregarHistorico(1, temaSelecionado)} className="mt-3 rounded-lg bg-[#14D5C2] px-4 py-2 font-bold text-white">Tentar novamente</button>
              </div>
            ) : isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#14D5C2] animate-spin mb-4" />
                <p className="text-[#0A1128] font-bold">Carregando seu histórico...</p>
              </div>
            ) : historicoBruto.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <SearchX className="w-12 h-12 text-[#0A1128]/20 mb-4" />
                <p className="text-[#0A1128] font-bold text-lg">{aba === 'erros' ? 'Nenhum erro encontrado' : 'Nenhum registro encontrado'}</p>
                <p className="text-[#0A1128]/50 text-sm mt-1">{aba === 'erros' ? 'Não há respostas erradas neste filtro.' : 'Você não tem histórico para este filtro.'}</p>
              </div>
            ) : aba === 'erros' ? (
              <div className="space-y-4" aria-label="Questões erradas para revisão">
                {historicoBruto.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                    <p className="mb-2 text-xs font-bold text-[#0A1128]/50">{item.questao.tema.nome} · {item.questao.dificuldade} · {new Date(item.criadoEm).toLocaleDateString('pt-BR')}</p>
                    <h2 className="text-lg font-black text-[#0A1128]">{item.questao.enunciado}</h2>
                    {item.questao.urlImagem && <img src={item.questao.urlImagem} alt="Imagem da questão" className="mt-4 max-h-80 rounded-lg object-contain" />}
                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <p className="rounded-lg bg-rose-50 p-3 text-rose-800">Sua resposta: <strong>{item.respostaMarcada} — {item.questao.alternativas?.[`alternativa${item.respostaMarcada}`] ?? item.respostaMarcada}</strong></p>
                      <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">Resposta correta: <strong>{item.questao.respostaCorreta} — {item.questao.alternativas?.[`alternativa${item.questao.respostaCorreta}`] ?? item.questao.respostaCorreta}</strong></p>
                    </div>
                    <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-950">
                      <h3 className="font-black">Explicação do professor</h3>
                      <p className="mt-1">{item.questao.saibaMais || 'Esta questão ainda não possui explicação cadastrada.'}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Cada sessao agrupada vira um cartao clicavel que abre os detalhes. */
              <div className="flex flex-col gap-3">
                {sessoesAgrupadas.map((sessao) => (
                  <button
                    key={sessao.id}
                    type="button"
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border border-gray-100 hover:border-[#14D5C2] hover:shadow-md transition-all bg-white cursor-pointer group w-full text-left"
                    onClick={() => navigate('/aluno/historico/detalhes', { state: { sessao } })}
                  >
                    <div className="col-span-3 flex items-center gap-4">
                      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-500">
                        <Calendar className="w-6 h-6" />
                      </div>

                      <div>
                        <p className="font-bold text-[#0A1128]">{sessao.data}</p>
                      </div>
                    </div>

                    <div className="col-span-5 flex flex-col items-start gap-1">
                      <p className="font-black text-[#0A1128] truncate">{sessao.tema}</p>
                      <span className="bg-gray-100 text-[#0A1128]/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                        {sessao.dificuldade}
                      </span>
                    </div>

                    <div className="col-span-3 flex justify-center">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0A1128]/60">
                        <BookOpen className="w-4 h-4" />
                        {sessao.itens.length} questões
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center md:justify-end">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-[#0A1128]/30 group-hover:bg-[#E6FCFA] group-hover:text-[#14D5C2] transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controles de paginacao (anterior / pagina atual / proxima). */}
          {!isLoading && !erroCarregamento && historicoBruto.length > 0 && (
            <div className="p-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50">
              <p className="text-sm font-medium text-[#0A1128]/50">
                Lote de registros mais recentes
              </p>

              <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => carregarHistorico(paginaAtual - 1, temaSelecionado)}
                  aria-label="Página anterior"
                  disabled={paginaAtual === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0A1128] hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#14D5C2] text-white font-bold text-sm shadow-sm">
                  {paginaAtual}
                </button>

                <button
                  onClick={() => carregarHistorico(paginaAtual + 1, temaSelecionado)}
                  aria-label="Próxima página"
                  disabled={paginaAtual >= totalPaginas}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0A1128] hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
