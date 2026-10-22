import { fireEvent, render, screen } from '@testing-library/react';
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
});
