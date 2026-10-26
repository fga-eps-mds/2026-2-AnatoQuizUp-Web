import { test, expect } from '@playwright/test';

test('aluno consulta missões, vê progresso e pode tentar novamente', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('access_token', 'teste'));
  let falhar = false;
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/autenticacao/usuario-atual'))
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
    if (url.includes('/missoes/minhas')) {
      if (falhar) return route.fulfill({ status: 503, json: {} });
      return route.fulfill({
        json: {
          periodo: { fim: new Date(Date.now() + 3600000).toISOString() },
          resumo: { concluidas: 1, total: 2, xpGanhoHoje: 30 },
          missoes: [
            {
              id: '1',
              nome: 'Aquecimento diário',
              descricao: 'Responda 5 questões.',
              meta: 5,
              progresso: 5,
              recompensaXp: 30,
              status: 'CONCLUIDA',
            },
            {
              id: '2',
              nome: 'Precisão anatômica',
              descricao: 'Acerte 8 questões.',
              meta: 8,
              progresso: 4,
              recompensaXp: 50,
              status: 'EM_ANDAMENTO',
            },
          ],
        },
      });
    }
    return route.fulfill({ json: { dados: {} } });
  });
  await page.goto('/aluno/missoes');
  await expect(page.getByRole('heading', { name: 'Missões diárias' })).toBeVisible();
  await expect(page.getByText('Aquecimento diário')).toBeVisible();
  await expect(page.getByText('1 de 2 missões concluídas')).toBeVisible();
  await page.screenshot({ path: '/tmp/eps-84-missoes.png', fullPage: true });
  falhar = true;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  falhar = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('Precisão anatômica')).toBeVisible();
});
