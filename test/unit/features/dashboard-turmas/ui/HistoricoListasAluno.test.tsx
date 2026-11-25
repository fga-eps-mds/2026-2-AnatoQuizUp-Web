import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buscarHistoricoAluno } from '../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi';
import { HistoricoListasAluno } from '../../../../../src/features/dashboard-turmas/ui/HistoricoListasAluno';

jest.mock('../../../../../src/entities/dashboardTurma/api/dashboardTurmaApi', () => ({
  buscarHistoricoAluno: jest.fn(),
}));

const buscar = jest.mocked(buscarHistoricoAluno);

it('exibe entregas e pendências e atualiza o histórico ao mudar de semestre', async () => {
  buscar.mockResolvedValueOnce([
    { listaTurmaId: '1', nomeLista: 'Anatomia', publicadaEm: '2026-01-15T12:00:00Z', status: 'ENTREGUE' },
    { listaTurmaId: '2', nomeLista: 'Osteologia', publicadaEm: '2026-02-15T12:00:00Z', status: 'PENDENTE' },
  ]).mockResolvedValueOnce([]);

  render(<HistoricoListasAluno turmaId="turma-1" alunoId="aluno-1" />);

  expect(await screen.findByText('Entregue')).toBeInTheDocument();
  expect(screen.getByText('Pendente')).toBeInTheDocument();
  const outroSemestre = new Date().getMonth() < 6 ? '2º semestre' : '1º semestre';
  await userEvent.click(screen.getByRole('button', { name: outroSemestre }));
  expect(await screen.findByText('Nenhuma lista publicada no período.')).toBeInTheDocument();
  expect(buscar.mock.calls[0][2]).not.toEqual(buscar.mock.calls[1][2]);
});
