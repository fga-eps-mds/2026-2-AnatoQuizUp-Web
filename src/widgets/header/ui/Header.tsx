// Header/menu lateral principal da aplicacao. Monta os itens de navegacao de
// acordo com o papel do usuario (aluno, professor ou admin), exibe o saldo de
// moedas e o avatar do aluno, e oferece o "ver como aluno" para o professor.
// Em telas grandes vira sidebar fixa; em telas pequenas, um drawer deslizante.
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { User } from "../../../entities/user/model/types";
import { Home, LogOut, Coins, Menu, Users, X, Newspaper, BookOpen, List, Calendar, PieChart, ChevronRight, ShoppingBag, Trophy, Medal } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import logo from "../../../shared/assets/image/logo.png";
import { useStudentCoinsStore } from "../../../features/student-coins/model/useStudentCoinsStore";
import { useEquippedCosmeticsStore } from "../../../features/profile-cosmetics";
import { AvatarCosmetico } from "../../../shared/ui/profile-identity-card";

// Item de navegacao do menu: rotulo, icone, acao ao clicar e se esta ativo.
type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  isActive: boolean;
};

/**
 * Componente do header/sidebar. Renderiza a navegacao conforme o papel do
 * usuario logado e o rodape com saldo, perfil e logout.
 */
export const Header = ({ previewUser }: { previewUser?: User } = {}) => {
  const { user: authenticatedUser, logout } = useAuth();
  const user = previewUser ?? authenticatedUser;
  const saldoMoedas = useStudentCoinsStore((state) => state.saldoMoedas);
  const cosmeticos = useEquippedCosmeticsStore((state) => state.cosmeticos);
  const navigate = useNavigate();
  const location = useLocation();
  // Estado do drawer mobile, modo "ver como aluno" e ref para detectar clique fora.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // const [isViewingAsStudent, setIsViewingAsStudent] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Fecha o drawer mobile ao clicar fora dele.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen]);

  // Sem usuario logado, o header nao e exibido.
  if (!user) return null;

  // Faz logout, volta ao login e fecha o drawer.
  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsDrawerOpen(false);
  };

  // Alterna o modo de previa "ver como aluno" (apenas professor).
  // const handleToggleStudentView = () => {
  //   setIsViewingAsStudent((prev) => !prev);
  // };

  // Rota ativa por correspondencia exata do pathname.
  const isRouteActive = (path: string) => location.pathname === path;

  /**
   * Monta a lista de itens de navegacao conforme o papel do usuario.
   * @param role papel do usuario (PROFESSOR, ADMIN/ADMINISTRADOR ou STUDENT)
   * @returns itens de menu a exibir
   */
  const buildNavItems = (role: string): NavItem[] => {
    // Itens reutilizaveis declarados aqui; cada papel monta sua propria selecao abaixo.
    const homeItem: NavItem = {
      key: "home",
      label: "Início",
      icon: Home,
      onSelect: () => navigate("/home"),
      isActive: isRouteActive("/home") || isRouteActive("/"),
    };

    const homeProfessorItem: NavItem = {
      key: "home",
      label: "Início",
      icon: Home,
      onSelect: () => navigate("/professor/home"),
      isActive:
        isRouteActive("/professor/home") ||
        isRouteActive("/home") ||
        isRouteActive("/"),
    };

    const studentDashboardItem: NavItem = {
      key: "aluno-dashboard",
      label: "Dashboard",
      icon: PieChart,
      onSelect: () => navigate("/aluno/dashboard"),
      isActive: location.pathname.startsWith("/aluno/dashboard"),
    };

    const studentQuestaoItem: NavItem = {
      key: "aluno-questoes",
      label: "Questões",
      icon: Newspaper,
      onSelect: () => navigate("/aluno/quiz/escolha"),
      isActive: location.pathname.startsWith("/aluno/quiz"),
    };

    const studentHistoricoItem: NavItem = {
      key: "aluno-historico",
      label: "Histórico",
      icon: Calendar,
      onSelect: () => navigate("/aluno/historico"),
      isActive: location.pathname.startsWith("/aluno/historico"),
    };

    const turmasItem: NavItem = {
      key: "turmas",
      label: "Turmas",
      icon: BookOpen,
      onSelect: () => navigate("/turmas"),
      isActive: location.pathname.startsWith("/turmas"),
    };

    const minhasTurmasAlunoItem: NavItem = {
      key: "minhas-turmas",
      label: "Minhas Turmas",
      icon: BookOpen,
      onSelect: () => navigate("/aluno/turmas"),
      isActive: location.pathname.startsWith("/aluno/turmas"),
    };

    const studentAmigosItem: NavItem = {
      key: "aluno-amigos",
      label: "Amigos",
      icon: Users,
      onSelect: () => navigate("/aluno/amigos"),
      isActive: location.pathname.startsWith("/aluno/amigos"),
    };

    const studentRankingItem: NavItem = {
      key: "aluno-ranking",
      label: "Ranking",
      icon: Medal,
      onSelect: () => navigate("/aluno/ranking"),
      isActive: location.pathname.startsWith("/aluno/ranking"),
    };

    const professorRankingItem: NavItem = {
      key: "professor-ranking",
      label: "Ranking",
      icon: Medal,
      onSelect: () => navigate("/professor/ranking"),
      isActive: location.pathname.startsWith("/professor/ranking"),
    };

    const studentLojaItem: NavItem = {
      key: "aluno-loja",
      label: "Loja",
      icon: ShoppingBag,
      onSelect: () => navigate("/aluno/loja"),
      isActive: location.pathname.startsWith("/aluno/loja"),
    };

    const studentConquistasItem: NavItem = {
      key: "aluno-conquistas",
      label: "Conquistas",
      icon: Trophy,
      onSelect: () => navigate("/aluno/conquistas"),
      isActive: location.pathname.startsWith("/aluno/conquistas"),
    };

    const listasItem: NavItem = {
      key: "listas",
      label: "Listas",
      icon: List,
      onSelect: () => navigate("/professor/lista"),
      isActive: location.pathname.startsWith("/professor/lista"), // CORRIGIDO: removido o 's' do final para coincidir com a rota real
    };

    // Cada papel define seu conjunto e ordem de itens no menu.
    switch (role) {
      // Professor: inicio, ver-como-aluno, questoes, listas, turmas e ranking.
      case "PROFESSOR":
        return [
          homeProfessorItem,
          // {
          //   key: "view-as-student",
          //   label: isViewingAsStudent
          //     ? "Sair da visão de aluno"
          //     : "Ver como aluno",
          //   icon: Eye,
          //   onSelect: handleToggleStudentView,
          //   isActive: isViewingAsStudent,
          // },
          {
            key: "questoes",
            label: "Questões",
            icon: Newspaper,
            onSelect: () => navigate("/professor/questoes"),
            isActive:
              location.pathname.startsWith("/professor/questoes") ||
              location.pathname.startsWith("/professor/criar-questao"),
          },
          listasItem,
          turmasItem,
          professorRankingItem,
        ];

      // Admin: apenas inicio e gerenciamento de usuarios.
      case "ADMIN":
      case "ADMINISTRADOR":
        return [
          {
            key: "admin-home",
            label: "Início",
            icon: Home,
            onSelect: () => navigate("/admin/home"),
            isActive:
              isRouteActive("/admin/home") ||
              isRouteActive("/home") ||
              isRouteActive("/"),
          },
          {
            key: "admin-users",
            label: "Gerenciar Usuários",
            icon: Users,
            onSelect: () => navigate("/admin/dashboard"),
            isActive:
              isRouteActive("/admin/dashboard") ||
              isRouteActive("/admin/usuarios"),
          },
        ];

      // Aluno (padrao): menu completo de estudo, social e gamificacao.
      case "STUDENT":
      default:
        return [
          homeItem,
          studentQuestaoItem,
          studentDashboardItem,
          minhasTurmasAlunoItem,
          studentAmigosItem,
          studentRankingItem,
          studentConquistasItem,
          studentLojaItem,
          studentHistoricoItem,
        ];
    }
  };

  // Itens do menu e flags derivadas do papel (saldo e perfil so para aluno).
  const navItems = buildNavItems(user.role);
  const shouldShowCoins = user.role === "STUDENT";
  const isPerfilAlunoActive = location.pathname.startsWith("/aluno/perfil") ||
    (Boolean(previewUser) && ["/perfil-preview", "/avatar-preview"].includes(location.pathname));

  // Executa a acao do item e fecha o drawer mobile.
  const handleSelect = (item: NavItem) => {
    item.onSelect();
    setIsDrawerOpen(false);
  };

  // Abre o perfil do aluno e fecha o drawer.
  const handlePerfilAluno = () => {
    navigate(previewUser ? "/perfil-preview" : "/aluno/perfil");
    setIsDrawerOpen(false);
  };

  // Conteudo compartilhado entre a sidebar (desktop) e o drawer (mobile):
  // logo, lista de navegacao e rodape (saldo, perfil e logout).
  const sidebarContent = (
    <>
      <div className="flex items-center justify-center px-4 py-2.5 border-b border-[#00214d]">
        <img src={logo} alt="AnatoQuizUp" className="w-full max-w-[140px]" />
      </div>

      <nav className="flex-1 min-h-0 py-2 flex flex-col gap-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const estiloItem = item.isActive
            ? "bg-[#F97316] text-white shadow-md"
            : "text-[#fffffe]/80 hover:bg-[#00214d] hover:text-[#71edc8]";

          return (
            <button
              key={item.key}
              onClick={() => handleSelect(item)}
              aria-current={item.isActive ? "page" : undefined}
              className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-left ${estiloItem}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#00214d] p-2.5 flex flex-col gap-2">
        {shouldShowCoins && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-2 text-[#fffffe]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-[#0A1128] flex items-center justify-center shrink-0">
                <Coins size={18} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#fffffe]/70">
                ATP
              </span>
            </div>
            <span className="text-lg font-black text-[#FDE68A] tabular-nums">
              {saldoMoedas}
            </span>
          </div>
        )}

        {shouldShowCoins ? (
          <button
            type="button"
            onClick={handlePerfilAluno}
            aria-current={isPerfilAlunoActive ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
              isPerfilAlunoActive ? "bg-[#71edc8]/10" : "hover:bg-[#00214d]"
            }`}
          >
            <div className="shrink-0">
              <AvatarCosmetico
                identidade={{ nome: user.name }}
                cosmeticos={cosmeticos}
                tamanho="sm"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-[#fffffe]">
                {user.name}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#fffffe]/40">
                Meu Perfil
              </span>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[#fffffe]/40" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="shrink-0">
              <AvatarCosmetico
                identidade={{ nome: user.name }}
                cosmeticos={{}}
                tamanho="sm"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#fffffe] truncate">
                {user.name}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#fffffe]/40">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => void handleLogout()}
          className="flex cursor-pointer items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fffffe]/60 hover:text-red-400 transition-colors rounded-lg"
          aria-label="Sair da conta"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Barra superior compacta, visivel apenas no mobile (logo + saldo + botao do menu). */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0A1128] h-16 flex items-center justify-between px-4 border-b border-[#00214d]">
        <button onClick={() => navigate("/home")} className="flex cursor-pointer items-center">
          <img src={logo} alt="AnatoQuizUp" className="h-10" />
        </button>

        <div className="flex items-center gap-2">
          {shouldShowCoins && (
            <div className="h-9 min-w-20 px-3 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#FDE68A] flex items-center justify-center gap-1.5">
              <Coins size={16} />
              <span className="text-sm font-black tabular-nums">{saldoMoedas}</span>
            </div>
          )}

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 cursor-pointer text-[#fffffe] hover:text-[#71edc8] transition-colors"
            aria-label="Abrir menu"
            aria-expanded={isDrawerOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Sidebar fixa do desktop. */}
      <aside className="hidden md:flex w-64 bg-[#0A1128] text-[#fffffe] flex-col sticky top-0 h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Drawer deslizante do mobile, aberto pelo botao do menu. */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50">
          <div
            ref={drawerRef}
            className="relative h-full w-64 bg-[#0A1128] text-[#fffffe] flex flex-col shadow-2xl"
          >
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute cursor-pointer top-3 right-3 z-10 p-2 text-[#fffffe] hover:text-[#71edc8] transition-colors"
              aria-label="Fechar menu"
            >
              <X size={22} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
