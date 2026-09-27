import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AvatarPage } from './AvatarPage';

jest.mock('../../../app/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
const mockedUseAuth = jest.mocked(useAuth);

const renderPage = () => render(<MemoryRouter><AvatarPage /></MemoryRouter>);

describe('AvatarPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1', name: 'Aluno Teste' },
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('renderiza a aba Aparência com cores e cabelos por padrão', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Personalize seu avatar' })).toBeInTheDocument();
    expect(screen.getByText('Cor do Cérebro')).toBeInTheDocument();
    expect(screen.getByText('Cabelo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nenhum' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra as abas Roupas e Acessórios desabilitadas (fora de escopo)', () => {
    renderPage();

    expect(screen.getByRole('tab', { name: 'Roupas' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Acessórios' })).toBeDisabled();
  });

  it('habilita Salvar/Cancelar somente após alterar a seleção', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Roxo' }));

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('persiste a escolha no localStorage ao salvar', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Loiro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    const salvo = JSON.parse(localStorage.getItem('anatoquizup:avatar:user-1') ?? '{}');
    expect(salvo).toMatchObject({ cabelo: 'loiro' });
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('descarta o rascunho ao cancelar, voltando ao que estava salvo', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));
    expect(screen.getByRole('button', { name: 'Azul' })).toHaveClass('selecionado');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('button', { name: 'Rosa' })).toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Azul' })).not.toHaveClass('selecionado');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('restaura para o padrão e limpa o localStorage', () => {
    localStorage.setItem('anatoquizup:avatar:user-1', JSON.stringify({ corCerebro: 'verde', cabelo: 'moicano' }));
    renderPage();

    expect(screen.getByRole('button', { name: 'Verde' })).toHaveClass('selecionado');

    fireEvent.click(screen.getByRole('button', { name: /Restaurar alterações/i }));

    expect(localStorage.getItem('anatoquizup:avatar:user-1')).toBeNull();
    expect(screen.getByRole('button', { name: 'Rosa' })).toHaveClass('selecionado');
    expect(screen.getByText('Avatar restaurado ao padrão.')).toBeInTheDocument();
  });
});
