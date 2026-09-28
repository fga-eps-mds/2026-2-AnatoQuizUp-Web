import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import avatarBase from '../../../shared/assets/avatar/avatar-base.png';
import { AccessoryThumb, AparenciaPanel, HairThumb } from './AparenciaPanel';
import { APARENCIA_PADRAO, HUE_ROTATE_COR, type AparenciaAvatar } from './aparencia';
import '../perfil/ui/profile.css';

const chaveAvatar = (userId: string) => `anatoquizup:avatar:${userId}`;

/** Le a aparencia salva localmente; sem registro ou em caso de erro, usa o padrao. */
function carregarAparencia(userId: string): AparenciaAvatar {
  try {
    const bruto = localStorage.getItem(chaveAvatar(userId));
    if (!bruto) return APARENCIA_PADRAO;
    const dados = JSON.parse(bruto) as Partial<AparenciaAvatar>;
    return {
      corCerebro: dados.corCerebro ?? APARENCIA_PADRAO.corCerebro,
      cabelo: dados.cabelo ?? null,
      acessorio: dados.acessorio ?? null,
    };
  } catch {
    return APARENCIA_PADRAO;
  }
}

/** Primeira etapa do avatar: apresentação do cérebro padrão + personalização de aparência. */
export function AvatarPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isPersonalizando, setIsPersonalizando] = useState(false);
  const [salvo, setSalvo] = useState<AparenciaAvatar>(APARENCIA_PADRAO);
  const [rascunho, setRascunho] = useState<AparenciaAvatar>(APARENCIA_PADRAO);

  // Carrega a aparencia salva assim que o usuario autenticado fica disponivel.
  // Ajustado durante a renderizacao (em vez de useEffect) para nao disparar um
  // segundo ciclo de commit so para popular o estado inicial.
  const [carregadoParaUserId, setCarregadoParaUserId] = useState<string | null>(null);
  if (user && user.id !== carregadoParaUserId) {
    setCarregadoParaUserId(user.id);
    const aparencia = carregarAparencia(user.id);
    setSalvo(aparencia);
    setRascunho(aparencia);
  }

  if (!user) return null;

  const temAlteracoes = JSON.stringify(rascunho) !== JSON.stringify(salvo);

  const restore = () => {
    // Limpa escolhas da antiga prévia local para que o cérebro padrão volte a aparecer.
    localStorage.removeItem(chaveAvatar(user.id));
    setSalvo(APARENCIA_PADRAO);
    setRascunho(APARENCIA_PADRAO);
    setMessage('Avatar restaurado ao padrão.');
  };

  const salvarAparencia = () => {
    localStorage.setItem(chaveAvatar(user.id), JSON.stringify(rascunho));
    setSalvo(rascunho);
    setMessage('Alterações salvas.');
    setIsPersonalizando(false);
  };

  const cancelarAparencia = () => {
    setRascunho(salvo);
    setIsPersonalizando(false);
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
      <div className="profile-intro">
        <h2>Personalize seu avatar</h2>
        <p>Escolha os detalhes que combinam com você</p>
      </div>
      <div className={`profile-layout${isPersonalizando ? '' : ' avatar-layout-closed'}`}>
        <div className="profile-left">
          <section className="avatar-only-card" aria-labelledby="avatar-title">
            <div className="avatar-only-heading">
              <h2 id="avatar-title">Seu avatar</h2>
              <button
                type="button"
                className="avatar-only-edit"
                aria-label="Editar aparência do avatar"
                aria-expanded={isPersonalizando}
                onClick={() => setIsPersonalizando(true)}
              >
                <Pencil size={20} aria-hidden="true" />
              </button>
            </div>
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
              {rascunho.acessorio && (
                <div
                  className={`avatar-cabelo-overlay acessorio-${rascunho.acessorio}${
                    rascunho.cabelo ? ` com-cabelo-${rascunho.cabelo}` : ''
                  }`}
                >
                  <AccessoryThumb estilo={rascunho.acessorio} />
                </div>
              )}
            </div>
            <button className="avatar-only-restore" type="button" onClick={restore}>
              <RotateCcw size={22} aria-hidden="true" />
              Restaurar alterações
            </button>
            <p className="avatar-only-status" role="status">{message}</p>
          </section>
        </div>
        {isPersonalizando && (
          <div className="profile-right">
            <AparenciaPanel
              valor={rascunho}
              aoMudar={setRascunho}
              aoSalvar={salvarAparencia}
              aoCancelar={cancelarAparencia}
              temAlteracoes={temAlteracoes}
            />
          </div>
        )}
      </div>
    </div>
  );
}
