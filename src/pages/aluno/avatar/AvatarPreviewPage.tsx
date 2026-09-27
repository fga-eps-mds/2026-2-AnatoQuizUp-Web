import { useState } from 'react';
import { Pencil, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import avatarBase from '../../../shared/assets/avatar/avatar-base.png';
import { AparenciaPanel, HairThumb } from './AparenciaPanel';
import { APARENCIA_PADRAO, HUE_ROTATE_COR, type AparenciaAvatar } from './aparencia';
import '../perfil/ui/profile.css';

const CHAVE_PREVIEW = 'anatoquizup:avatar:preview-local';

/** Prévia visual local, disponível apenas em desenvolvimento. */
export function AvatarPreviewPage() {
  const [salvo, setSalvo] = useState<AparenciaAvatar>(APARENCIA_PADRAO);
  const [rascunho, setRascunho] = useState<AparenciaAvatar>(APARENCIA_PADRAO);
  const temAlteracoes = JSON.stringify(rascunho) !== JSON.stringify(salvo);

  return (
    <div className="profile-screen avatar-screen">
      <header className="profile-screen-header">
        <h1>Meu perfil</h1>
        <p>Gerencie suas informações e personalize sua experiência</p>
      </header>
      <nav className="profile-breadcrumb" aria-label="Localização">
        <Link to="/perfil-preview">Perfil</Link><span aria-hidden="true">/</span><span>Meu avatar</span>
      </nav>
      <div className="profile-intro">
        <h2>Personalize seu avatar</h2>
        <p>Escolha os detalhes que combinam com você</p>
      </div>
      <div className="profile-layout">
        <div className="profile-left">
          <section className="avatar-only-card" aria-labelledby="avatar-title">
            <div className="avatar-only-heading"><h2 id="avatar-title">Seu avatar</h2><Pencil size={20} aria-hidden="true" /></div>
            <div className="avatar-only-circle">
              <div className="avatar-only-shadow" />
              <img
                src={avatarBase}
                alt="Cérebro do AnatoQuizUp"
                style={{ filter: `hue-rotate(${HUE_ROTATE_COR[rascunho.corCerebro]}deg)` }}
              />
              {rascunho.cabelo && (
                <div className={`avatar-cabelo-overlay cabelo-${rascunho.cabelo}`}>
                  <HairThumb estilo={rascunho.cabelo} />
                </div>
              )}
            </div>
            <button
              className="avatar-only-restore"
              type="button"
              onClick={() => {
                localStorage.removeItem(CHAVE_PREVIEW);
                setSalvo(APARENCIA_PADRAO);
                setRascunho(APARENCIA_PADRAO);
              }}
            >
              <RotateCcw size={22} aria-hidden="true" />
              Restaurar alterações
            </button>
          </section>
        </div>
        <div className="profile-right">
          <AparenciaPanel
            valor={rascunho}
            aoMudar={setRascunho}
            aoSalvar={() => {
              localStorage.setItem(CHAVE_PREVIEW, JSON.stringify(rascunho));
              setSalvo(rascunho);
            }}
            aoCancelar={() => setRascunho(salvo)}
            temAlteracoes={temAlteracoes}
          />
        </div>
      </div>
    </div>
  );
}
