import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import avatarBase from '../../../shared/assets/avatar/avatar-base.png';
import '../perfil/ui/profile.css';

/** Primeira etapa do avatar: apresentação do cérebro padrão na área do perfil. */
export function AvatarPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  if (!user) return null;

  const restore = () => {
    // Limpa escolhas da antiga prévia local para que o cérebro padrão volte a aparecer.
    localStorage.removeItem(`anatoquizup:avatar:${user.id}`);
    setMessage('Avatar restaurado ao padrão.');
  };

  return (
    <div className="profile-screen avatar-screen">
      <header className="profile-screen-header">
        <h1>Meu perfil</h1>
        <p>Gerencie suas informações e personalize sua experiência</p>
      </header>
      <nav className="profile-breadcrumb" aria-label="Localização">
        <Link to="/aluno/perfil">Perfil</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Meu avatar</span>
      </nav>
      <section className="avatar-only-card" aria-labelledby="avatar-title">
        <div className="avatar-only-heading">
          <h2 id="avatar-title">Seu avatar</h2>
          <Pencil size={20} aria-hidden="true" />
        </div>
        <div className="avatar-only-circle">
          <div className="avatar-only-shadow" />
          <img src={avatarBase} alt="Cérebro do AnatoQuizUp" />
        </div>
        <button className="avatar-only-restore" type="button" onClick={restore}>
          <RotateCcw size={22} aria-hidden="true" />
          Restaurar alterações
        </button>
        <p className="avatar-only-status" role="status">{message}</p>
      </section>
    </div>
  );
}
