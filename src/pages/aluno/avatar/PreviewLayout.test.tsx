import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { PreviewLayout } from './PreviewLayout';
import { ProfilePreviewPage } from './ProfilePreviewPage';
import { AvatarPreviewPage } from './AvatarPreviewPage';

jest.mock('../../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

test('preview keeps the project sidebar while navigating from profile to avatar', async () => {
  (useAuth as jest.Mock).mockReturnValue({ user: null, logout: jest.fn() });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/perfil-preview']}><Routes>
    <Route element={<PreviewLayout />}>
      <Route path="/perfil-preview" element={<ProfilePreviewPage />} />
      <Route path="/avatar-preview" element={<AvatarPreviewPage />} />
    </Route>
  </Routes></MemoryRouter>);
  expect(screen.getAllByRole('img', { name: 'AnatoQuizUp' })[0]).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Aluno Exemplo Meu Perfil/i })).toBeInTheDocument();
  await user.click(screen.getAllByRole('link', { name: 'Meu avatar' })[0]);
  expect(screen.getByRole('heading', { name: 'Seu avatar' })).toBeInTheDocument();
  expect(screen.getAllByRole('img', { name: 'AnatoQuizUp' })[0]).toBeInTheDocument();
});
