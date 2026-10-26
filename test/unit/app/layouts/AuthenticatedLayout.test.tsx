jest.mock('../../../../src/widgets/header', () => ({
  Header: () => <header>App header</header>,
}));

jest.mock('../../../../src/features/student-coins', () => ({
  StudentCoinsBootstrap: () => null,
}));

jest.mock('../../../../src/features/profile-cosmetics', () => ({
  CosmeticsBootstrap: () => <span data-testid="cosmetics-bootstrap" />,
}));

jest.mock('../../../../src/features/progressao', () => ({
  NotificacoesEloBootstrap: () => <span data-testid="notificacoes-elo-bootstrap" />,
  NotificacaoEloModal: () => null,
}));

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthenticatedLayout } from '../../../../src/app/layouts/AuthenticatedLayout';

describe('AuthenticatedLayout', () => {
  it('renders the header and nested route content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<section>Protected content</section>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('App header')).toBeInTheDocument();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.getByTestId('cosmetics-bootstrap')).toBeInTheDocument();
    expect(screen.getByTestId('notificacoes-elo-bootstrap')).toBeInTheDocument();
  });
});
