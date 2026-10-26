import { Outlet } from 'react-router-dom';
import { Header } from '../../widgets/header';
import { CosmeticsBootstrap } from '../../features/profile-cosmetics';
import { StudentCoinsBootstrap } from '../../features/student-coins';
import { AchievementUnlockModal } from '../../features/achievements';
import { NotificacaoEloModal, NotificacoesEloBootstrap } from '../../features/progressao';

export const AuthenticatedLayout = () => (
  <div className="min-h-screen flex flex-col md:flex-row bg-white">
    <StudentCoinsBootstrap />
    <CosmeticsBootstrap />
    <NotificacoesEloBootstrap />
    <AchievementUnlockModal />
    <NotificacaoEloModal />
    <Header />
    <main className="flex-1 min-w-0">
      <Outlet />
    </main>
  </div>
);
