import { testAluno as test, expect } from '../../playwright/login.fixtures';

const api = process.env.E2E_BFF_URL ?? 'http://localhost:14000/api/v1';

type Missao = { id: string; nome: string; tipo: string; progresso: number; meta: number; recompensaXp: number; status: string };
type Missoes = { missoes: Missao[]; resumo: { total: number } };

test('missões são exibidas e avançam após uma resposta real de quiz', async ({ page, request }) => {
  test.setTimeout(90000);
  await page.goto('/aluno/missoes');
  await expect(page.getByRole('heading', { name: 'Missões diárias' })).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };
  expect((await request.get(`${api}/missoes/minhas`)).status()).toBe(401);
  const buscar = async (): Promise<Missoes> => {
    const response = await request.get(`${api}/missoes/minhas`, { headers });
    expect(response.status()).toBe(200);
    return response.json();
  };
  const antes = await buscar();
  expect(antes.resumo.total).toBe(3);
  const tentativaOutro = await request.get(`${api}/missoes/minhas?usuarioId=outro`, { headers });
  expect(tentativaOutro.status()).toBe(200);
  expect((await tentativaOutro.json() as Missoes).missoes.map((m) => m.id)).toEqual(antes.missoes.map((m) => m.id));
  for (const missao of antes.missoes) await expect(page.getByRole('heading', { name: missao.nome })).toBeVisible();
  const questoes = await request.get(`${api}/quiz?limit=100`, { headers });
  expect(questoes.status()).toBe(200);
  const { dados } = await questoes.json() as { dados: { id: string; tipo: string }[] };
  expect(dados.length).toBeGreaterThan(0);
  const questao = dados[0];
  const body = { questaoId: questao.id, tipo: questao.tipo, respostaMarcada: questao.tipo === 'CERTO_ERRADO' ? 'C' : 'A' };
  const resposta = await request.post(`${api}/quiz/responder`, { headers, data: body });
  expect(resposta.status()).toBe(200);
  const feedback = await resposta.json() as { correcao: boolean };
  const depois = await buscar();
  for (const missao of antes.missoes) {
    const nova = depois.missoes.find((m) => m.id === missao.id)!;
    const conta = missao.tipo === 'RESPONDER_QUESTOES' || (missao.tipo === 'ACERTAR_QUESTOES' && feedback.correcao);
    expect(nova.progresso).toBe(Math.min(missao.meta, missao.progresso + (conta ? 1 : 0)));
  }
  expect((await request.post(`${api}/quiz/responder`, { headers, data: body })).status()).toBe(200);
  const repetida = await buscar();
  expect(repetida.missoes.map((m) => m.progresso)).toEqual(depois.missoes.map((m) => m.progresso));
  await page.reload();
  for (const missao of depois.missoes) {
    await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: missao.nome }) })).toContainText(`${missao.progresso} de ${missao.meta}`);
  }

  // O professor consulta o gabarito sem participar das missões; assim o teste
  // usa questões reais do seed e consegue concluir qualquer missão sorteada.
  const loginProfessor = await request.post(`${api}/autenticacao/login`, {
    data: { email: 'professor@anatoquizup.com', senha: 'professor123' },
  });
  expect(loginProfessor.status()).toBe(200);
  const professor = await loginProfessor.json() as { dados: { accessToken: string } };
  const professorHeaders = { Authorization: `Bearer ${professor.dados.accessToken}` };
  expect((await request.get(`${api}/missoes/minhas`, { headers: professorHeaders })).status()).toBe(403);
  const progressoAntes = await (await request.get(`${api}/quiz/progresso`, { headers })).json() as { xpTotal: number };
  const vistas = new Set([questao.id]);
  let atual = depois;
  for (let tentativa = 0; tentativa < 35 && !atual.missoes.some((m) => m.status === 'CONCLUIDA'); tentativa++) {
    const lista = await (await request.get(`${api}/quiz?limit=100`, { headers })).json() as { dados: { id: string; tipo: string }[] };
    for (const item of lista.dados) {
      if (vistas.has(item.id)) continue;
      vistas.add(item.id);
      const sondagem = await request.post(`${api}/quiz/responder`, {
        headers: professorHeaders,
        data: { questaoId: item.id, tipo: item.tipo, respostaMarcada: item.tipo === 'CERTO_ERRADO' ? 'C' : 'A' },
      });
      expect(sondagem.status()).toBe(200);
      const gabarito = await sondagem.json() as { respostaCorreta: string };
      const registro = await request.post(`${api}/quiz/responder`, {
        headers,
        data: { questaoId: item.id, tipo: item.tipo, respostaMarcada: gabarito.respostaCorreta },
      });
      expect(registro.status()).toBe(200);
      atual = await buscar();
      if (atual.missoes.some((m) => m.status === 'CONCLUIDA')) break;
    }
  }
  const concluidas = atual.missoes.filter((m) => m.status === 'CONCLUIDA');
  expect(concluidas.length).toBeGreaterThan(0);
  const progressoDepois = await (await request.get(`${api}/quiz/progresso`, { headers })).json() as { xpTotal: number; nivel: number };
  expect(progressoDepois.xpTotal - progressoAntes.xpTotal).toBe(concluidas.reduce((soma, m) => soma + m.recompensaXp, 0));
  const rankingResponse = await request.get(`${api}/ranking/geral`, { headers });
  expect(rankingResponse.status()).toBe(200);
  const ranking = await rankingResponse.json() as { usuarioAtual: { xpTotal: number; nivel: number } };
  expect(ranking.usuarioAtual.xpTotal).toBe(progressoDepois.xpTotal);
  expect(ranking.usuarioAtual.nivel).toBe(progressoDepois.nivel);
  const historico = await (await request.get(`${api}/quiz/xp/historico`, { headers })).json() as {
    dados: { origem: string; valor: number; missao: { nome: string } | null }[];
  };
  for (const missao of concluidas) {
    expect(historico.dados.filter((item) => item.origem === 'MISSAO_CONCLUIDA' && item.missao?.nome === missao.nome)).toEqual([
      expect.objectContaining({ valor: missao.recompensaXp }),
    ]);
  }
  await page.reload();
  await expect(page.getByText('CONCLUÍDA').first()).toBeVisible();
  const aposRecarregar = await (await request.get(`${api}/quiz/progresso`, { headers })).json() as { xpTotal: number };
  expect(aposRecarregar.xpTotal).toBe(progressoDepois.xpTotal);
});
