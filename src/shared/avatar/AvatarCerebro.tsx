import type { CSSProperties } from 'react';
import avatarBase from '../assets/avatar/avatar-base.png';
import loiro from '../assets/avatar/cabelo/cabelo-loiro.png';
import cacheado from '../assets/avatar/cabelo/cabelo-cacheado.png';
import moicano from '../assets/avatar/cabelo/cabelo-moicano.png';
import coroa from '../assets/avatar/acessorios/coroa.png';
import oculos from '../assets/avatar/acessorios/oculos.png';
import chapeu from '../assets/avatar/acessorios/chapeu_formatura.png';
import luvaBoxe from '../assets/avatar/luvas/luva-boxe-posicao.png';
import luvaCirurgica from '../assets/avatar/luvas/luva-cirurgica-posicao.png';
import luvaLa from '../assets/avatar/luvas/luva-la-posicao.png';
import sapatoPlantao from '../assets/avatar/calcados/sapato-plantao-posicao.png';
import tenisCanoAlto from '../assets/avatar/calcados/tenis-cano-alto-posicao.png';
import tenisEsportivo from '../assets/avatar/calcados/tenis-esportivo-posicao.png';
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
const luvas = {
  'luva-boxe': { src: luvaBoxe, top: '68.76%', width: '71.46%' },
  'luva-cirurgica': { src: luvaCirurgica, top: '70.37%', width: '70.65%' },
  'luva-la': { src: luvaLa, top: '68.72%', width: '70.57%' },
};
const calcados = {
  'sapato-plantao': { src: sapatoPlantao, top: '76.07%', width: '39.80%' },
  'tenis-cano-alto': { src: tenisCanoAlto, top: '74.96%', width: '46.48%' },
  'tenis-esportivo': { src: tenisEsportivo, top: '75.79%', width: '40.91%' },
};
const overlay: CSSProperties = { position: 'absolute', transform: 'translate(-50%, -50%)', height: 'auto' };

export function AvatarCerebro({ aparencia, nome, className = '' }: {
  aparencia: AparenciaAvatar;
  nome?: string;
  className?: string;
}) {
  const cabelo = aparencia.cabelo ? cabelos[aparencia.cabelo] : null;
  const acessorio = aparencia.acessorio ? acessorios[aparencia.acessorio] : null;
  const luva = aparencia.luva ? luvas[aparencia.luva] : null;
  const calcado = aparencia.calcado ? calcados[aparencia.calcado] : null;
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
      {calcado && <img src={calcado.src} alt="" aria-hidden="true"
        style={{ ...overlay, top: calcado.top, left: '50.12%', width: calcado.width, zIndex: 1 }} />}
      {luva && <img src={luva.src} alt="" aria-hidden="true"
        style={{ ...overlay, top: luva.top, left: '50.12%', width: luva.width, zIndex: 3 }} />}
    </div>
  );
}
