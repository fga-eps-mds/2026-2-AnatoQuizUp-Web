import { Pencil, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import avatarBase from '../../../shared/assets/avatar/avatar-base.png';
import '../perfil/ui/profile.css';

/** Prévia visual local, disponível apenas em desenvolvimento. */
export function AvatarPreviewPage() {
  return (
    <div className="profile-screen avatar-screen">
      <header className="profile-screen-header">
        <h1>Meu perfil</h1>
        <p>Gerencie suas informações e personalize sua experiência</p>
      </header>
      <nav className="profile-breadcrumb" aria-label="Localização">
        <Link to="/perfil-preview">Perfil</Link><span aria-hidden="true">/</span><span>Meu avatar</span>
      </nav>
      <section className="avatar-only-card" aria-labelledby="avatar-title">
        <div className="avatar-only-heading"><h2 id="avatar-title">Seu avatar</h2><Pencil size={20} aria-hidden="true" /></div>
        <div className="avatar-only-circle"><div className="avatar-only-shadow" /><img src={avatarBase} alt="Cérebro do AnatoQuizUp" /></div>
        <button className="avatar-only-restore" type="button" onClick={() => { localStorage.removeItem('anatoquizup:avatar:preview-local'); }}><RotateCcw size={22} aria-hidden="true" />Restaurar alterações</button>
      </section>
    </div>
  );
}
