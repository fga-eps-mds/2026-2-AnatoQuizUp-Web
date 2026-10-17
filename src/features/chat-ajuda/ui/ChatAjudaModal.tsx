// Modal de ajuda: mostra a dica de estudo baseada no desempenho do proprio aluno
// (regra, sem LLM) e permite perguntas livres respondidas pela Gemini API - ver
// docs/arquitetura/chatbot-ajuda-ia.md.
import { Fragment, useEffect, useState } from 'react';
import { Loader2, MessageCircleQuestion, SendHorizontal, X } from 'lucide-react';

import { buscarDicaAjuda, enviarPerguntaAjuda, type ContextoQuestaoAjuda } from '../chatAjudaService';

type TrocaChat = {
  pergunta: string;
  resposta: string;
};

// Converte **trecho** em <strong>, unico marcador markdown que a Gemini usa nas
// respostas; o resto do texto segue plano.
function renderizarTextoComNegrito(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((trecho, indice) => {
    if (trecho.startsWith('**') && trecho.endsWith('**')) {
      return <strong key={indice}>{trecho.slice(2, -2)}</strong>;
    }
    return <Fragment key={indice}>{trecho}</Fragment>;
  });
}

type ChatAjudaModalProps = {
  onClose: () => void;
  // Contexto da questao em andamento (quando o modal e aberto durante um quiz),
  // repassado nas perguntas livres para a Gemini responder sem revelar a resposta certa.
  questaoAtual?: ContextoQuestaoAjuda;
};

export const ChatAjudaModal = ({ onClose, questaoAtual }: ChatAjudaModalProps) => {
  const [dica, setDica] = useState<string | null>(null);
  const [carregandoDica, setCarregandoDica] = useState(true);
  const [erroDica, setErroDica] = useState<string | null>(null);

  const [perguntaAtual, setPerguntaAtual] = useState('');
  const [historico, setHistorico] = useState<TrocaChat[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroPergunta, setErroPergunta] = useState<string | null>(null);

  // Bloqueia o scroll do body enquanto aberto e fecha o modal ao pressionar Escape.
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [onClose]);

  useEffect(() => {
    buscarDicaAjuda()
      .then(setDica)
      .catch((error: Error) => setErroDica(error.message))
      .finally(() => setCarregandoDica(false));
  }, []);

  const handleEnviarPergunta = async () => {
    const pergunta = perguntaAtual.trim();
    if (!pergunta || enviando) return;

    setEnviando(true);
    setErroPergunta(null);

    try {
      const resposta = await enviarPerguntaAjuda(pergunta, questaoAtual);
      setHistorico((atual) => [...atual, { pergunta, resposta }]);
      setPerguntaAtual('');
    } catch (error) {
      setErroPergunta((error as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-ajuda-title"
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-[#0D9488]" aria-hidden="true" />
            <h2 id="chat-ajuda-title" className="text-base font-black text-[#0A1128]">
              Ajuda
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0A1128]"
            aria-label="Fechar ajuda"
          >
            <X size={19} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {carregandoDica && (
            <p className="flex items-center gap-2 text-sm font-medium text-[#64748B]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Buscando sua dica...
            </p>
          )}

          {!carregandoDica && erroDica && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {erroDica}
            </p>
          )}

          {!carregandoDica && !erroDica && dica && (
            <p className="whitespace-pre-wrap rounded-lg bg-[#F8FAFC] p-3 text-sm font-medium leading-relaxed text-[#0A1128]/80">
              {renderizarTextoComNegrito(dica)}
            </p>
          )}

          {historico.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {historico.map((troca, indice) => (
                <li key={indice} className="flex flex-col gap-1.5">
                  <p className="self-end rounded-lg bg-[#0D9488] px-3 py-2 text-sm font-medium text-white">
                    {troca.pergunta}
                  </p>
                  <p className="whitespace-pre-wrap rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm font-medium leading-relaxed text-[#0A1128]/80">
                    {renderizarTextoComNegrito(troca.resposta)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {erroPergunta && (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
              {erroPergunta}
            </p>
          )}
        </div>

        <footer className="flex items-end gap-2 border-t border-[#E2E8F0] p-4">
          <textarea
            value={perguntaAtual}
            onChange={(event) => setPerguntaAtual(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleEnviarPergunta();
              }
            }}
            placeholder="Pergunte algo sobre o conteudo..."
            rows={1}
            maxLength={500}
            disabled={enviando}
            className="flex-1 resize-none rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-medium text-[#0A1128] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleEnviarPergunta}
            disabled={!perguntaAtual.trim() || enviando}
            aria-label="Enviar pergunta"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0D9488] text-white hover:brightness-95 disabled:opacity-40"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </footer>
      </section>
    </div>
  );
};
