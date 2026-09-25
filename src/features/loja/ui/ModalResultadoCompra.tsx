// Modal com o resultado de uma tentativa de compra: "Compra concluida" ou
// "Saldo insuficiente" (explicando quanto falta). Em saldo insuficiente nada foi
// cobrado nem adicionado ao inventario.
import { useEffect, useId } from 'react';
import { CircleCheck, CircleX, Coins } from 'lucide-react';

import type { ItemLoja } from '../types';

export type ResultadoCompra =
  | { tipo: 'sucesso'; item: ItemLoja; quantidade: number; saldoMoedas: number }
  | { tipo: 'saldo-insuficiente'; item: ItemLoja; quantidade: number; saldoMoedas: number };

type ModalResultadoCompraProps = {
  resultado: ResultadoCompra;
  onFechar: () => void;
};

export const ModalResultadoCompra = ({ resultado, onFechar }: ModalResultadoCompraProps) => {
  const tituloId = useId();
  const { item, quantidade, saldoMoedas } = resultado;
  const sucesso = resultado.tipo === 'sucesso';
  const total = item.precoMoedas * quantidade;
  const faltam = Math.max(0, total - saldoMoedas);
  const nomeComQuantidade = quantidade > 1 ? `${quantidade}x ${item.nome}` : item.nome;

  // Esc fecha o modal.
  useEffect(() => {
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar();
    };

    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-md flex-col items-center rounded-3xl bg-[#FFFBF0] p-6 text-center shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-[#0A1128]/10 bg-white px-3 py-1 text-sm font-black tabular-nums text-[#0A1128]">
          <Coins size={15} className="text-[#F59E0B]" aria-hidden="true" />
          <span aria-label={`Seu saldo: ${saldoMoedas} ATP`}>{saldoMoedas}</span>
        </span>

        <h2 id={tituloId} className="mt-8 text-xl font-black uppercase text-[#0A1128]">
          {sucesso ? 'Compra concluída' : 'Saldo insuficiente'}
        </h2>

        {sucesso ? (
          <CircleCheck size={112} strokeWidth={2.25} className="my-6 text-green-600" aria-hidden="true" />
        ) : (
          <CircleX size={112} strokeWidth={2.25} className="my-6 text-red-600" aria-hidden="true" />
        )}

        {sucesso ? (
          <p className="text-sm font-bold text-[#0A1128]/70">
            <span className="text-[#0A1128]">{nomeComQuantidade}</span> foi adicionado ao seu
            inventário.
          </p>
        ) : (
          <p className="text-sm font-bold text-[#0A1128]/70">
            {nomeComQuantidade} custa <span className="text-[#0A1128]">{total} ATP</span> e você tem{' '}
            <span className="text-[#0A1128]">{saldoMoedas} ATP</span>. Faltam{' '}
            <span className="text-rose-600">{faltam} ATP</span>. Nada foi cobrado. Responda quizzes
            para ganhar mais moedas!
          </p>
        )}

        <button
          type="button"
          onClick={onFechar}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#0A1128] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#16213f]"
        >
          {sucesso ? 'Continuar comprando' : 'Entendi'}
        </button>
      </div>
    </div>
  );
};
