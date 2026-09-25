import { PreviewLayout } from '../pages/aluno/avatar/PreviewLayout';
import { ProfilePreviewPage } from '../pages/aluno/avatar/ProfilePreviewPage';
import { AvatarPreviewPage } from '../pages/aluno/avatar/AvatarPreviewPage';
import { AvatarPage } from '../pages/aluno/avatar/AvatarPage';
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/index";
import { HomePage } from "../pages/home/index";
import { HomeAlunoPage } from "../pages/homeAluno/index";
import { RegisterPage } from "../pages/register/index";
import { ProfessorRegisterPage } from "../pages/professor-register";
import { ForgotPasswordPage } from "../pages/forgot-password";
import { ResetPasswordPage } from "../pages/reset-password";
import { AuthenticatedLayout } from "./layouts/AuthenticatedLayout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { HomeProfessorPage } from "../pages/homeProfessor";
import { QuestionsPage } from "../pages/questao";
import { CreateQuestionPage } from "../pages/professor/criar-questao";
import { TurmasPage } from "../pages/turma/ui/TurmaPage";
import { MinhasTurmasAlunoPage } from "../pages/aluno/minhas-turmas";
import { TurmaDetalheAlunoPage } from "../pages/aluno/turma";
import { TurmaDetalhesPage } from "../pages/TurmaDetalhes";
import { ResponderListaPage } from "../pages/resolucaoLista/ui/ResolucaoListaPage";
import { PersonalizarPerfilPage } from '../pages/aluno/perfil/personalizar/PersonalizarPerfilPage';

import { ListaPage } from "../pages/lista-professor/ui/ListaPage";
import { EscolhaQuizPage, ResponderQuizPage } from "../pages/quizAluno";
import { HistoricoPage } from "../pages/historicoAluno/ui/HistoricoPage";
import { HistoricoDetalhesPage } from "../pages/historicoAluno/ui/HistoricoDetalhesPage";

import { AdminDashboardPage } from "../pages/admin/ui/AdminDashboardPage";
import { HomeAdminPage } from "../pages/admin/ui/HomeAdminPage";

import { DashboardAlunoPage } from "../pages/dashboardAluno";
import { RankingAlunoPage } from "../pages/aluno/ranking";
import { RankingProfessorPage } from "../pages/professor/ranking";
import { AmigosPage } from "../pages/amigosAluno";
import { AmigoPerfilPage } from "../pages/aluno/amigo";
import { PerfilAlunoPage } from "../pages/aluno/perfil";
import { EditarPerfilPage } from "../pages/aluno/perfil/editar";
import { LojaPage } from "../pages/aluno/loja";
import { ConquistasPage } from "../pages/aluno/conquistas";

import { NotFoundPage } from '../pages/not-found';

/**
 * Tabela de rotas da aplicacao. Reune as rotas publicas (login/cadastro/recuperacao)
 * e, dentro do layout autenticado, as rotas protegidas por papel (aluno/professor/admin)
 * via ProtectedRoute. Qualquer caminho desconhecido cai na pagina 404.
 */
export const AppRouter = () => {
  return (
    <Routes>
      {/* Prévia disponível apenas no servidor local de desenvolvimento. */}
      {import.meta.env.DEV && <Route element={<PreviewLayout />}>
        <Route path="/perfil-preview" element={<ProfilePreviewPage />} />
        <Route path="/avatar-preview" element={<AvatarPreviewPage />} />
      </Route>}

      {/* Rotas publicas: autenticacao e recuperacao de senha. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/professor/cadastro" element={<ProfessorRegisterPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      {/* Raiz redireciona para a home publica. */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />

      {/* TODAS AS ROTAS AQUI DENTRO TERÃO A BARRA LATERAL (MENU) */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        {/* Rotas do aluno (papel STUDENT): home, dashboard, perfil, turmas, ranking, etc. */}
        <Route
          path="/aluno/home"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <HomeAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route path="/aluno/perfil/avatar" element={<ProtectedRoute allowedRoles={['STUDENT']}><AvatarPage /></ProtectedRoute>} />

        {/* NOVA ROTA DO DASHBOARD */}
        <Route
          path="/aluno/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/perfil"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <PerfilAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/perfil/editar"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <EditarPerfilPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/perfil/personalizar"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <PersonalizarPerfilPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/turmas"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MinhasTurmasAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/turmas/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <TurmaDetalheAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/turmas/:turmaId/listas/:listaId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ResponderListaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/ranking"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <RankingAlunoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/amigos"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AmigosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/amigos/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AmigoPerfilPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/loja"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <LojaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aluno/conquistas"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ConquistasPage />
            </ProtectedRoute>
          }
        />

        {/* Fluxo de quiz avulso e historico do aluno. */}
        <Route
          path="/aluno/quiz/escolha"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <EscolhaQuizPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/aluno/quiz/responder"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ResponderQuizPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/aluno/historico"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <HistoricoPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/aluno/historico/detalhes"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <HistoricoDetalhesPage />
            </ProtectedRoute>
          } 
        />

        {/* Rotas do professor (e admin onde aplicavel): home, ranking, questoes, listas e turmas. */}
        <Route
          path="/professor/home"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR']}>
              <HomeProfessorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professor/ranking"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <RankingProfessorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professor/questoes"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <QuestionsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/professor/criar-questao"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <CreateQuestionPage openCreateModal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professor/lista"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <ListaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/turmas"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <TurmasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/turmas/:id"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR', 'ADMIN']}>
              <TurmaDetalhesPage />
            </ProtectedRoute>
          }
        />

        {/* --- ROTAS DO ADMIN --- */}
        <Route
          path="/admin/home"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <HomeAdminPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        
      </Route>

      {/* Rota coringa: qualquer caminho nao mapeado exibe a pagina 404. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
