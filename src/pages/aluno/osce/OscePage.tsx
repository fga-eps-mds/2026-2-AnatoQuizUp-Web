// Pagina de simulacao OSCE: aluno escolhe um caso clinico, le o cenario, conversa em
// papel de medico com o "paciente" (Gemini, via BFF -> ChatbotOSCE) e, ao encerrar,
// recebe o feedback pontuado do examinador. Ver docs/arquitetura/chatbot-osce.md.
import { useEffect, useRef, useState } from 'react';
import { ClipboardList, Loader2, Send, Stethoscope } from 'lucide-react';

import { detectarDespedida } from '../../../features/osce/detectarDespedida';
import {
  enviarMensagemOsce,
  finalizarOsce,
  listarCenariosOsce,
  type AvaliacaoOsce,
  type CenarioOsceResumo,
  type TurnoOsce,
} from '../../../features/osce/osceService';
import { CenarioApresentacao } from './CenarioApresentacao';
import { FeedbackResultado } from './FeedbackResultado';
import { ModalConfirmarEncerramento } from './ModalConfirmarEncerramento';
import { TurnoChatOsce } from './TurnoChatOsce';

// Etapas da tela: escolher o caso, ler o cenario e conversar com o paciente.
type EtapaOsce = 'lista' | 'cenario' | 'chat';

// Turno como a tela guarda: o id existe so para a chave da lista e nao vai para o
// BFF, que recebe apenas autor, texto e, nos cards de exame, o nome do exame.
type TurnoExibido = TurnoOsce & { id: string };

const novoTurno = (turno: TurnoOsce): TurnoExibido => ({
  ...turno,
  id: `${turno.autor}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const paraEnvio = ({ autor, texto, exame }: TurnoExibido): TurnoOsce =>
  exame ? { autor, texto, exame } : { autor, texto };

const CORES_DIFICULDADE: Record<CenarioOsceResumo['dificuldade'], string> = {
  Fácil: 'bg-emerald-100 text-emerald-700',
  Médio: 'bg-amber-100 text-amber-700',
  Difícil: 'bg-rose-100 text-rose-700',
};

export const OscePage = () => {
  const [cenarios, setCenarios] = useState<CenarioOsceResumo[]>([]);
  const [carregandoCenarios, setCarregandoCenarios] = useState(true);
  const [erroCenarios, setErroCenarios] = useState<string | null>(null);

  const [etapa, setEtapa] = useState<EtapaOsce>('lista');
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioOsceResumo | null>(null);
  const [historico, setHistorico] = useState<TurnoExibido[]>([]);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoOsce | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoEncerramento, setConfirmandoEncerramento] = useState(false);
  // true depois da primeira despedida: uma nova despedida abre a confirmacao direto,
  // sem mandar a fala a IA (anti-loop de "tchau" que nao depende so do prompt).
  const [jaSeDespediu, setJaSeDespediu] = useState(false);

  const fimDaConversaRef = useRef<HTMLDivElement | null>(null);
  const campoMensagemRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    listarCenariosOsce()
      .then(setCenarios)
      .catch((error: Error) => setErroCenarios(error.message))
      .finally(() => setCarregandoCenarios(false));
  }, []);

  useEffect(() => {
    fimDaConversaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico, avaliacao]);

  const limparConversa = () => {
    setHistorico([]);
    setMensagemAtual('');
    setAvaliacao(null);
    setErro(null);
    setConfirmandoEncerramento(false);
    setJaSeDespediu(false);
  };

  const escolherCenario = (cenario: CenarioOsceResumo) => {
    setCenarioAtivo(cenario);
    limparConversa();
    setEtapa('cenario');
  };

  const voltarParaLista = () => {
    setCenarioAtivo(null);
    limparConversa();
    setEtapa('lista');
  };

  const handleEnviarMensagem = async () => {
    const texto = mensagemAtual.trim();
    if (!texto || enviando || !cenarioAtivo) return;

    const despedida = detectarDespedida(texto);

    // Segunda despedida: o paciente ja se despediu uma vez, entao so confirma.
    if (despedida && jaSeDespediu) {
      setMensagemAtual('');
      setConfirmandoEncerramento(true);
      return;
    }

    setEnviando(true);
    setErro(null);

    const historicoAnterior = historico;
    setHistorico((atual) => [...atual, novoTurno({ autor: 'aluno', texto })]);
    setMensagemAtual('');

    try {
      // A resposta pode trazer a fala do paciente e os cards dos exames pedidos (US25).
      const turnosResposta = await enviarMensagemOsce(
        cenarioAtivo.id,
        texto,
        historicoAnterior.map(paraEnvio),
      );
      setHistorico((atual) => [...atual, ...turnosResposta.map(novoTurno)]);
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setEnviando(false);
      // O paciente responde uma vez a despedida e entao vem a confirmacao —
      // inclusive se o envio falhou, para o aluno nao ficar preso no chat.
      if (despedida) {
        setJaSeDespediu(true);
        setConfirmandoEncerramento(true);
      }
    }
  };

  const continuarAtendimento = () => {
    setConfirmandoEncerramento(false);
    campoMensagemRef.current?.focus();
  };

  const handleFinalizar = async () => {
    if (!cenarioAtivo || finalizando) return;

    setFinalizando(true);
    setErro(null);

    try {
      const resultado = await finalizarOsce(cenarioAtivo.id, historico.map(paraEnvio));
      setAvaliacao(resultado);
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setFinalizando(false);
      // Sucesso mostra a avaliacao; falha mostra o erro no chat. Nos dois casos o
      // modal sai da frente.
      setConfirmandoEncerramento(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Stethoscope className="h-7 w-7 text-[#0D9488]" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-black text-[#0A1128]">Simulação OSCE</h1>
          <p className="text-sm font-medium text-[#64748B]">
            Pratique anamnese clínica conversando com um paciente simulado por IA.
          </p>
        </div>
      </header>

      {etapa === 'lista' && (
        <section className="flex flex-col gap-3">
          {carregandoCenarios && (
            <p className="flex items-center gap-2 text-sm font-medium text-[#64748B]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Carregando casos clínicos...
            </p>
          )}

          {!carregandoCenarios && erroCenarios && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {erroCenarios}
            </p>
          )}

          {!carregandoCenarios &&
            cenarios.map((cenario) => (
              <button
                key={cenario.id}
                type="button"
                onClick={() => escolherCenario(cenario)}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 text-left shadow-sm hover:border-[#0D9488] hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-black text-[#0A1128]">{cenario.titulo}</p>
                  <p className="text-xs font-medium text-[#64748B]">{cenario.especialidade}</p>
                  {cenario.contextoInicial && (
                    <p className="mt-1 text-xs font-medium text-[#64748B]">
                      {cenario.contextoInicial.local} · {cenario.contextoInicial.papelEstudante}
                      <br />
                      Paciente: {cenario.contextoInicial.idade} anos,{' '}
                      {cenario.contextoInicial.sexo} — queixa inicial:{' '}
                      {cenario.contextoInicial.queixa}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${CORES_DIFICULDADE[cenario.dificuldade]}`}
                >
                  {cenario.dificuldade}
                </span>
              </button>
            ))}
        </section>
      )}

      {etapa === 'cenario' && cenarioAtivo && (
        <CenarioApresentacao
          cenario={cenarioAtivo}
          onIniciar={() => setEtapa('chat')}
          onVoltar={voltarParaLista}
        />
      )}

      {etapa === 'chat' && cenarioAtivo && (
        <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3">
            <div>
              <p className="text-sm font-black text-[#0A1128]">{cenarioAtivo.titulo}</p>
              <p className="text-xs font-medium text-[#64748B]">{cenarioAtivo.especialidade}</p>
            </div>
            <button
              type="button"
              onClick={voltarParaLista}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Trocar caso
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <ul className="flex flex-col gap-3">
              {historico.map((turno) => (
                <TurnoChatOsce key={turno.id} turno={turno} />
              ))}
            </ul>

            {avaliacao && <FeedbackResultado avaliacao={avaliacao} />}

            {erro && (
              <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
                {erro}
              </p>
            )}

            <div ref={fimDaConversaRef} />
          </div>

          <footer className="sticky bottom-0 flex flex-col gap-2 rounded-b-lg border-t border-[#E2E8F0] bg-white p-4">
            {/* Atalho fixo acima do campo: visivel durante toda a conversa. */}
            <button
              type="button"
              onClick={() => void handleFinalizar()}
              disabled={historico.length === 0 || enviando || finalizando || Boolean(avaliacao)}
              className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-[#0A1128] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
            >
              {finalizando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Encerrar e receber feedback
            </button>
            <div className="flex items-end gap-2">
              <textarea
                ref={campoMensagemRef}
                value={mensagemAtual}
                onChange={(event) => setMensagemAtual(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleEnviarMensagem();
                  }
                }}
                placeholder="Pergunte algo ao paciente ou solicite um exame..."
                rows={1}
                maxLength={500}
                disabled={enviando || Boolean(avaliacao)}
                className="flex-1 resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#0A1128] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void handleEnviarMensagem()}
                disabled={!mensagemAtual.trim() || enviando || Boolean(avaliacao)}
                aria-label="Enviar pergunta ao paciente"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0D9488] text-white hover:brightness-95 disabled:opacity-40"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </footer>
        </section>
      )}

      {confirmandoEncerramento && (
        <ModalConfirmarEncerramento
          finalizando={finalizando}
          onContinuar={continuarAtendimento}
          onEncerrar={() => void handleFinalizar()}
        />
      )}
    </div>
  );
};
