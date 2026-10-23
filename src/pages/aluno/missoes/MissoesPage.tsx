import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpClient } from '../../../shared/api/httpClient';

type Missao = {
  id: string;
  nome: string;
  descricao: string;
  meta: number;
  progresso: number;
  recompensaXp: number;
  status: 'EM_ANDAMENTO' | 'CONCLUIDA';
};
type Dados = {
  periodo: { fim: string };
  missoes: Missao[];
  resumo: { concluidas: number; total: number; xpGanhoHoje: number };
};

const Barra = ({ valor, concluida = false }: { valor: number; concluida?: boolean }) => (
  <div
    className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf0f5]"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={valor}
  >
    <div
      className={`h-full rounded-full ${concluida ? 'bg-[#139a8a]' : 'bg-[#ff7415]'}`}
      style={{ width: `${valor}%` }}
    />
  </div>
);

export function MissoesPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agora, setAgora] = useState(0);
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      setDados((await httpClient.get<Dados>('/missoes/minhas')).data);
      setAgora(Date.now());
    } catch {
      setErro(true);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    let ativa = true;
    httpClient
      .get<Dados>('/missoes/minhas')
      .then(({ data }) => {
        if (ativa) {
          setDados(data);
          setAgora(Date.now());
        }
      })
      .catch(() => {
        if (ativa) setErro(true);
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });
    return () => {
      ativa = false;
    };
  }, []);
  useEffect(() => {
    let renovando = false;
    const id = window.setInterval(() => {
      const instante = Date.now();
      setAgora(instante);
      if (!renovando && dados && instante >= new Date(dados.periodo.fim).getTime()) {
        renovando = true;
        void carregar();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [dados, carregar]);
  const restante = dados ? Math.max(0, new Date(dados.periodo.fim).getTime() - agora) : 0;
  const tempo = `${String(Math.floor(restante / 3600000)).padStart(2, '0')}h ${String(Math.floor(restante / 60000) % 60).padStart(2, '0')}min`;
  const percentual = dados?.resumo.total
    ? Math.round((dados.resumo.concluidas / dados.resumo.total) * 100)
    : 0;
  const todas = !!dados?.resumo.total && dados.resumo.concluidas === dados.resumo.total;
  return (
    <div className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-[#1e293b] md:px-12">
      <div className="mx-auto max-w-[1096px] space-y-7">
        <header>
          <p className="text-[11px] font-bold text-[#ff7415]">PROGRESSÃO / MISSÕES DIÁRIAS</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[32px] font-extrabold">Missões diárias</h1>
            <span className="rounded-full bg-white px-6 py-2 text-xs font-bold text-[#667085]">
              {carregando
                ? 'Atualizando...'
                : erro
                  ? 'Não foi possível atualizar'
                  : `Renova em ${tempo}`}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            Pequenos desafios para manter o ritmo de estudo e conquistar XP.
          </p>
        </header>
        {carregando ? (
          <div aria-live="polite" className="space-y-7">
            <div className="h-40 animate-pulse rounded-[18px] border border-[#e3e8ef] bg-white p-8">
              <div className="h-6 w-1/3 rounded bg-[#e6eaf0]" />
              <div className="mt-5 h-3 w-2/3 rounded bg-[#e6eaf0]" />
            </div>
            <p className="sr-only">Carregando suas missões</p>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[268px] animate-pulse rounded-2xl border border-[#e3e8ef] bg-white"
                />
              ))}
            </div>
          </div>
        ) : erro || !dados ? (
          <section
            role="alert"
            className="flex min-h-[500px] flex-col items-center justify-center rounded-[18px] border border-red-200 bg-white p-8 text-center"
          >
            <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-500">
              !
            </span>
            <h2 className="text-2xl font-bold">Não conseguimos carregar suas missões</h2>
            <p className="mt-3 text-sm text-[#667085]">Verifique sua conexão e tente novamente.</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => void carregar()}
                className="rounded-lg bg-[#ff7415] px-6 py-3 text-sm font-bold text-white"
              >
                Tentar novamente
              </button>
              <Link
                to="/aluno/home"
                className="rounded-lg border border-[#e3e8ef] px-6 py-3 text-sm font-bold"
              >
                Voltar ao início
              </Link>
            </div>
          </section>
        ) : dados.missoes.length === 0 ? (
          <section className="flex min-h-[500px] flex-col items-center justify-center rounded-[18px] border border-[#e3e8ef] bg-white p-8 text-center">
            <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-500">
              ✦
            </span>
            <h2 className="text-2xl font-bold">Nenhuma missão disponível agora</h2>
            <p className="mt-3 text-sm text-[#667085]">
              Volte na próxima renovação para receber novos desafios.
            </p>
            <p className="mt-4 rounded-full bg-[#eaf3ff] px-5 py-2 text-xs font-bold text-[#3976d4]">
              Próxima renovação: {tempo}
            </p>
            <Link
              to="/aluno/home"
              className="mt-4 rounded-lg border border-[#e3e8ef] px-6 py-3 text-sm font-bold"
            >
              Voltar ao início
            </Link>
          </section>
        ) : (
          <>
            <section className="flex flex-wrap items-center gap-7 rounded-[18px] border border-[#e3e8ef] bg-white p-7 shadow-sm">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${todas ? 'bg-[#e6f8f5] text-[#139a8a]' : 'bg-[#fff1e8] text-[#ff7415]'}`}
              >
                {todas ? '✓' : '★'}
              </span>
              <div className="min-w-48 flex-1">
                <h2 className="text-xl font-bold">
                  {todas ? 'Você completou as missões de hoje!' : 'Seu progresso de hoje'}
                </h2>
                <p className="mt-2 text-sm text-[#667085]">
                  {todas
                    ? 'Recompensas liberadas. Volte amanhã para novas missões.'
                    : 'Conclua atividades para ganhar XP e avançar no ranking.'}
                </p>
                <div className="my-2 flex justify-between text-xs font-semibold text-[#667085]">
                  <span>
                    {dados.resumo.concluidas} de {dados.resumo.total} missões concluídas
                  </span>
                  <span>{percentual}%</span>
                </div>
                <Barra valor={percentual} concluida={todas} />
              </div>
              <div className="rounded-xl bg-[#fff8ed] px-8 py-5 text-center">
                <strong className="block text-2xl text-[#ff7415]">
                  {dados.resumo.xpGanhoHoje} XP
                </strong>
                <span className="text-xs text-[#667085]">ganhos hoje</span>
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold">
                {todas ? 'Resumo das missões' : 'Suas missões de hoje'}
              </h2>
              <p className="mt-1 text-xs text-[#667085]">
                O progresso é atualizado automaticamente.
              </p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {dados.missoes.map((m) => {
                  const completa = m.status === 'CONCLUIDA';
                  const progresso = Math.min(100, Math.round((m.progresso / m.meta) * 100));
                  return (
                    <article
                      key={m.id}
                      className="min-h-[268px] rounded-2xl border border-[#e3e8ef] bg-white p-[22px] shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-4 py-2 text-[10px] font-bold ${completa ? 'bg-[#e6f8f5] text-[#139a8a]' : 'bg-[#eaf3ff] text-[#3976d4]'}`}
                        >
                          {completa ? 'CONCLUÍDA' : 'EM ANDAMENTO'}
                        </span>
                        <strong className="text-xs text-[#ff7415]">+{m.recompensaXp} XP</strong>
                      </div>
                      <div className="my-5 flex gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${completa ? 'bg-[#e6f8f5] text-[#139a8a]' : 'bg-[#fff1e8] text-[#ff7415]'}`}
                        >
                          {completa ? '✓' : '★'}
                        </span>
                        <div>
                          <h3 className="font-bold">{m.nome}</h3>
                          <p className="mt-1 text-xs text-[#667085]">{m.descricao}</p>
                        </div>
                      </div>
                      <div className="mb-2 flex justify-between text-xs font-semibold text-[#667085]">
                        <span>
                          {m.progresso} de {m.meta}
                        </span>
                        <span>{progresso}%</span>
                      </div>
                      <Barra valor={progresso} concluida={completa} />
                    </article>
                  );
                })}
              </div>
            </section>
            <aside className="rounded-[14px] bg-[#eaf3ff] p-5 text-sm">
              <strong>Como funcionam as missões?</strong>
              <p className="mt-1 text-xs text-[#667085]">
                Elas renovam diariamente. Ao concluir uma meta, o XP é creditado automaticamente.
              </p>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
