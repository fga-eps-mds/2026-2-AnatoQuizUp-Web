import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Coins, Pencil, Users } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import type { User } from '../../../../entities/user/model/types';
import { obterRankingGeral } from '../../../../features/ranking';
import { AchievementHighlights, listarConquistasDestacadas, type ConquistaDestacada } from '../../../../features/achievements';
import { listarAmigos } from '../../../../features/friendship';
import { buscarInventarioCompleto } from '../../../../features/loja';
import { converterEquipadosParaSlots, useEquippedCosmeticsStore } from '../../../../features/profile-cosmetics';
import { useStudentCoinsStore } from '../../../../features/student-coins/model/useStudentCoinsStore';
import { AvatarCosmetico } from '../../../../shared/ui/profile-identity-card';
import { httpClient } from '../../../../shared/api/httpClient';
import { montarIniciais } from '../../../../shared/utils/iniciais';
import type { DashboardAlunoResponse } from '../../../dashboardAluno/types';
import './profile.css';

type Performance = { totalAcertos: number | null; taxaAcerto: number | null; posicao: number | null };
const initialPerformance: Performance = { totalAcertos: null, taxaAcerto: null, posicao: null };

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : new Intl.DateTimeFormat('pt-BR').format(date);
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return <div className="profile-detail"><dt>{label}</dt><dd>{value === null || value === undefined || value === '' ? 'Não informado' : value}</dd></div>;
}

function PerformanceStrip({ data, onNavigate }: { data: Performance; onNavigate: (path: string) => void }) {
  return <div className="profile-performance" aria-label="Desempenho geral">
    <button type="button" onClick={() => onNavigate('/aluno/dashboard')}><strong>{data.totalAcertos?.toLocaleString('pt-BR') ?? '—'}</strong><span>Acertos</span></button>
    <button type="button" onClick={() => onNavigate('/aluno/ranking')}><strong>{data.posicao ?? '—'}</strong><span>Ranking</span></button>
    <button type="button" onClick={() => onNavigate('/aluno/dashboard')}><strong>{data.taxaAcerto === null ? '—' : `${Math.round(data.taxaAcerto)}%`}</strong><span>Taxa de acerto</span></button>
  </div>;
}

// Props do cartao de estatistica reutilizavel (icone, valor, rotulo, tom de cor).
type CardStatProps = {
  icon: ReactNode;
  valor: number | string;
  rotulo: string;
  carregando: boolean;
  tone: 'teal' | 'green' | 'blue';
  onClick?: () => void;
};

const statToneClass = {
  teal: 'bg-teal-50 text-teal-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
} satisfies Record<CardStatProps['tone'], string>;

/** Formata numeros no padrao PT-BR; strings sao retornadas como estao. */
const formatarValor = (valor: number | string) =>
  typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor;

const CARD_STAT_BASE_CLASS =
  'flex min-h-28 items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm';

const CARD_STAT_INTERATIVO_CLASS =
  'w-full cursor-pointer text-left transition-colors hover:bg-gray-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71edc8] focus-visible:ring-offset-2';

/**
 * Cartao de estatistica do perfil: icone colorido, valor (com esqueleto enquanto
 * carrega) e rotulo. Vira botao clicavel quando recebe onClick.
 */
export const CardStat = ({ icon, valor, rotulo, carregando, tone, onClick }: CardStatProps) => {
  // Conteudo compartilhado entre as versoes clicavel e estatica.
  const conteudo = (
    <>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${statToneClass[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        {carregando ? (
          <div
            role="status"
            aria-label={`Carregando ${rotulo}`}
            className="h-8 w-20 animate-pulse rounded-md bg-gray-200"
          />
        ) : (
          <p className="text-3xl font-black tabular-nums text-[#00214d]">{formatarValor(valor)}</p>
        )}
        <p className="mt-1 text-sm font-bold text-gray-500">{rotulo}</p>
      </div>
      {onClick !== undefined && (
        <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${CARD_STAT_BASE_CLASS} ${CARD_STAT_INTERATIVO_CLASS}`}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={CARD_STAT_BASE_CLASS}>{conteudo}</div>;
};


type StatsPerfil = { respondidas: number; amigos: number };

/** Perfil do aluno com dados disponíveis na conta e no dashboard. */
export const PerfilAlunoPage = ({ previewUser }: { previewUser?: User } = {}) => {
  const { user: authenticatedUser } = useAuth();
  const user = previewUser ?? authenticatedUser;
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<Performance>(initialPerformance);
  const [stats, setStats] = useState<StatsPerfil>({ respondidas: 0, amigos: 0 });
  const [carregandoStats, setCarregandoStats] = useState(!previewUser);
  const [conquistasDestacadas, setConquistasDestacadas] = useState<ConquistaDestacada[]>([]);
  const cosmeticos = useEquippedCosmeticsStore((state) => state.cosmeticos);
  const setCosmeticos = useEquippedCosmeticsStore((state) => state.setCosmeticos);
  const saldoMoedas = useStudentCoinsStore((state) => state.saldoMoedas);

  useEffect(() => {
    if (!user || previewUser) return;
    let active = true;
    void Promise.allSettled([
      httpClient.get<Pick<DashboardAlunoResponse, 'totalRespondidas' | 'totalAcertos' | 'taxaAcerto'>>('/dashboardAluno'),
      obterRankingGeral(),
      listarAmigos({ limit: 1 }),
      buscarInventarioCompleto(),
      listarConquistasDestacadas(),
    ]).then(([dashboard, ranking, friends, inventory, highlights]) => {
      if (!active) return;
      setPerformance({
        totalAcertos: dashboard.status === 'fulfilled' ? dashboard.value.data.totalAcertos ?? null : null,
        taxaAcerto: dashboard.status === 'fulfilled' ? dashboard.value.data.taxaAcerto ?? null : null,
        posicao: ranking.status === 'fulfilled' ? ranking.value.usuarioAtual?.posicao ?? null : null,
      });
      setStats({
        respondidas: dashboard.status === 'fulfilled' ? dashboard.value.data.totalRespondidas ?? 0 : 0,
        amigos: friends.status === 'fulfilled' ? friends.value?.metadados?.total ?? 0 : 0,
      });
      if (inventory.status === 'fulfilled' && Array.isArray(inventory.value)) setCosmeticos(converterEquipadosParaSlots(inventory.value));
      setConquistasDestacadas(highlights.status === 'fulfilled' && Array.isArray(highlights.value) ? highlights.value : []);
      setCarregandoStats(false);
    });
    return () => { active = false; };
  }, [user, previewUser, setCosmeticos]);

  if (!user) return null;

  const firstName = user.name.trim().split(/\s+/)[0] || 'aluno';
  const avatarHref = previewUser ? '/avatar-preview' : '/aluno/perfil/avatar';
  const profilePicture = cosmeticos.AVATAR ?? cosmeticos.ICONE_PERFIL;
  const hasEquippedItems = Boolean(profilePicture ?? cosmeticos.MOLDURA ?? cosmeticos.TITULO ?? cosmeticos.PLANO_FUNDO);
  return <div className="profile-screen">
    <header className="profile-screen-header"><h1>Meu perfil</h1><p>Gerencie suas informações e personalize sua experiência</p></header>
    <nav className="profile-breadcrumb" aria-label="Localização"><span aria-current="page">Perfil</span><span aria-hidden="true">/</span><Link to={avatarHref}>Meu avatar</Link></nav>
    <div className="profile-intro"><h2>Olá, {firstName}</h2><p>Escolha os detalhes que combinam com você</p></div>
    <div className="profile-layout">
      <div className="profile-left">
        <section className="profile-identity-card" aria-label="Identidade do aluno">
          {cosmeticos.PLANO_FUNDO?.valor && <div className="profile-identity-accent" style={{ background: cosmeticos.PLANO_FUNDO.valor }} />}
          <button className="profile-edit-button" type="button" aria-label="Editar informações" onClick={() => navigate('/aluno/perfil/editar')}><Pencil size={20} /></button>
          {profilePicture || cosmeticos.MOLDURA
            ? <div className="profile-avatar-wrap"><AvatarCosmetico identidade={{ nome: user.name }} cosmeticos={cosmeticos} tamanho="lg" /><span className="profile-presence" /></div>
            : <div className="profile-initials">{montarIniciais(user.name)}<span className="profile-presence" /></div>}
          <h3>Aluno</h3>
          {cosmeticos.TITULO && <span className="profile-equipped-title">{cosmeticos.TITULO.nome}</span>}
          <p className="profile-atp"><Coins size={17} aria-hidden="true" />{saldoMoedas.toLocaleString('pt-BR')} ATP</p>
          <button className="profile-customize-link" type="button" onClick={() => navigate('/aluno/perfil/personalizar')}>Personalizar perfil</button>
          <PerformanceStrip data={performance} onNavigate={navigate} />
        </section>
        <section className="profile-data-card profile-status-card"><h3>Status da conta</h3><div><span>Acesso</span><strong className={user.status === 'ACTIVE' ? 'profile-active' : 'profile-inactive'}>{user.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}</strong></div></section>
        <Link className="profile-avatar-link" to={avatarHref}>Meu avatar <span aria-hidden="true">→</span></Link>
      </div>
      <div className="profile-right">
        <section className="profile-data-card"><h3>Dados pessoais</h3><dl className="profile-details-grid"><Detail label="E-mail" value={user.email} /><Detail label="Nome completo" value={user.name} /><Detail label="Data de nascimento" value={formatDate(user.birthDate)} /></dl></section>
        <section className="profile-data-card"><h3>Dados acadêmicos</h3><dl className="profile-details-grid"><Detail label="Instituição de ensino" value={user.institution} /><Detail label="Curso" value={user.course} /><Detail label="Semestre" value={user.period ? `${user.period}º semestre` : null} /></dl></section>
        <section className="profile-data-card"><h3>Cadastro no sistema</h3><dl className="profile-details-grid"><Detail label="Data do cadastro" value={formatDate(user.createdAt)} /><Detail label="Usuário" value={user.nickname || user.id} /></dl></section>
      </div>
    </div>
    <section className="profile-existing-features" aria-label="Atividades e conquistas">
      <h2>Atividades e conquistas</h2>
      <div className="profile-activity-cards">
        <CardStat icon={<BookOpen size={20} />} valor={stats.respondidas} rotulo="Questões respondidas" carregando={carregandoStats} tone="teal" onClick={() => navigate('/aluno/dashboard')} />
        <CardStat icon={<Users size={20} />} valor={stats.amigos} rotulo="Amigos" carregando={carregandoStats} tone="blue" onClick={() => navigate('/aluno/amigos', { state: { aba: 'amigos' } })} />
      </div>
      <AchievementHighlights conquistas={conquistasDestacadas} onManage={() => navigate('/aluno/conquistas', { state: { gerenciarDestaques: true } })} />
      {hasEquippedItems && <section aria-label="Itens em uso">
        <div className="profile-equipped-heading"><h3>Itens em uso</h3><button type="button" onClick={() => navigate('/aluno/loja')}>Personalizar →</button></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'FOTO DE PERFIL', item: profilePicture },
            { label: 'MOLDURA', item: cosmeticos.MOLDURA },
            { label: 'TÍTULO', item: cosmeticos.TITULO },
            { label: 'FUNDO', item: cosmeticos.PLANO_FUNDO },
          ].map(({ label, item }) => <div className="profile-equipped-item" key={label}><span>{label}</span><strong>{item?.nome ?? '—'}</strong></div>)}
        </div>
      </section>}
    </section>
  </div>;
};
