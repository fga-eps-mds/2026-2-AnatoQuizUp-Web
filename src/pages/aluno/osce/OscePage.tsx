// Pagina de simulacao OSCE: aluno escolhe um caso clinico, conversa em papel de
// medico com o "paciente" (Gemini, via BFF) e, ao finalizar, recebe o feedback do
// examinador contra o checklist do caso. Ver docs/arquitetura/chatbot-osce.md.
import { Fragment, useEffect, useRef, useState } from 'react';
import { ClipboardList, Loader2, Send, Stethoscope } from 'lucide-react';

import {
  enviarMensagemOsce,
  finalizarOsce,
  listarCenariosOsce,
  type CenarioOsceResumo,
  type TurnoOsce,
} from '../../../features/osce/osceService';

// Converte **trecho** em <strong>, mesmo marcador usado pelo chat de ajuda.
function renderizarTextoComNegrito(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((trecho, indice) => {
    if (trecho.startsWith('**') && trecho.endsWith('**')) {
      return <strong key={indice}>{trecho.slice(2, -2)}</strong>;
    }
    return <Fragment key={indice}>{trecho}</Fragment>;
  });
}

const CORES_DIFICULDADE: Record<CenarioOsceResumo['dificuldade'], string> = {
  Fácil: 'bg-emerald-100 text-emerald-700',
  Médio: 'bg-amber-100 text-amber-700',
  Difícil: 'bg-rose-100 text-rose-700',
};

export const OscePage = () => {
  const [cenarios, setCenarios] = useState<CenarioOsceResumo[]>([]);
  const [carregandoCenarios, setCarregandoCenarios] = useState(true);
  const [erroCenarios, setErroCenarios] = useState<string | null>(null);

  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioOsceResumo | null>(null);
  const [historico, setHistorico] = useState<TurnoOsce[]>([]);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fimDaConversaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listarCenariosOsce()
      .then(setCenarios)
      .catch((error: Error) => setErroCenarios(error.message))
      .finally(() => setCarregandoCenarios(false));
  }, []);

  useEffect(() => {
    fimDaConversaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico, feedback]);

  const iniciarCenario = (cenario: CenarioOsceResumo) => {
    setCenarioAtivo(cenario);
    setHistorico([]);
    setFeedback(null);
    setErro(null);
  };

  const encerrarSimulacao = () => {
    setCenarioAtivo(null);
    setHistorico([]);
    setFeedback(null);
    setErro(null);
  };

  const handleEnviarMensagem = async () => {
    const texto = mensagemAtual.trim();
    if (!texto || enviando || !cenarioAtivo) return;

    setEnviando(true);
    setErro(null);

    const historicoAnterior = historico;
    setHistorico((atual) => [...atual, { autor: 'aluno', texto }]);
    setMensagemAtual('');

    try {
      const resposta = await enviarMensagemOsce(cenarioAtivo.id, texto, historicoAnterior);
      setHistorico((atual) => [...atual, { autor: 'paciente', texto: resposta }]);
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const handleFinalizar = async () => {
    if (!cenarioAtivo || finalizando) return;

    setFinalizando(true);
    setErro(null);

    try {
      const resultado = await finalizarOsce(cenarioAtivo.id, historico);
      setFeedback(resultado);
    } catch (error) {
      setErro((error as Error).message);
    } finally {
      setFinalizando(false);
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

      {!cenarioAtivo && (
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
                onClick={() => iniciarCenario(cenario)}
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-4 text-left shadow-sm hover:border-[#0D9488] hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-black text-[#0A1128]">{cenario.titulo}</p>
                  <p className="text-xs font-medium text-[#64748B]">{cenario.especialidade}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${CORES_DIFICULDADE[cenario.dificuldade]}`}
                >
                  {cenario.dificuldade}
                </span>
              </button>
            ))}
        </section>
      )}

      {cenarioAtivo && (
        <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3">
            <div>
              <p className="text-sm font-black text-[#0A1128]">{cenarioAtivo.titulo}</p>
              <p className="text-xs font-medium text-[#64748B]">{cenarioAtivo.especialidade}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleFinalizar()}
                disabled={historico.length === 0 || finalizando || Boolean(feedback)}
                className="flex items-center gap-1.5 rounded-lg bg-[#0A1128] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
              >
                {finalizando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Finalizar e ver feedback
              </button>
              <button
                type="button"
                onClick={encerrarSimulacao}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Trocar caso
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {historico.length === 0 && (
              <p className="text-sm font-medium text-[#64748B]">
                Inicie a anamnese: pergunte ao paciente sobre a queixa principal.
              </p>
            )}

            <ul className="flex flex-col gap-3">
              {historico.map((turno, indice) => (
                <li
                  key={indice}
                  className={`flex flex-col gap-1.5 ${turno.autor === 'aluno' ? 'items-end' : 'items-start'}`}
                >
                  <p
                    className={
                      turno.autor === 'aluno'
                        ? 'max-w-[85%] rounded-lg bg-[#0D9488] px-3 py-2 text-sm font-medium text-white'
                        : 'max-w-[85%] whitespace-pre-wrap rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm font-medium leading-relaxed text-[#0A1128]/80'
                    }
                  >
                    {renderizarTextoComNegrito(turno.texto)}
                  </p>
                </li>
              ))}
            </ul>

            {feedback && (
              <div className="mt-5 rounded-lg border border-[#0D9488]/30 bg-[#0D9488]/5 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#0D9488]">
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                  Feedback do examinador
                </p>
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#0A1128]/80">
                  {renderizarTextoComNegrito(feedback)}
                </p>
              </div>
            )}

            {erro && (
              <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
                {erro}
              </p>
            )}

            <div ref={fimDaConversaRef} />
          </div>

          <footer className="flex items-end gap-2 border-t border-[#E2E8F0] p-4">
            <textarea
              value={mensagemAtual}
              onChange={(event) => setMensagemAtual(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleEnviarMensagem();
                }
              }}
              placeholder="Pergunte algo ao paciente..."
              rows={1}
              maxLength={500}
              disabled={enviando || Boolean(feedback)}
              className="flex-1 resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#0A1128] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleEnviarMensagem()}
              disabled={!mensagemAtual.trim() || enviando || Boolean(feedback)}
              aria-label="Enviar pergunta ao paciente"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0D9488] text-white hover:brightness-95 disabled:opacity-40"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </footer>
        </section>
      )}
    </div>
  );
};
