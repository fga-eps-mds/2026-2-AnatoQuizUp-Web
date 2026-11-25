import { test, expect } from '@playwright/test';

test('aluno escolhe um cenário, conversa com o paciente e vê o feedback da rubrica', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('access_token', 'teste'));

  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/autenticacao/usuario-atual')) {
      return route.fulfill({
        json: {
          dados: {
            usuario: {
              id: 'aluno-1',
              nome: 'Aluno',
              email: 'aluno@example.com',
              papel: 'ALUNO',
              status: 'ATIVO',
            },
          },
        },
      });
    }

    if (url.includes('/ia/osce/cenarios')) {
      return route.fulfill({
        json: {
          cenarios: [
            {
              id: 'caso-1',
              titulo: 'Dor torácica aguda',
              especialidade: 'Cardiologia',
              dificuldade: 'Médio',
            },
          ],
        },
      });
    }

    if (method === 'POST' && url.includes('/ia/osce/caso-1/mensagem')) {
      return route.fulfill({
        json: { resposta: 'A dor começou há duas horas, no peito, e piora ao respirar.' },
      });
    }

    if (method === 'POST' && url.includes('/ia/osce/caso-1/finalizar')) {
      return route.fulfill({
        json: {
          avaliacao: {
            cenarioId: 'caso-1',
            titulo: 'Dor torácica aguda',
            diagnosticoEsperado: 'Síndrome coronariana aguda',
            comentarioFinal: 'Boa anamnese, cobriu os principais pontos da queixa.',
            itens: [
              {
                id: 'item-1',
                dominio: 'Anamnese',
                descricao: 'Investigou características da dor (início, irradiação, fatores de piora)',
                ancoras: { competente: 'Perguntou início, irradiação e fatores de piora/melhora' },
                peso: 2,
                permiteParcial: false,
                nivel: 'competente',
                justificativa: 'Perguntou início e fator de piora.',
                pontos: 2,
                pontosMaximos: 2,
              },
            ],
            pontuacao: 2,
            pontuacaoMaxima: 2,
            percentual: 100,
            nivelChecklist: 'excelente',
            rotuloChecklist: 'Excelente',
            notaGlobal: 4,
            rotuloNotaGlobal: 'Excelente',
            ancoraNotaGlobal: 'Conduz a anamnese com autonomia.',
            justificativaNotaGlobal: 'Cobriu os pontos essenciais sem necessitar de pistas.',
            aprovado: true,
            itensCriticosNaoCumpridos: [],
            divergente: false,
          },
        },
      });
    }

    return route.fulfill({ json: { dados: {} } });
  });

  await page.goto('/aluno/osce');

  await expect(page.getByRole('heading', { name: 'Simulação OSCE' })).toBeVisible();
  await expect(page.getByText('Dor torácica aguda')).toBeVisible();

  await page.getByText('Dor torácica aguda').click();

  // Tela "porta da estação": o aluno lê o cenário antes do chat abrir.
  await expect(page.getByRole('heading', { name: 'Dor torácica aguda' })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar atendimento' }).click();

  // Trecho estável do placeholder (sem o sufixo literal), resiliente a ajustes de
  // texto que a US25 venha a trazer no campo de mensagem.
  const textarea = page.getByPlaceholder('Pergunte algo ao paciente');
  await textarea.fill('Qual é a sua queixa principal e desde quando ela começou?');
  await page.getByRole('button', { name: 'Enviar pergunta ao paciente' }).click();

  await expect(
    page.getByText('A dor começou há duas horas, no peito, e piora ao respirar.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Encerrar e receber feedback' }).click();

  const feedback = page.getByRole('region', { name: 'Resultado da estação OSCE' });
  await expect(feedback).toBeVisible();
  await expect(feedback.getByText('Síndrome coronariana aguda')).toBeVisible();
  await expect(feedback.getByText('Aprovado')).toBeVisible();
  await expect(feedback.getByText('2 / 2 pts', { exact: true })).toBeVisible();
});
