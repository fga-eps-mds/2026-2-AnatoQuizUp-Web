/**
 * Cartao de identidade do perfil, reutilizado em varias telas (perfil, ranking, etc.).
 * Compoe avatar + cosmeticos equipados (moldura, icone, titulo, plano de fundo) e,
 * no modo editavel, exibe e-mail/saldo e botoes de personalizar/editar.
 */
import { Coins, Mail, Pencil, Plus } from 'lucide-react';

import type { ItemInventario, TipoItemLoja } from '../../../features/loja';
import logoAnatoQuiz from '../../assets/image/logo.png';
import { montarIniciais } from '../../utils/iniciais';
import { CODIGO_LOGO_PREMIUM, GRADIENTE_OURO } from '../cosmetics';

// Dados textuais minimos exibidos no cartao.
export type IdentidadePerfil = {
  nome: string;
  nickname?: string | null;
  curso?: string | null;
};

// Mapa de slots cosmeticos equipados, indexado pelo tipo de item da loja.
export type SlotsCosmeticos = Partial<Record<TipoItemLoja, ItemInventario>>;

export type ProfileIdentityCardProps = {
  identidade: IdentidadePerfil;
  cosmeticos?: SlotsCosmeticos;
  tamanho?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  onPersonalizar?: () => void;
  email?: string;
  saldo?: string;
  onEditar?: () => void;
};

type TamanhoCard = NonNullable<ProfileIdentityCardProps['tamanho']>;

// Tabelas de classes por tamanho do cartao (circulo do avatar, banner e texto).
const TAMANHO_CIRCULO: Record<TamanhoCard, string> = {
  sm: 'h-10 w-10',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
};
const TAMANHO_BANNER: Record<Exclude<TamanhoCard, 'sm'>, string> = {
  md: 'h-36',
  lg: 'h-40',
};
const TAMANHO_TEXTO: Record<TamanhoCard, string> = {
  sm: 'text-sm',
  md: 'text-2xl',
  lg: 'text-3xl',
};
const GRADIENTE_TEAL = 'linear-gradient(to right, #71edc8, #14b8a6)';

export type AvatarCosmeticoProps = {
  identidade: IdentidadePerfil;
  cosmeticos: SlotsCosmeticos;
  tamanho: TamanhoCard;
};

type CirculoProps = AvatarCosmeticoProps;

/**
 * Renderiza o circulo do avatar resolvendo a prioridade dos cosmeticos:
 * avatar (imagem) > icone de perfil (com caso especial da logo premium) >
 * aparencia (rosto/cabelo) > iniciais.
 * Aplica a moldura equipada por cima, quando houver.
 */
const Circulo = ({ identidade, cosmeticos, tamanho }: CirculoProps) => {
  const moldura = cosmeticos.MOLDURA;
  const avatar = cosmeticos.AVATAR;
  const icone = cosmeticos.ICONE_PERFIL;
  const dimensao = TAMANHO_CIRCULO[tamanho];
  const avatarSrc = avatar?.previewImagemUrl ?? avatar?.imagemUrl;
  const iconeSrc = icone?.previewImagemUrl ?? icone?.imagemUrl;

  let conteudo;

  // Prioridade 1: avatar com imagem propria.
  if (avatar && avatarSrc) {
    conteudo = (
      <img
        src={avatarSrc}
        alt={avatar.nome}
        className={`${dimensao} rounded-full bg-white object-cover`}
      />
    );
  // Prioridade 2: icone de perfil; a logo premium recebe tratamento especial.
  } else if (icone) {
    const ehLogoPremium = icone.codigo === CODIGO_LOGO_PREMIUM;
    conteudo = (
      <div
        className={`${dimensao} flex items-center justify-center rounded-full p-2`}
        style={{ background: icone.valor ?? (ehLogoPremium ? GRADIENTE_OURO : '#0A1128') }}
      >
        {ehLogoPremium ? (
          <img
            src={logoAnatoQuiz}
            alt={icone.nome}
            className="h-3/4 w-3/4 object-contain drop-shadow"
          />
        ) : iconeSrc ? (
          <img src={iconeSrc} alt={icone.nome} className="h-3/4 w-3/4 object-contain" />
        ) : (
          <span className={`font-black text-white ${TAMANHO_TEXTO[tamanho]}`}>
            {montarIniciais(identidade.nome)}
          </span>
        )}
      </div>
    );
  // Prioridade 3: personalizacao de aparencia (rosto/cabelo), quando nao ha
  // avatar nem icone equipado.
  } else if (cosmeticos.ROSTO || cosmeticos.CABELO) {
    const rosto = cosmeticos.ROSTO;
    const cabelo = cosmeticos.CABELO;
    const rostoSrc = rosto?.previewImagemUrl ?? rosto?.imagemUrl;
    const cabeloSrc = cabelo?.previewImagemUrl ?? cabelo?.imagemUrl;

    conteudo = (
      <div className={`relative ${dimensao} overflow-hidden rounded-full bg-gray-100`}>
        {rostoSrc && (
          <img
            src={rostoSrc}
            alt={rosto!.nome}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {cabeloSrc && (
          <img
            src={cabeloSrc}
            alt={cabelo!.nome}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    );
  // Prioridade 4 (fallback): iniciais do nome sobre gradiente padrao.
  } else {
    conteudo = (
      <div
        className={`${dimensao} flex items-center justify-center rounded-full bg-gradient-to-br from-[#0A1128] to-[#0d9488] font-black text-[#71edc8] ${TAMANHO_TEXTO[tamanho]}`}
      >
        {montarIniciais(identidade.nome)}
      </div>
    );
  }

  // Quando ha moldura equipada, envolve o conteudo com a borda cosmetica.
  if (moldura) {
    return (
      <div
        aria-label={`Moldura ${moldura.nome}`}
        className="rounded-full p-[5px] shadow-sm"
        style={{ background: moldura.valor ?? GRADIENTE_OURO }}
      >
        {conteudo}
      </div>
    );
  }

  return <div className="rounded-full border-2 border-[#71edc8] shadow-sm">{conteudo}</div>;
};

export { Circulo as AvatarCosmetico };

export const ProfileIdentityCard = ({
  identidade,
  cosmeticos = {},
  tamanho = 'md',
  readOnly = true,
  onPersonalizar,
  email,
  saldo,
  onEditar,
}: ProfileIdentityCardProps) => {
  const titulo = cosmeticos.TITULO;

  // Variante compacta (sm): apenas avatar e, opcionalmente, o titulo abaixo.
  if (tamanho === 'sm') {
    return (
      <div className="flex flex-col items-center gap-1">
        <Circulo identidade={identidade} cosmeticos={cosmeticos} tamanho="sm" />
        {titulo && (
          <span className="max-w-20 truncate text-[10px] font-black text-[#B45309]">
            {titulo.nome}
          </span>
        )}
      </div>
    );
  }

  const fundo = cosmeticos.PLANO_FUNDO;

  // Variante completa (md/lg): banner com plano de fundo, avatar sobreposto e infos.
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Banner superior com o plano de fundo equipado (ou gradiente padrao). */}
      <div
        aria-label="Plano de fundo do perfil"
        className={`relative overflow-hidden rounded-t-2xl ${TAMANHO_BANNER[tamanho]}`}
        style={{ background: fundo?.valor ?? GRADIENTE_TEAL }}
      >
        {!readOnly && fundo && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <Plus size={12} aria-hidden="true" />
            {`Fundo: ${fundo.nome}`}
          </span>
        )}
      </div>

      <div className="flex items-start gap-5 px-6 pb-6">
        <div className="relative -mt-12 shrink-0">
          <Circulo identidade={identidade} cosmeticos={cosmeticos} tamanho={tamanho} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1 pt-4">
          {titulo && (
            <span className="w-fit rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-0.5 text-xs font-black text-[#B45309]">
              {titulo.nome}
            </span>
          )}

          <h2 className={`truncate font-black text-[#00214d] ${TAMANHO_TEXTO[tamanho]}`}>
            {identidade.nome}
          </h2>

          {identidade.nickname && (
            <p className="text-sm font-bold text-gray-500">{`@${identidade.nickname}`}</p>
          )}

          {(identidade.curso || (!readOnly && (email || saldo))) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              {identidade.curso && (
                <span className="text-sm font-semibold text-gray-500">
                  {identidade.curso}
                </span>
              )}
              {!readOnly && email && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
                  <Mail size={14} aria-hidden="true" />
                  {email}
                </span>
              )}
              {!readOnly && saldo && (
                <span className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                  <Coins size={14} aria-hidden="true" />
                  {saldo}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Acoes (somente no modo editavel): personalizar cosmeticos e editar dados. */}
        {!readOnly && (onPersonalizar || onEditar) && (
          <div className="flex shrink-0 flex-col items-end gap-2 pt-4">
            {onPersonalizar && (
              <button
                type="button"
                onClick={onPersonalizar}
                className="inline-flex items-center gap-2 rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0d9488]"
              >
                <Plus size={14} aria-hidden="true" />
                Personalizar perfil
              </button>
            )}
            {onEditar && (
              <button
                type="button"
                onClick={onEditar}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#00214d] transition-colors hover:bg-gray-50"
              >
                <Pencil size={14} aria-hidden="true" />
                Editar informações
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
