import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { httpClient } from '../../../shared/api/httpClient';
import { MissoesPage } from './MissoesPage';

jest.mock('../../../shared/api/httpClient', () => ({ httpClient: { get: jest.fn() } }));
const get = jest.mocked(httpClient.get);
const fim = new Date(Date.now() + 3_600_000).toISOString();
const renderPage = () =>
  render(
    <MemoryRouter>
      <MissoesPage />
    </MemoryRouter>,
  );

describe('Missões diárias', () => {
  beforeEach(() => get.mockReset());
  it('mostra o progresso e XP devolvidos pelo serviço', async () => {
    get.mockResolvedValue({
      data: {
        periodo: { fim },
        resumo: { concluidas: 1, total: 1, xpGanhoHoje: 30 },
        missoes: [
          {
            id: '1',
            nome: 'Aquecimento diário',
            descricao: 'Responda questões',
            meta: 5,
            progresso: 5,
            recompensaXp: 30,
            status: 'CONCLUIDA',
          },
        ],
      },
    });
    renderPage();
    expect(await screen.findByText('Aquecimento diário')).toBeInTheDocument();
    expect(screen.getByText('Você completou as missões de hoje!')).toBeInTheDocument();
    expect(screen.getByText('30 XP')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar', { name: 'Progresso: 100%' })).toHaveLength(2);
  });
  it('permite tentar novamente após erro', async () => {
    get
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValueOnce({
        data: {
          periodo: { fim },
          resumo: { concluidas: 0, total: 0, xpGanhoHoje: 0 },
          missoes: [],
        },
      });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Nenhuma missão disponível agora')).toBeInTheDocument();
  });
  it('mostra missão em andamento e o tempo de renovação', async () => {
    get.mockResolvedValue({
      data: {
        periodo: { fim },
        resumo: { concluidas: 0, total: 1, xpGanhoHoje: 0 },
        missoes: [{ id: '2', nome: 'Prática diária', descricao: 'Responda questões', meta: 10, progresso: 4, recompensaXp: 50, status: 'EM_ANDAMENTO' }],
      },
    });
    renderPage();
    expect(await screen.findByText('Prática diária')).toBeInTheDocument();
    expect(screen.getByText('4 de 10')).toBeInTheDocument();
    expect(screen.getByText('EM ANDAMENTO')).toBeInTheDocument();
    expect(screen.getByText(/Renova em/)).toBeInTheDocument();
  });
  it('busca novas missões quando chega o fim do período', async () => {
    jest.useFakeTimers();
    const inicio = new Date('2026-10-22T12:00:00Z');
    jest.setSystemTime(inicio);
    const resposta = (termino: string) => ({ data: { periodo: { fim: termino }, resumo: { concluidas: 0, total: 0, xpGanhoHoje: 0 }, missoes: [] } });
    get.mockResolvedValueOnce(resposta(new Date(inicio.getTime() + 1000).toISOString()))
      .mockResolvedValueOnce(resposta(new Date(inicio.getTime() + 86_400_000).toISOString()));
    renderPage();
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('Nenhuma missão disponível agora')).toBeInTheDocument();
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    expect(get).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Nenhuma missão disponível agora')).toBeInTheDocument();
    jest.useRealTimers();
  });
  it('mostra erro quando a atualização da renovação falha', async () => {
    jest.useFakeTimers();
    const inicio = new Date('2026-10-22T12:00:00Z');
    jest.setSystemTime(inicio);
    get.mockResolvedValueOnce({ data: { periodo: { fim: new Date(inicio.getTime() + 1000).toISOString() }, resumo: { concluidas: 0, total: 0, xpGanhoHoje: 0 }, missoes: [] } })
      .mockRejectedValueOnce(new Error('rede'));
    renderPage();
    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    expect(screen.getByRole('alert')).toHaveTextContent('Não conseguimos carregar suas missões');
    jest.useRealTimers();
  });
});

describe('Missões semanais', () => {
  beforeEach(() => get.mockReset());

  it('consulta o período semanal e mostra progresso e recompensa', async () => {
    get.mockResolvedValue({ data: {
      periodo: { fim },
      resumo: { concluidas: 1, total: 1, xpGanhoHoje: 0, xpGanhoNoPeriodo: 100 },
      missoes: [{ id: 's1', nome: 'Constância semanal', descricao: 'Responda 20 questões diferentes.', meta: 20, progresso: 20, recompensaXp: 100, status: 'CONCLUIDA' }],
    } });

    render(<MemoryRouter><MissoesPage periodicidade="semanais" /></MemoryRouter>);

    expect(await screen.findByText('Constância semanal')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/missoes/minhas/semanais');
    expect(screen.getByText('Você completou as missões da semana!')).toBeInTheDocument();
    expect(screen.getByText('100 XP')).toBeInTheDocument();
    expect(screen.getByText('ganhos nesta semana')).toBeInTheDocument();
  });
});
