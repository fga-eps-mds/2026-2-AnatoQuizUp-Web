import { ImageOff, UserRound } from 'lucide-react';

import type { ItemInventario, ItemLoja } from '../../../features/loja';
import logoAnatoQuiz from '../../assets/image/logo.png';

// Codigo do icone premium (logo dourada) e gradiente de ouro reutilizado em varios cosmeticos.
export const CODIGO_LOGO_PREMIUM = 'icone-anatoquiz-dourado';
export const GRADIENTE_OURO = 'linear-gradient(135deg, #FCD34D 0%, #D4AF37 100%)';

type CosmeticPreviewProps = {
  item: ItemLoja | ItemInventario;
  grande?: boolean;
};

/** Mockup de um mini-perfil usado para pre-visualizar planos de fundo em tamanho grande. */
const MockupPerfil = ({ valor }: { valor: string | null }) => (
  <div className="w-56 overflow-hidden rounded-2xl border border-[#0A1128]/10 bg-white shadow-sm">
    <div className="h-20" style={{ background: valor ?? '#0A1128' }} />
    <div className="flex flex-col items-center px-3 pb-4">
      <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#0A1128]/10">
        <UserRound className="text-[#0A1128]/40" size={26} />
      </div>
      <div className="mt-2 h-3 w-24 rounded-full bg-[#0A1128]/15" />
      <div className="mt-1.5 h-2.5 w-16 rounded-full bg-[#F59E0B]/40" />
      <div className="mt-3 grid w-full grid-cols-3 gap-1.5">
        <div className="h-6 rounded bg-[#0A1128]/5" />
        <div className="h-6 rounded bg-[#0A1128]/5" />
        <div className="h-6 rounded bg-[#0A1128]/5" />
      </div>
    </div>
  </div>
);

/**
 * Pre-visualizacao de um item cosmetico, com aparencia especifica por tipo
 * (plano de fundo, titulo, moldura, icone de perfil) e um fallback de imagem.
 */
export const CosmeticPreview = ({ item, grande = false }: CosmeticPreviewProps) => {
  const dimensao = grande ? 'h-36 w-36' : 'h-24 w-24';

  // Plano de fundo: mockup de perfil no modo grande, ou apenas o swatch de cor.
  if (item.tipo === 'PLANO_FUNDO') {
    if (grande) return <MockupPerfil valor={item.valor} />;
    return (
      <div
        className={`${dimensao} rounded-2xl border border-[#0A1128]/10 shadow-inner`}
        style={{ background: item.valor ?? '#0A1128' }}
        aria-label={`Pré-visualização do fundo ${item.nome}`}
      />
    );
  }

  // Titulo: cartao com o texto do titulo em destaque.
  if (item.tipo === 'TITULO') {
    return (
      <div
        className={`${grande ? 'h-36 w-56 text-lg' : 'h-24 w-40 text-sm'} flex items-center justify-center rounded-2xl border border-[#F59E0B]/40 bg-gradient-to-br from-[#F59E0B]/15 to-[#F97316]/15 px-4 text-center`}
      >
        <span className="font-black leading-tight text-[#0A1128]">{item.nome}</span>
      </div>
    );
  }

  // Moldura: anel colorido em volta de um avatar generico.
  if (item.tipo === 'MOLDURA') {
    return (
      <div
        className={`${dimensao} rounded-full p-[7px] shadow-sm`}
        style={{ background: item.valor ?? GRADIENTE_OURO }}
        aria-label={`Pré-visualização da moldura ${item.nome}`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <UserRound className="text-[#0A1128]/30" size={grande ? 52 : 34} />
        </div>
      </div>
    );
  }

  // Consumiveis (dica/potencializador): icone branco sobre o gradiente do item.
  if (item.tipo === 'DICA' || item.tipo === 'POTENCIALIZADOR') {
    const src = item.previewImagemUrl ?? item.imagemUrl;
    return (
      <div
        className={`${dimensao} flex items-center justify-center rounded-2xl p-4 shadow-sm`}
        style={{ background: item.valor ?? 'linear-gradient(135deg, #71edc8 0%, #00A88F 100%)' }}
      >
        {src ? (
          <img src={src} alt={item.nome} className="h-full w-full object-contain drop-shadow" />
        ) : (
          <ImageOff className="text-white/70" size={grande ? 40 : 28} />
        )}
      </div>
    );
  }

  // Icone de perfil: a logo premium tem render proprio; demais usam imagem ou fallback.
  if (item.tipo === 'ICONE_PERFIL') {
    if (item.codigo === CODIGO_LOGO_PREMIUM) {
      return (
        <div
          className={`${dimensao} flex items-center justify-center rounded-2xl p-3 shadow-sm`}
          style={{ background: item.valor ?? GRADIENTE_OURO }}
        >
          <img
            src={logoAnatoQuiz}
            alt={item.nome}
            className="h-full w-full object-contain drop-shadow"
          />
        </div>
      );
    }

    const src = item.previewImagemUrl ?? item.imagemUrl;
    return (
      <div
        className={`${dimensao} flex items-center justify-center rounded-2xl p-4 shadow-sm`}
        style={{ background: item.valor ?? '#0A1128' }}
      >
        {src ? (
          <img src={src} alt={item.nome} className="h-full w-full object-contain" />
        ) : (
          <ImageOff className="text-white/70" size={grande ? 40 : 28} />
        )}
      </div>
    );
  }

  // Demais tipos (ex.: avatar): usa a imagem do item, ou um placeholder quando ausente.
  const src = item.previewImagemUrl ?? item.imagemUrl;
  if (!src) {
    return (
      <div
        className={`${dimensao} flex items-center justify-center rounded-2xl border border-[#0A1128]/10 bg-[#0A1128]/5 text-[#0A1128]/30`}
      >
        <ImageOff size={grande ? 40 : 28} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={item.nome}
      className={`${dimensao} rounded-2xl border border-[#0A1128]/10 bg-white object-contain p-1`}
    />
  );
};
