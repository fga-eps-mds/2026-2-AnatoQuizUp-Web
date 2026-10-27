import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { httpClient } from "../../../shared/api/httpClient";

type Missao = {
  id: string;
  nome: string;
  descricao: string;
  meta: number;
  progresso: number;
  recompensaXp: number;
  status: "EM_ANDAMENTO" | "CONCLUIDA";
};

type Dados = {
  periodo: { fim: string };
  missoes: Missao[];
  resumo: { concluidas: number; total: number; xpGanhoHoje: number; xpGanhoNoPeriodo?: number };
};

const formatarTempo = (restante: number) => {
  const horas = String(Math.floor(restante / 3600000)).padStart(2, "0");
  const minutos = String(Math.floor(restante / 60000) % 60).padStart(2, "0");

  return `${horas}h ${minutos}min`;
};

const mensagemRenovacao = (
  carregando: boolean,
  erro: boolean,
  tempo: string,
) => {
  if (carregando) return "Atualizando...";
  if (erro) return "Não foi possível atualizar";

  return `Renova em ${tempo}`;
};

const Barra = ({
  valor,
  concluida = false,
}: {
  valor: number;
  concluida?: boolean;
}) => {
  const cor = concluida
    ? "[&::-moz-progress-bar]:bg-[#139a8a] [&::-webkit-progress-value]:bg-[#139a8a]"
    : "[&::-moz-progress-bar]:bg-[#ff7415] [&::-webkit-progress-value]:bg-[#ff7415]";

  return (
    <progress
      className={`h-2.5 w-full overflow-hidden rounded-full appearance-none [&::-webkit-progress-bar]:bg-[#edf0f5] ${cor}`}
      value={valor}
      max={100}
      aria-label={`Progresso: ${valor}%`}
    >
      {valor}%
    </progress>
  );
};

const Cabecalho = ({
  carregando,
  erro,
  tempo,
  semanal,
}: {
  carregando: boolean;
  erro: boolean;
  tempo: string;
  semanal: boolean;
}) => (
  <header>
    <p className="text-[11px] font-bold text-[#ff7415]">
      PROGRESSÃO / MISSÕES {semanal ? "SEMANAIS" : "DIÁRIAS"}
    </p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[32px] font-extrabold">Missões {semanal ? "semanais" : "diárias"}</h1>
      <span className="rounded-full bg-white px-6 py-2 text-xs font-bold text-[#667085]">
        {mensagemRenovacao(carregando, erro, tempo)}
      </span>
    </div>
    <p className="mt-2 text-sm text-[#667085]">
      Pequenos desafios para manter o ritmo de estudo e conquistar XP.
    </p>
    <nav aria-label="Periodicidade das missões" className="mt-4 flex gap-3 text-sm font-bold">
      <Link to="/aluno/missoes" aria-current={!semanal ? "page" : undefined} className="rounded-lg bg-white px-4 py-2">Diárias</Link>
      <Link to="/aluno/missoes/semanais" aria-current={semanal ? "page" : undefined} className="rounded-lg bg-white px-4 py-2">Semanais</Link>
    </nav>
  </header>
);

const CarregandoMissoes = () => (
  <div aria-live="polite" className="space-y-7">
    <div className="h-40 animate-pulse rounded-[18px] border border-[#e3e8ef] bg-white p-8">
      <div className="h-6 w-1/3 rounded bg-[#e6eaf0]" />
      <div className="mt-5 h-3 w-2/3 rounded bg-[#e6eaf0]" />
    </div>
    <p className="sr-only">Carregando suas missões</p>
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((indice) => (
        <div
          key={indice}
          className="h-[268px] animate-pulse rounded-2xl border border-[#e3e8ef] bg-white"
        />
      ))}
    </div>
  </div>
);

const EstadoErro = ({
  aoTentarNovamente,
}: {
  aoTentarNovamente: () => void;
}) => (
  <section
    role="alert"
    className="flex min-h-[500px] flex-col items-center justify-center rounded-[18px] border border-red-200 bg-white p-8 text-center"
  >
    <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-500">
      !
    </span>
    <h2 className="text-2xl font-bold">
      Não conseguimos carregar suas missões
    </h2>
    <p className="mt-3 text-sm text-[#667085]">
      Verifique sua conexão e tente novamente.
    </p>
    <div className="mt-6 flex gap-3">
      <button
        onClick={aoTentarNovamente}
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
);

const SemMissoes = ({ tempo }: { tempo: string }) => (
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
);

const CartaoMissao = ({ missao }: { missao: Missao }) => {
  const concluida = missao.status === "CONCLUIDA";
  const progresso = Math.min(
    100,
    Math.round((missao.progresso / missao.meta) * 100),
  );
  const corStatus = concluida
    ? "bg-[#e6f8f5] text-[#139a8a]"
    : "bg-[#eaf3ff] text-[#3976d4]";
  const corIcone = concluida
    ? "bg-[#e6f8f5] text-[#139a8a]"
    : "bg-[#fff1e8] text-[#ff7415]";

  return (
    <article className="min-h-[268px] rounded-2xl border border-[#e3e8ef] bg-white p-[22px] shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-4 py-2 text-[10px] font-bold ${corStatus}`}
        >
          {concluida ? "CONCLUÍDA" : "EM ANDAMENTO"}
        </span>
        <strong className="text-xs text-[#ff7415]">
          +{missao.recompensaXp} XP
        </strong>
      </div>
      <div className="my-5 flex gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${corIcone}`}
        >
          {concluida ? "✓" : "★"}
        </span>
        <div>
          <h3 className="font-bold">{missao.nome}</h3>
          <p className="mt-1 text-xs text-[#667085]">{missao.descricao}</p>
        </div>
      </div>
      <div className="mb-2 flex justify-between text-xs font-semibold text-[#667085]">
        <span>
          {missao.progresso} de {missao.meta}
        </span>
        <span>{progresso}%</span>
      </div>
      <Barra valor={progresso} concluida={concluida} />
    </article>
  );
};

const ConteudoMissoes = ({ dados, semanal }: { dados: Dados; semanal: boolean }) => {
  const { concluidas, total, xpGanhoHoje, xpGanhoNoPeriodo } = dados.resumo;
  const percentual = total ? Math.round((concluidas / total) * 100) : 0;
  const todasConcluidas = Boolean(total) && concluidas === total;
  const corDestaque = todasConcluidas
    ? "bg-[#e6f8f5] text-[#139a8a]"
    : "bg-[#fff1e8] text-[#ff7415]";
  const titulo = todasConcluidas
    ? `Você completou as missões ${semanal ? "da semana" : "de hoje"}!`
    : `Seu progresso ${semanal ? "da semana" : "de hoje"}`;
  const descricao = todasConcluidas
    ? `Recompensas liberadas. Volte ${semanal ? "na próxima semana" : "amanhã"} para novas missões.`
    : "Conclua atividades para ganhar XP e avançar no ranking.";
  const tituloLista = todasConcluidas
    ? "Resumo das missões"
    : `Suas missões ${semanal ? "da semana" : "de hoje"}`;

  return (
    <>
      <section className="flex flex-wrap items-center gap-7 rounded-[18px] border border-[#e3e8ef] bg-white p-7 shadow-sm">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${corDestaque}`}
        >
          {todasConcluidas ? "✓" : "★"}
        </span>
        <div className="min-w-48 flex-1">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <p className="mt-2 text-sm text-[#667085]">{descricao}</p>
          <div className="my-2 flex justify-between text-xs font-semibold text-[#667085]">
            <span>
              {concluidas} de {total} missões concluídas
            </span>
            <span>{percentual}%</span>
          </div>
          <Barra valor={percentual} concluida={todasConcluidas} />
        </div>
        <div className="rounded-xl bg-[#fff8ed] px-8 py-5 text-center">
          <strong className="block text-2xl text-[#ff7415]">
            {semanal ? (xpGanhoNoPeriodo ?? 0) : xpGanhoHoje} XP
          </strong>
          <span className="text-xs text-[#667085]">ganhos {semanal ? "nesta semana" : "hoje"}</span>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">{tituloLista}</h2>
        <p className="mt-1 text-xs text-[#667085]">
          O progresso é atualizado automaticamente.
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {dados.missoes.map((missao) => (
            <CartaoMissao key={missao.id} missao={missao} />
          ))}
        </div>
      </section>
      <aside className="rounded-[14px] bg-[#eaf3ff] p-5 text-sm">
        <strong>Como funcionam as missões?</strong>
        <p className="mt-1 text-xs text-[#667085]">
          Elas renovam {semanal ? "toda segunda-feira à meia-noite de Brasília" : "diariamente"}. Ao concluir uma meta, o XP é creditado
          automaticamente.
        </p>
      </aside>
    </>
  );
};

export function MissoesPage({ periodicidade = "diarias" }: { periodicidade?: "diarias" | "semanais" }) {
  const semanal = periodicidade === "semanais";
  const endpoint = semanal ? "/missoes/minhas/semanais" : "/missoes/minhas";
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [agora, setAgora] = useState(0);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);

    try {
      setDados((await httpClient.get<Dados>(endpoint)).data);
      setAgora(Date.now());
    } catch {
      setErro(true);
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, [endpoint]);

  useEffect(() => {
    let ativa = true;

    httpClient
      .get<Dados>(endpoint)
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
  }, [endpoint]);

  useEffect(() => {
    let renovando = false;
    const id = window.setInterval(() => {
      const instante = Date.now();
      setAgora(instante);

      if (
        !renovando &&
        dados &&
        instante >= new Date(dados.periodo.fim).getTime()
      ) {
        renovando = true;
        void carregar();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [dados, carregar]);

  const restante = dados
    ? Math.max(0, new Date(dados.periodo.fim).getTime() - agora)
    : 0;
  const tempo = formatarTempo(restante);

  let conteudo;
  if (carregando) {
    conteudo = <CarregandoMissoes />;
  } else if (erro || !dados) {
    conteudo = <EstadoErro aoTentarNovamente={() => void carregar()} />;
  } else if (dados.missoes.length === 0) {
    conteudo = <SemMissoes tempo={tempo} />;
  } else {
    conteudo = <ConteudoMissoes dados={dados} semanal={semanal} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-5 py-10 text-[#1e293b] md:px-12">
      <div className="mx-auto max-w-[1096px] space-y-7">
        <Cabecalho carregando={carregando} erro={erro} tempo={tempo} semanal={semanal} />
        {conteudo}
      </div>
    </div>
  );
}
