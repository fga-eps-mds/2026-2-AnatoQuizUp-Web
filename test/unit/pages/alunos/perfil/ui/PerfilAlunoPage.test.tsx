import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../../../../../src/app/providers/AuthProvider';
import { obterRankingGeral } from '../../../../../../src/features/ranking';
import { useStudentCoinsStore } from '../../../../../../src/features/student-coins/model/useStudentCoinsStore';
import { httpClient } from '../../../../../../src/shared/api/httpClient';
import { PerfilAlunoPage } from '../../../../../../src/pages/aluno/perfil';
import { AvatarPage } from '../../../../../../src/pages/aluno/avatar/AvatarPage';

jest.mock('../../../../../../src/app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../../../../../../src/features/ranking', () => ({ obterRankingGeral: jest.fn() }));
jest.mock('../../../../../../src/shared/api/httpClient', () => ({ httpClient: { get: jest.fn() } }));

const auth = useAuth as jest.Mock;
const dashboard = httpClient.get as jest.Mock;
const ranking = obterRankingGeral as jest.Mock;
const aluno = {
  id: 'aluno-1', name: 'Leticia Martins', nickname: 'letmartins', email: 'leticia@example.com',
  role: 'STUDENT', status: 'ACTIVE', authProvider: 'LOCAL', institution: 'UnB',
  course: 'Medicina', period: 9, birthDate: '2002-02-16', createdAt: '2025-04-05T12:00:00.000Z',
};

function renderRoutes() {
  return render(<MemoryRouter initialEntries={['/aluno/perfil']}><Routes>
    <Route path="/aluno/perfil" element={<PerfilAlunoPage />} />
    <Route path="/aluno/perfil/avatar" element={<AvatarPage />} />
    <Route path="/aluno/perfil/editar" element={<div>Editar informações</div>} />
  </Routes></MemoryRouter>);
}

beforeEach(() => {
  jest.clearAllMocks();
  useStudentCoinsStore.getState().setSaldoMoedas(1240);
  auth.mockReturnValue({ user: aluno });
  dashboard.mockImplementation((url: string) => {
    if (url === '/dashboardAluno') return Promise.resolve({ data: { totalRespondidas: 4000, totalAcertos: 3108, taxaAcerto: 70 } });
    if (url === '/amizade') return Promise.resolve({ data: { metadados: { total: 7 } } });
    if (url === '/conquistas/destaques') return Promise.resolve({ data: { dados: [] } });
    return Promise.resolve({ data: [] });
  });
  ranking.mockResolvedValue({ usuarioAtual: { posicao: 12 } });
});

test('shows the real profile information and dashboard values', async () => {
  renderRoutes();
  expect(screen.getByRole('heading', { name: 'Olá, Leticia' })).toBeInTheDocument();
  expect(screen.getByText('LM')).toBeInTheDocument();
  expect(screen.getByText('16/02/2002')).toBeInTheDocument();
  expect(screen.getByText('9º semestre')).toBeInTheDocument();
  expect(screen.getByText('05/04/2025')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('3.108')).toBeInTheDocument());
  expect(screen.getAllByText('12')).toHaveLength(1);
  expect(screen.getAllByText('70%')).toHaveLength(1);
  expect(screen.getAllByText('leticia@example.com')).toHaveLength(1);
  expect(screen.getAllByText('Leticia Martins')).toHaveLength(1);
  expect(screen.getByText('1.240 ATP')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /4\.000\s+Questões respondidas/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /7\s+Amigos/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Conquistas em destaque' })).toBeInTheDocument();
});

test('opens the avatar page from Meu avatar and returns to profile', async () => {
  const user = userEvent.setup();
  renderRoutes();
  await user.click(screen.getAllByRole('link', { name: 'Meu avatar' })[0]);
  expect(screen.getByRole('heading', { name: 'Seu avatar' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Cérebro do AnatoQuizUp' })).toBeInTheDocument();
  expect(screen.queryByText('Acessórios')).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Perfil' }));
  expect(screen.getByRole('heading', { name: 'Olá, Leticia' })).toBeInTheDocument();
});

test('shows unavailable fields honestly and keeps the edit action', async () => {
  auth.mockReturnValue({ user: { ...aluno, birthDate: null, institution: null, period: null } });
  dashboard.mockRejectedValue(new Error('offline'));
  ranking.mockRejectedValue(new Error('offline'));
  const user = userEvent.setup();
  renderRoutes();
  expect(screen.getAllByText('Não informado')).toHaveLength(3);
  await user.click(screen.getAllByRole('button', { name: 'Editar informações' })[0]);
  expect(screen.getByText('Editar informações')).toBeInTheDocument();
});
