// Modal de confirmacao de compra da loja ("Voce esta comprando:"). Nenhuma compra
// e enviada sem passar por aqui. Para itens consumiveis mostra o seletor de
// quantidade e o total; para cosmeticos, uma unidade. Tambem serve de
// pre-visualizacao de cosmeticos ja adquiridos (sem botao de compra).
import { useEffect, useId, useState } from 'react';
import { Check, Coins, Lock, Minus, Plus } from 'lucide-react';

import { CosmeticPreview } from '../../../shared/ui/cosmetics';
import type { ItemLoja } from '../types';

// Limite de unidades por compra (o mesmo validado pelo backend).
export const QUANTIDADE_MAXIMA_POR_COMPRA = 99;

type ModalConfirmarCompraProps = {
  item: ItemLoja;
  saldoMoedas: number;
  comprando: boolean;
  onCancelar: () => void;
  onConfirmar: (quantidade: number) => void;
};

/**
 * Maior quantidade que o aluno pode escolher: limitada pelo saldo e pelo teto
 * por compra, mas nunca menor que 1 (o seletor sempre comeca em 1).
 */
const calcularQuantidadeMaxima = (precoMoedas: number, saldoMoedas: number) => {
  if (precoMoedas <= 0) return QUANTIDADE_MAXIMA_POR_COMPRA;

  return Math.max(1, Math.min(QUANTIDADE_MAXIMA_POR_COMPRA, Math.floor(saldoMoedas / precoMoedas)));
};

export const ModalConfirmarCompra = ({
  item,
  saldoMoedas,
  comprando,
  onCancelar,
  onConfirmar,
}: ModalConfirmarCompraProps) => {
  const tituloId = useId();
  const [quantidade, setQuantidade] = useState(1);

  const consumivel = Boolean(item.consumivel);
  const somentePreview = item.adquirido && !consumivel;
  const quantidadeMaxima = calcularQuantidadeMaxima(item.precoMoedas, saldoMoedas);
  const total = item.precoMoedas * quantidade;
  const saldoInsuficiente = total > saldoMoedas;
  const saldoAposCompra = saldoMoedas - total;

  // Esc fecha o modal (exceto durante a compra, para nao perder o retorno).
  useEffect(() => {
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !comprando) onCancelar();
    };

    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [comprando, onCancelar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // Clique no fundo escurecido (fora da caixa) fecha o modal.
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !comprando) onCancelar();
      }}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#FFFBF0] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-[#0A1128]/10 bg-white px-3 py-1 text-sm font-black tabular-nums text-[#0A1128]">
          <Coins size={15} className="text-[#F59E0B]" aria-hidden="true" />
          <span aria-label={`Seu saldo: ${saldoMoedas} ATP`}>{saldoMoedas}</span>
        </span>

        <h2 id={tituloId} className="mt-8 text-center text-xl font-black text-[#0A1128]">
          {somentePreview ? 'Pré-visualização' : 'Você está comprando:'}
        </h2>

        <div className="mx-auto mt-5 flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-[#0A1128]/10 bg-white px-5 py-5 text-center shadow-sm">
          <CosmeticPreview item={item} grande={!consumivel} />

          {consumivel && !somentePreview && (
            <div className="flex items-center gap-5" aria-label="Quantidade">
              <button
                type="button"
                onClick={() => setQuantidade((atual) => Math.max(1, atual - 1))}
                disabled={quantidade <= 1 || comprando}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#0A1128] text-[#0A1128] transition-colors hover:bg-[#0A1128]/5 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Diminuir quantidade"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-3xl font-black tabular-nums text-[#0A1128]" aria-live="polite">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={() => setQuantidade((atual) => Math.min(quantidadeMaxima, atual + 1))}
                disabled={quantidade >= quantidadeMaxima || comprando}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#0A1128] text-[#0A1128] transition-colors hover:bg-[#0A1128]/5 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Aumentar quantidade"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <p className="text-base font-black text-[#0A1128]">{item.nome}</p>

          {(item.efeito ?? item.descricao) && (
            <p className="text-sm font-medium text-[#0A1128]/60">{item.efeito ?? item.descricao}</p>
          )}

          {consumivel && (item.quantidadePossuida ?? 0) > 0 && (
            <p className="text-xs font-bold text-[#0A1128]/45">
              Você já tem {item.quantidadePossuida} {item.quantidadePossuida === 1 ? 'unidade' : 'unidades'}
            </p>
          )}
        </div>

        {somentePreview ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
              <Check size={18} />
              Você já possui este item
            </span>
            <button
              type="button"
              onClick={onCancelar}
              className="cursor-pointer text-sm font-bold text-[#0A1128]/60 hover:text-[#0A1128]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <dl className="mx-auto mt-4 max-w-xs space-y-1 text-sm">
              <div className="flex justify-between font-bold text-[#0A1128]/60">
                <dt>Preço unitário</dt>
                <dd className="tabular-nums">{item.precoMoedas} ATP</dd>
              </div>
              <div className="flex justify-between text-base font-black text-[#0A1128]">
                <dt>Total</dt>
                <dd className="tabular-nums">{total} ATP</dd>
              </div>
              {!saldoInsuficiente && (
                <div className="flex justify-between font-bold text-[#0A1128]/60">
                  <dt>Saldo após a compra</dt>
                  <dd className="tabular-nums">{saldoAposCompra} ATP</dd>
                </div>
              )}
            </dl>

            {saldoInsuficiente && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600">
                <Lock size={14} />
                Moedas insuficientes para esta compra.
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onCancelar}
                disabled={comprando}
                className="flex-1 cursor-pointer rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onConfirmar(quantidade)}
                disabled={saldoInsuficiente || comprando}
                className="flex-1 cursor-pointer rounded-xl bg-[#00A88F] px-4 py-3 text-sm font-black text-white transition-colors hover:bg-[#008f7a] disabled:cursor-not-allowed disabled:bg-[#0A1128]/15 disabled:text-[#0A1128]/40"
              >
                {comprando ? 'Comprando...' : 'Comprar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
