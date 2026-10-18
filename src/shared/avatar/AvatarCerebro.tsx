import type { CSSProperties } from 'react';
import avatarBase from '../assets/avatar/avatar-base.png';
import loiro from '../assets/avatar/cabelo/cabelo-loiro.png';
import cacheado from '../assets/avatar/cabelo/cabelo-cacheado.png';
import moicano from '../assets/avatar/cabelo/cabelo-moicano.png';
import coroa from '../assets/avatar/acessorios/coroa.png';
import oculos from '../assets/avatar/acessorios/oculos.png';
import chapeu from '../assets/avatar/acessorios/chapeu_formatura.png';
import { HUE_ROTATE_COR, type AparenciaAvatar } from './aparencia';

const cabelos = {
  loiro: { src: loiro, top: '40%', left: '50%', width: '100%' },
  cacheado: { src: cacheado, top: '40%', left: '46%', width: '82%' },
  moicano: { src: moicano, top: '30%', left: '50%', width: '82%' },
};
const acessorios = {
  coroa: { src: coroa, top: '17%', width: '18%' },
  oculos: { src: oculos, top: '46%', width: '50%' },
  'chapeu-formatura': { src: chapeu, top: '20.5%', width: '25.5%' },
};
const overlay: CSSProperties = { position: 'absolute', transform: 'translate(-50%, -50%)', height: 'auto' };

export function AvatarCerebro({ aparencia, nome, className = '' }: {
  aparencia: AparenciaAvatar;
  nome?: string;
  className?: string;
}) {
  const cabelo = aparencia.cabelo ? cabelos[aparencia.cabelo] : null;
  const acessorio = aparencia.acessorio ? acessorios[aparencia.acessorio] : null;
  const topAcessorio = cabelo && aparencia.acessorio !== 'oculos'
    ? aparencia.acessorio === 'coroa' ? '8.5%' : '10%'
    : acessorio?.top;
  return (
    <div className={`relative isolate overflow-hidden rounded-full bg-[#e5fbf8] ${className}`}>
      <img src={avatarBase} alt={nome ? `Avatar de ${nome}` : 'Cérebro do AnatoQuizUp'}
        className="h-full w-full object-contain"
        style={{ filter: `hue-rotate(${HUE_ROTATE_COR[aparencia.corCerebro]}deg)` }} />
      {cabelo && <img src={cabelo.src} alt="" aria-hidden="true"
        style={{ ...overlay, top: cabelo.top, left: cabelo.left, width: cabelo.width, zIndex: 2 }} />}
      {acessorio && <img src={acessorio.src} alt="" aria-hidden="true"
        style={{ ...overlay, top: topAcessorio, left: '50%', width: acessorio.width, zIndex: aparencia.acessorio === 'oculos' ? 1 : 3 }} />}
    </div>
  );
}
