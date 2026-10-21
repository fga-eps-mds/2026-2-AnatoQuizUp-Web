// Pagina "Minha Rede" do aluno: concentra busca de colegas, gerenciamento de
// convites (recebidos/enviados), lista de amigos e o controle de privacidade do
// perfil. Organiza tudo em tres abas e enriquece cada card com os cosmeticos
// equipados de cada usuario.
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Mail, Search, ShieldCheck, UserRoundPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  aceitarConvite,
  alterarVisibilidade,
  buscarColegas,
  desfazerAmizade,
  enviarSolicitacao,
  listarConvitesEnviados,
  listarConvitesRecebidos,
  recusarConvite,
} from '../../../features/friendship';
import type { ResumoAmigo, ResumoAmizade } from '../../../features/friendship';
import type { EquipadosPorUsuario } from '../../../features/profile-cosmetics';
import { converterItensEquipadosParaSlots } from '../../../features/profile-cosmetics';
import { listarAmigosSociais, type ResumoAmigoSocial } from '../../../features/social-profile';
import { ProfileIdentityCard } from '../../../shared/ui/profile-identity-card';
import { CardAmigo } from './CardAmigo';

// Abas disponiveis na pagina de rede social do aluno.
type AbaAmigos = 'buscar' | 'convites' | 'amigos';

// Propriedades de um card-resumo (numero + rotulo + descricao) do topo da pagina.
type CardResumoProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone: 'teal' | 'rose' | 'blue';
};

// Definicao das abas, na ordem em que aparecem no seletor.
const TABS: Array<{ key: AbaAmigos; label: string }> = [
  { key: 'buscar', label: 'Buscar colegas' },
  { key: 'convites', label: 'Convites' },
  { key: 'amigos', label: 'Meus amigos' },
];

// Paleta de cores por "tom" usada nos cards-resumo (icone e fundo combinando).
const toneClasses = {
  teal: 'bg-[#71edc8]/20 text-[#00A88F]',
  rose: 'bg-rose-100 text-rose-500',
  blue: 'bg-blue-100 text-blue-600',
};

/**
 * Card-resumo exibido no topo da pagina (ex.: total de amigos, convites pendentes).
 * @param icon icone ilustrativo do indicador
 * @param label titulo do indicador
 * @param value valor em destaque (numero ou status)
 * @param description texto complementar curto
 * @param tone cor do card (teal, rose ou blue)
 */
const CardResumo = ({ icon: Icon, label, value, description, tone }: CardResumoProps) => (
  <article className="flex min-h-[116px] items-center gap-5 rounded-2xl border border-[#0A1128]/10 bg-white p-5 shadow-sm">
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
        toneClasses[tone]
      }`}
    >
      <Icon size={28} />
    </span>
    <div className="min-w-0">
      <p className="text-3xl font-black leading-none text-[#0A1128]">{value}</p>
      <h2 className="mt-2 text-base font-black text-[#0A1128]">{label}</h2>
      <p className="mt-1 text-sm font-medium text-[#0A1128]/55">{description}</p>
    </div>
  </article>
);

/**
 * Pagina principal da rede social do aluno. Carrega convites e amigos ao montar,
 * permite buscar colegas, aceitar/recusar convites, desfazer amizades e alternar
 * a visibilidade do proprio perfil.
 */
export const AmigosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // Aba inicial pode vir do estado de navegacao (ex.: vindo de outro link interno).
  const [abaAtiva, setAbaAtiva] = useState<AbaAmigos>(
    (location.state as { aba?: AbaAmigos } | null)?.aba ?? 'buscar',
  );
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<ResumoAmigo[]>([]);
  const [idsSolicitados, setIdsSolicitados] = useState<Set<string>>(new Set());
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [enviandoSolicitacaoId, setEnviandoSolicitacaoId] = useState<string | null>(null);
  const [convitesRecebidos, setConvitesRecebidos] = useState<ResumoAmizade[]>([]);
  const [carregandoConvites, setCarregandoConvites] = useState(true);
  const [erroConvites, setErroConvites] = useState<string | null>(null);
  const [processandoConviteId, setProcessandoConviteId] = useState<string | null>(null);
  const [amigos, setAmigos] = useState<ResumoAmigoSocial[]>([]);
  const [carregandoAmigos, setCarregandoAmigos] = useState(true);
  const [erroAmigos, setErroAmigos] = useState<string | null>(null);
  const [processandoAmizadeId, setProcessandoAmizadeId] = useState<string | null>(null);
  const [perfilVisivel, setPerfilVisivel] = useState(user?.visivel ?? true);
  const [alterandoPrivacidade, setAlterandoPrivacidade] = useState(false);
  const [erroPrivacidade, setErroPrivacidade] = useState<string | null>(null);
  const [cosmeticosPorUsuario, setCosmeticosPorUsuario] = useState<EquipadosPorUsuario>({});

  // Ao montar a pagina, carrega em paralelo os convites pendentes e a lista de amigos.
  // A flag `ativo` evita atualizar estado depois que o componente foi desmontado.
  useEffect(() => {
    let ativo = true;

    // Busca convites recebidos e enviados; os enviados viram um Set de ids ja solicitados.
    const carregarConvites = async () => {
      setCarregandoConvites(true);
      setErroConvites(null);

      try {
        const [convitesRecebidosResposta, convitesEnviadosResposta] = await Promise.all([
          listarConvitesRecebidos({ limit: 10 }),
          listarConvitesEnviados({ limit: 100 }),
        ]);

        if (ativo) {
          setConvitesRecebidos(convitesRecebidosResposta.dados);
          setIdsSolicitados(
            new Set(convitesEnviadosResposta.dados.map((convite) => convite.amigo.id)),
          );
        }
      } catch (error) {
        if (ativo) {
          setErroConvites(error instanceof Error ? error.message : 'Erro ao carregar convites.');
        }
      } finally {
        if (ativo) {
          setCarregandoConvites(false);
        }
      }
    };

    // Busca a lista de amigos e ja deriva os cosmeticos equipados de cada um.
    const carregarAmigos = async () => {
      setCarregandoAmigos(true);
      setErroAmigos(null);

      try {
        const resposta = await listarAmigosSociais({ limit: 100 });

        if (ativo) {
          setAmigos(resposta.dados);
          setCosmeticosPorUsuario(
            Object.fromEntries(
              resposta.dados.map((amizade) => [
                amizade.amigo.id,
                converterItensEquipadosParaSlots(amizade.cosmeticos),
              ]),
            ),
          );
        }
      } catch (error) {
        if (ativo) {
          setErroAmigos(error instanceof Error ? error.message : 'Erro ao carregar amigos.');
        }
      } finally {
        if (ativo) {
          setCarregandoAmigos(false);
        }
      }
    };

    void carregarConvites();
    void carregarAmigos();

    return () => {
      ativo = false;
    };
  }, []);

  /**
   * Executa a busca de colegas. Quando o termo comeca com "@", busca por nickname;
   * caso contrario, busca por nome.
   * @param event evento de submit do formulario de busca
   */
  const handleBuscarColegas = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const termoNormalizado = termoBusca.trim();
    if (!termoNormalizado) return;

    setCarregandoBusca(true);
    setErroBusca(null);
    setBuscaRealizada(true);

    try {
      const params =
        termoNormalizado.startsWith('@') && termoNormalizado.length > 1
          ? { nickname: termoNormalizado.slice(1), limit: 10 }
          : { nome: termoNormalizado, limit: 10 };
      const resposta = await buscarColegas(params);

      setResultadosBusca(resposta.dados);
    } catch (error) {
      setResultadosBusca([]);
      setErroBusca(error instanceof Error ? error.message : 'Erro ao buscar colegas.');
    } finally {
      setCarregandoBusca(false);
    }
  };

  /**
   * Envia uma solicitacao de amizade e marca o colega como "ja solicitado".
   * @param id id do usuario que recebera o convite
   */
  const handleEnviarSolicitacao = async (id: string) => {
    setEnviandoSolicitacaoId(id);
    setErroBusca(null);

    try {
      await enviarSolicitacao(id);
      setIdsSolicitados((idsAtuais) => new Set(idsAtuais).add(id));
    } catch (error) {
      setErroBusca(error instanceof Error ? error.message : 'Erro ao enviar convite.');
    } finally {
      setEnviandoSolicitacaoId(null);
    }
  };

  // Remove um convite da lista de pendentes (apos aceitar ou recusar).
  const removerConviteDaLista = (id: string) => {
    setConvitesRecebidos((convitesAtuais) => convitesAtuais.filter((convite) => convite.id !== id));
  };

  /**
   * Insere o novo amigo no topo da lista logo apos um convite aceito,
   * evitando duplicar caso ele ja esteja presente.
   * @param convite convite que acabou de ser aceito
   */
  const adicionarAmigoDaSolicitacao = (convite: ResumoAmizade) => {
    setAmigos((amigosAtuais) => {
      if (amigosAtuais.some((amizade) => amizade.id === convite.id)) {
        return amigosAtuais;
      }

      return [
        {
          ...convite,
          statusAmizade: 'ATIVO',
          cosmeticos: [],
          conquistasDestacadas: [],
        },
        ...amigosAtuais,
      ];
    });
  };

  /**
   * Aceita um convite: confirma no backend, remove dos pendentes e ja adiciona
   * o usuario a lista de amigos (atualizacao otimista da UI).
   * @param convite convite a ser aceito
   */
  const handleAceitarConvite = async (convite: ResumoAmizade) => {
    setProcessandoConviteId(convite.id);
    setErroConvites(null);

    try {
      await aceitarConvite(convite.id);
      removerConviteDaLista(convite.id);
      adicionarAmigoDaSolicitacao(convite);
    } catch (error) {
      setErroConvites(error instanceof Error ? error.message : 'Erro ao aceitar convite.');
    } finally {
      setProcessandoConviteId(null);
    }
  };

  /**
   * Desfaz uma amizade e remove o usuario da lista local.
   * @param id id da amizade a desfazer
   */
  const handleDesfazerAmizade = async (id: string) => {
    setProcessandoAmizadeId(id);
    setErroAmigos(null);

    try {
      await desfazerAmizade(id);
      setAmigos((amigosAtuais) => amigosAtuais.filter((amizade) => amizade.id !== id));
    } catch (error) {
      setErroAmigos(error instanceof Error ? error.message : 'Erro ao desfazer amizade.');
    } finally {
      setProcessandoAmizadeId(null);
    }
  };

  /**
   * Alterna a visibilidade do perfil. Atualiza a UI de forma otimista e, se a
   * chamada ao backend falhar, reverte para o valor anterior.
   */
  const handleAlterarVisibilidade = async () => {
    const proximoValor = !perfilVisivel;

    setPerfilVisivel(proximoValor);
    setAlterandoPrivacidade(true);
    setErroPrivacidade(null);

    try {
      await alterarVisibilidade(proximoValor);
    } catch (error) {
      setPerfilVisivel(!proximoValor);
      setErroPrivacidade(error instanceof Error ? error.message : 'Erro ao atualizar privacidade.');
    } finally {
      setAlterandoPrivacidade(false);
    }
  };

  /**
   * Recusa um convite pendente e o remove da lista.
   * @param id id do convite a recusar
   */
  const handleRecusarConvite = async (id: string) => {
    setProcessandoConviteId(id);
    setErroConvites(null);

    try {
      await recusarConvite(id);
      removerConviteDaLista(id);
    } catch (error) {
      setErroConvites(error instanceof Error ? error.message : 'Erro ao recusar convite.');
    } finally {
      setProcessandoConviteId(null);
    }
  };

  return (
    <main className="min-h-full bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#0A1128]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#71edc8]/20 text-[#00A88F]">
              <Users size={24} />
            </span>
            <h1 className="text-3xl font-black">Minha Rede</h1>
          </div>
          <p className="max-w-2xl text-sm font-medium text-[#0A1128]/60">
            Busque colegas, gerencie convites e acompanhe seus amigos no AnatoQuizUp.
          </p>
        </div>

        {/* Indicadores de topo: amigos, convites pendentes e status de privacidade. */}
        <div className="grid gap-4 lg:grid-cols-3">
          <CardResumo
            icon={Users}
            label="amigos"
            value={String(amigos.length)}
            description="Conexoes confirmadas"
            tone="teal"
          />
          <CardResumo
            icon={Mail}
            label="convites pendentes"
            value={String(convitesRecebidos.length)}
            description="Aguardando sua resposta"
            tone="rose"
          />
          <CardResumo
            icon={ShieldCheck}
            label={perfilVisivel ? 'Perfil visivel' : 'Perfil privado'}
            value={perfilVisivel ? 'Ativo' : 'Privado'}
            description={
              perfilVisivel
                ? 'Outros alunos podem encontrar voce'
                : 'Voce nao aparece nos resultados'
            }
            tone="blue"
          />
        </div>

        {/* Seletor de abas (Buscar / Convites / Meus amigos). */}
        <div className="w-full overflow-hidden rounded-2xl border border-[#0A1128]/10 bg-white shadow-sm">
          <div className="grid grid-cols-3">
            {TABS.map((tab) => {
              const isActive = abaAtiva === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAbaAtiva(tab.key)}
                  aria-pressed={isActive}
                  className={`min-h-12 border-r border-[#0A1128]/10 px-3 text-sm font-black transition-colors last:border-r-0 ${
                    isActive
                      ? 'bg-[#71edc8]/15 text-[#0A1128]'
                      : 'bg-white text-[#0A1128]/60 hover:bg-[#F8FAFC] hover:text-[#0A1128]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aba "Buscar colegas": formulario de busca + lista de resultados. */}
        {abaAtiva === 'buscar' && (
          <section className="rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#71edc8]/20 text-[#00A88F]">
                <Search size={22} />
              </span>
              <div className="w-full min-w-0">
                <h2 className="text-lg font-black text-[#0A1128]">Buscar colegas</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium text-[#0A1128]/60">
                  Encontre alunos cadastrados pelo nome ou nickname e envie convites de amizade.
                </p>

                <form
                  onSubmit={(event) => void handleBuscarColegas(event)}
                  className="mt-5 flex flex-col gap-3 sm:flex-row"
                >
                  <label className="sr-only" htmlFor="busca-colegas">
                    Buscar por nome ou nickname
                  </label>
                  <input
                    id="busca-colegas"
                    value={termoBusca}
                    onChange={(event) => setTermoBusca(event.target.value)}
                    placeholder="Buscar por nome ou @nickname"
                    className="min-h-12 flex-1 rounded-xl border border-[#0A1128]/10 bg-white px-4 text-sm font-semibold text-[#0A1128] outline-none transition focus:border-[#00A88F] focus:ring-4 focus:ring-[#71edc8]/20"
                  />
                  <button
                    type="submit"
                    disabled={carregandoBusca || termoBusca.trim().length === 0}
                    className="min-h-12 rounded-xl bg-[#00A88F] px-6 text-sm font-black text-white transition hover:bg-[#008f7a] disabled:cursor-not-allowed disabled:bg-[#0A1128]/20"
                  >
                    {carregandoBusca ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>

                {erroBusca && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {erroBusca}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <h3 className="text-sm font-black text-[#0A1128]">Resultados da busca</h3>

                  {carregandoBusca && (
                    <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60">
                      Buscando colegas...
                    </p>
                  )}

                  {!carregandoBusca &&
                    buscaRealizada &&
                    resultadosBusca.length === 0 &&
                    !erroBusca && (
                      <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60">
                        Nenhum colega encontrado.
                      </p>
                    )}

                  {!carregandoBusca &&
                    resultadosBusca.map((colega) => {
                      const jaSolicitado = idsSolicitados.has(colega.id);
                      const enviando = enviandoSolicitacaoId === colega.id;

                      return (
                        <article
                          key={colega.id}
                          onClick={() => navigate(`/aluno/amigos/${colega.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              navigate(`/aluno/amigos/${colega.id}`);
                            }
                          }}
                          role="link"
                          tabIndex={0}
                          className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ProfileIdentityCard
                              identidade={{
                                usuarioId: colega.id,
                                nome: colega.nome,
                                nickname: colega.nickname ?? null,
                              }}
                              cosmeticos={cosmeticosPorUsuario[colega.id] ?? {}}
                              tamanho="sm"
                            />
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-black text-[#0A1128]">
                                {colega.nome}
                              </h4>
                              <p className="text-sm font-semibold text-[#0A1128]/55">
                                {colega.nickname ? `@${colega.nickname}` : 'Sem nickname'}
                              </p>
                              <p className="text-xs font-semibold text-[#0A1128]/45">
                                {[colega.curso, colega.semestre && `${colega.semestre} semestre`]
                                  .filter(Boolean)
                                  .join(' - ') || 'Dados academicos nao informados'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleEnviarSolicitacao(colega.id);
                            }}
                            disabled={jaSolicitado || enviando}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#00A88F]/40 px-4 text-sm font-black text-[#008f7a] transition hover:bg-[#71edc8]/15 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#71edc8]/20 disabled:text-[#008f7a]/70"
                          >
                            {jaSolicitado ? (
                              <>
                                <CheckCircle2 size={18} />
                                Solicitacao pendente
                              </>
                            ) : (
                              <>
                                <UserRoundPlus size={18} />
                                {enviando ? 'Enviando...' : 'Adicionar amigo'}
                              </>
                            )}
                          </button>
                        </article>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Aba "Convites": solicitacoes recebidas com acoes de aceitar/recusar. */}
        {abaAtiva === 'convites' && (
          <section className="rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
                <Mail size={22} />
              </span>
              <div className="w-full min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#0A1128]">Convites recebidos</h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium text-[#0A1128]/60">
                      Aceite ou recuse solicitacoes pendentes enviadas por outros alunos.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-500">
                    {convitesRecebidos.length} pendentes
                  </span>
                </div>

                {erroConvites && (
                  <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {erroConvites}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  {carregandoConvites && (
                    <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60">
                      Carregando convites...
                    </p>
                  )}

                  {!carregandoConvites && convitesRecebidos.length === 0 && !erroConvites && (
                    <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60">
                      Nenhum convite pendente.
                    </p>
                  )}

                  {!carregandoConvites &&
                    convitesRecebidos.map((convite) => {
                      const processando = processandoConviteId === convite.id;

                      return (
                        <article
                          key={convite.id}
                          onClick={() => navigate(`/aluno/amigos/${convite.amigo.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              navigate(`/aluno/amigos/${convite.amigo.id}`);
                            }
                          }}
                          role="link"
                          tabIndex={0}
                          className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-[#0A1128]/10 bg-white p-4 shadow-sm hover:bg-[#F8FAFC] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ProfileIdentityCard
                              identidade={{
                                usuarioId: convite.amigo.id,
                                nome: convite.amigo.nome,
                                nickname: convite.amigo.nickname ?? null,
                              }}
                              cosmeticos={cosmeticosPorUsuario[convite.amigo.id] ?? {}}
                              tamanho="sm"
                            />
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-black text-[#0A1128]">
                                {convite.amigo.nome}
                              </h4>
                              <p className="text-sm font-semibold text-[#0A1128]/55">
                                {convite.amigo.nickname
                                  ? `@${convite.amigo.nickname}`
                                  : 'Sem nickname'}
                              </p>
                              <p className="text-xs font-semibold text-[#0A1128]/45">
                                {[
                                  convite.amigo.curso,
                                  convite.amigo.semestre && `${convite.amigo.semestre} semestre`,
                                ]
                                  .filter(Boolean)
                                  .join(' - ') || 'Dados academicos nao informados'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleAceitarConvite(convite);
                              }}
                              disabled={processando}
                              className="min-h-11 rounded-xl bg-[#00A88F] px-5 text-sm font-black text-white transition hover:bg-[#008f7a] disabled:cursor-not-allowed disabled:bg-[#0A1128]/20"
                            >
                              {processando ? 'Processando...' : 'Aceitar'}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleRecusarConvite(convite.id);
                              }}
                              disabled={processando}
                              className="min-h-11 rounded-xl border border-rose-200 px-5 text-sm font-black text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#0A1128]/10 disabled:text-[#0A1128]/40"
                            >
                              Recusar
                            </button>
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Aba "Meus amigos": grade de cards das amizades confirmadas. */}
        {abaAtiva === 'amigos' && (
          <section className="rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#71edc8]/20 text-[#00A88F]">
                <UserRoundPlus size={22} />
              </span>
              <div className="w-full min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#0A1128]">Meus amigos</h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium text-[#0A1128]/60">
                      Acompanhe suas conexoes confirmadas e remova amizades quando necessario.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-[#71edc8]/20 px-3 py-1 text-xs font-black text-[#008f7a]">
                    {amigos.length} amigos
                  </span>
                </div>

                {erroAmigos && (
                  <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {erroAmigos}
                  </p>
                )}

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {carregandoAmigos && (
                    <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60 md:col-span-2 xl:col-span-3">
                      Carregando amigos...
                    </p>
                  )}

                  {!carregandoAmigos && amigos.length === 0 && !erroAmigos && (
                    <p className="rounded-xl border border-[#0A1128]/10 bg-[#F8FAFC] px-4 py-4 text-sm font-semibold text-[#0A1128]/60 md:col-span-2 xl:col-span-3">
                      Nenhum amigo adicionado.
                    </p>
                  )}

                  {!carregandoAmigos &&
                    amigos.map((amizade) => (
                      <CardAmigo
                        key={amizade.id}
                        amizade={amizade}
                        cosmeticos={cosmeticosPorUsuario[amizade.amigo.id] ?? {}}
                        conquistasDestacadas={amizade.conquistasDestacadas}
                        processando={processandoAmizadeId === amizade.id}
                        onVerPerfil={() =>
                          navigate(`/aluno/amigos/${amizade.amigo.id}`, {
                            state: { amizadeId: amizade.id },
                          })
                        }
                        onDesfazer={(event) => {
                          event.stopPropagation();
                          void handleDesfazerAmizade(amizade.id);
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bloco fixo de privacidade: toggle que controla a visibilidade do perfil. */}
        <section className="rounded-2xl border border-[#0A1128]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h2 className="text-lg font-black text-[#0A1128]">Privacidade da rede</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium text-[#0A1128]/60">
                  {perfilVisivel
                    ? 'Seu perfil aparece na busca de outros alunos.'
                    : 'Seu perfil nao aparece na busca de outros alunos.'}
                </p>
                {erroPrivacidade && (
                  <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                    {erroPrivacidade}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-[#0A1128]/60">
                {perfilVisivel ? 'Visivel' : 'Privado'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={perfilVisivel}
                aria-label="Alternar privacidade da rede"
                disabled={alterandoPrivacidade}
                onClick={() => void handleAlterarVisibilidade()}
                className={`relative h-8 w-14 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  perfilVisivel ? 'bg-[#00A88F]' : 'bg-[#0A1128]/25'
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    perfilVisivel ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};
