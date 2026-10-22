import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../../../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Eu', nickname: 'eu', visivel: true } }),
}));

jest.mock('../../../../../src/features/profile-cosmetics', () => ({
  converterItensEquipadosParaSlots: jest.fn(() => ({})),
}));

jest.mock('../../../../../src/features/progressao/progressaoService', () => ({
  buscarProgressoXp: jest.fn().mockRejectedValue(new Error('offline')),
}));

jest.mock('../../../../../src/features/ranking', () => ({
  obterRankingGeral: jest.fn(),
  obterRankingAmigos: jest.fn(),
  RankingBoard: ({
    linhas,
    carregando,
    erro,
    mensagemVazio,
    usuarioAtual,
    rotuloMetrica,
  }: {
    rotuloMetrica: string;
    linhas: Array<{ nome: string; pontuacao?: number; nivel?: number }>;
    carregando: boolean;
    erro: string | null;
    mensagemVazio: string;
    usuarioAtual?: { nome: string } | null;
  }) => (
    <div data-testid="board">
      {carregando ? 'carregando' : null}
      {erro}
      {!carregando && !erro && linhas.length === 0 ? mensagemVazio : null}
      <span data-testid="linhas">{linhas.map((l) => l.nome).join(',')}</span>
      <span data-testid="xp">{linhas.map((l) => `${l.pontuacao}/${l.nivel}`).join(',')}</span>
      <span data-testid="metrica">{rotuloMetrica}</span>
      <span data-testid="atual">{usuarioAtual?.nome ?? ''}</span>
    </div>
  ),
}));

import { buscarProgressoXp } from '../../../../../src/features/progressao/progressaoService';
import { obterRankingAmigos, obterRankingGeral } from '../../../../../src/features/ranking';
import { RankingAlunoPage } from '../../../../../src/pages/aluno/ranking/ui/RankingAlunoPage';

const geralMock = obterRankingGeral as jest.Mock;
const amigosMock = obterRankingAmigos as jest.Mock;
const progressoMock = buscarProgressoXp as jest.Mock;

const criarEntrada = (over: Record<string, unknown> = {}) => ({
  posicao: 1,
  usuarioId: 'u1',
  nome: 'Eu',
  nickname: null,
  curso: 'Medicina',
  semestre: '3',
  totalAcertos: 5,
  totalRespondidas: 6,
  taxaAcerto: 83,
  ehUsuarioAtual: true,
  cosmeticos: [],
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RankingAlunoPage />
    </MemoryRouter>,
  );

describe('RankingAlunoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mostra a posicao do usuario no ranking geral', async () => {
    geralMock.mockResolvedValue({
      dados: [criarEntrada()],
      usuarioAtual: criarEntrada(),
      totalParticipantes: 10,
    });

    renderPage();

    await waitFor(() => expect(geralMock).toHaveBeenCalled());
    expect(await screen.findByText('1º')).toBeInTheDocument();
    expect(screen.getByText(/de 10/)).toBeInTheDocument();
  });

  test('mostra banner de perfil privado, preserva elo real da API e exibe traco nos acertos quando usuarioAtual e nulo', async () => {
    geralMock.mockResolvedValue({ dados: [], usuarioAtual: null, totalParticipantes: 0 });
    progressoMock.mockResolvedValueOnce({
      xpTotal: 1940,
      nivel: 6,
      proximoNivel: 7,
      xpNoNivel: 140,
      xpNecessarioNoNivel: 300,
      xpFaltante: 160,
      percentual: 46,
    });

    renderPage();

    expect(await screen.findByText(/perfil está privado/i)).toBeInTheDocument();
    expect(await screen.findByText('Elo atual: Interno')).toBeInTheDocument();
    expect(screen.getByText('Taxa de acerto: —')).toBeInTheDocument();
  });

  test('troca para a aba de amigos e mostra dica quando esta sozinho', async () => {
    geralMock.mockResolvedValue({ dados: [], usuarioAtual: null, totalParticipantes: 0 });
    amigosMock.mockResolvedValue({
      dados: [criarEntrada()],
      usuarioAtual: criarEntrada(),
      totalParticipantes: 1,
    });

    renderPage();
    await waitFor(() => expect(geralMock).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Entre amigos'));

    await waitFor(() => expect(amigosMock).toHaveBeenCalled());
    expect(await screen.findByText(/Adicione amigos/i)).toBeInTheDocument();
  });

  test('monta detalhes e apelidos variados das linhas', async () => {
    geralMock.mockResolvedValue({
      dados: [
        criarEntrada({ usuarioId: 'u1', nome: 'Eu', ehUsuarioAtual: true, nickname: null, curso: 'Medicina', semestre: '3' }),
        criarEntrada({ usuarioId: 'b', nome: 'Bob', ehUsuarioAtual: false, nickname: 'bob', curso: 'Enfermagem', semestre: null }),
        criarEntrada({ usuarioId: 'c', nome: 'Cris', ehUsuarioAtual: false, nickname: null, curso: null, semestre: null }),
      ],
      usuarioAtual: criarEntrada(),
      totalParticipantes: 3,
    });

    renderPage();

    await waitFor(() => expect(geralMock).toHaveBeenCalled());
    expect(await screen.findByTestId('linhas')).toHaveTextContent('Eu,Bob,Cris');
  });

  test('repassa XP e nivel ao quadro e usa XP como metrica do ranking', async () => {
    geralMock.mockResolvedValue({
      dados: [
        criarEntrada({ usuarioId: 'u1', nome: 'Eu', xpTotal: 320, nivel: 3 }),
        // Resposta de um backend ainda sem XP: cai para 0 XP no nivel 1.
        criarEntrada({ usuarioId: 'b', nome: 'Bob', ehUsuarioAtual: false }),
      ],
      usuarioAtual: criarEntrada({ xpTotal: 320, nivel: 3 }),
      totalParticipantes: 2,
    });

    renderPage();

    expect(await screen.findByTestId('xp')).toHaveTextContent('320/3,0/1');
    expect(screen.getByTestId('metrica')).toHaveTextContent('XP');
    expect(screen.getByText(/pelo XP acumulado/i)).toBeInTheDocument();
  });

  test('mostra erro quando a busca falha', async () => {
    geralMock.mockRejectedValue(new Error('falhou ao carregar'));

    renderPage();

    expect(await screen.findByText('falhou ao carregar')).toBeInTheDocument();
  });

  test('exibe o elo atual, preserva maior elo e navega para Minha progressao e Todos os elos', async () => {
    geralMock.mockResolvedValue({
      dados: [criarEntrada({ xpTotal: 1940, nivel: 6, elo: 'R3', totalAcertos: 96, taxaAcerto: 84 })],
      usuarioAtual: criarEntrada({ xpTotal: 1940, nivel: 6, elo: 'R3', totalAcertos: 96, taxaAcerto: 84 }),
      totalParticipantes: 5,
    });

    renderPage();

    await waitFor(() => expect(geralMock).toHaveBeenCalled());
    expect(await screen.findByText('Seu elo')).toBeInTheDocument();
    expect(screen.getByText('Seus acertos')).toBeInTheDocument();
    expect(screen.getByText('Elo atual: R3')).toBeInTheDocument();

    // Abre a visao "Minha progressao" (Tela 2 do Figma).
    fireEvent.click(screen.getAllByRole('button', { name: 'Minha progressão' })[0]);
    expect(await screen.findByRole('heading', { name: 'Minha progressão' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Minha progressão de elos' })).toBeInTheDocument();

    // Abre a visao "Todos os elos" (Tela 3 do Figma) pelo botao interno.
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os elos' }));
    expect(await screen.findByRole('heading', { name: 'Todos os elos' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Todos os elos' })).toBeInTheDocument();

    // Volta para a visao principal do ranking.
    fireEvent.click(screen.getByRole('button', { name: 'Ver ranking' }));
    expect(await screen.findByRole('heading', { name: 'Ranking' })).toBeInTheDocument();
  });
});
