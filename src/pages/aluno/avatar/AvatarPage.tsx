import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { AvatarCerebro } from '../../../shared/avatar/AvatarCerebro';
import { buscarAparenciaRemota, salvarAparenciaRemota } from '../../../shared/avatar/avatarApi';
import { carregarAparencia, salvarAparencia as persistirAparencia } from '../../../shared/avatar/useAparenciaAvatar';
import { AparenciaPanel } from './AparenciaPanel';
import { APARENCIA_PADRAO, type AparenciaAvatar } from './aparencia';
import '../perfil/ui/profile.css';

/** Primeira etapa do avatar: apresentação do cérebro padrão + personalização de aparência. */
export function AvatarPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isPersonalizando, setIsPersonalizando] = useState(false);
  const [salvo, setSalvo] = useState<AparenciaAvatar>(APARENCIA_PADRAO);
  const [rascunho, setRascunho] = useState<AparenciaAvatar>(APARENCIA_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const userId = user?.id;

  // Carrega a aparencia salva assim que o usuario autenticado fica disponivel.
  // Ajustado durante a renderizacao (em vez de useEffect) para nao disparar um
  // segundo ciclo de commit so para popular o estado inicial.
  const [carregadoParaUserId, setCarregadoParaUserId] = useState<string | null>(null);
  if (user && user.id !== carregadoParaUserId) {
    setCarregadoParaUserId(user.id);
    const aparencia = carregarAparencia(user.id);
    setSalvo(aparencia);
    setRascunho(aparencia);
    setCarregando(true);
  }

  useEffect(() => {
    if (!userId) return;
    let ativo = true;
    const id = userId;
    void buscarAparenciaRemota(id, true).then((aparencia) => {
      if (!ativo) return;
      persistirAparencia(id, aparencia);
      setSalvo(aparencia);
      setRascunho(aparencia);
    }).catch(() => {
      if (ativo) setMessage('Não foi possível carregar o avatar. Tente novamente mais tarde.');
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [userId]);

  if (!user) return null;

  const temAlteracoes = JSON.stringify(rascunho) !== JSON.stringify(salvo);

  const restore = async () => {
    setSalvando(true);
    setMessage('');
    try {
      const aparencia = await salvarAparenciaRemota(APARENCIA_PADRAO);
      persistirAparencia(user.id, aparencia);
      setSalvo(aparencia);
      setRascunho(aparencia);
      setMessage('Avatar restaurado ao padrão.');
    } catch {
      setMessage('Não foi possível restaurar o avatar.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarAparencia = async () => {
    setSalvando(true);
    setMessage('');
    try {
      const aparencia = await salvarAparenciaRemota(rascunho);
      persistirAparencia(user.id, aparencia);
      setSalvo(aparencia);
      setMessage('Alterações salvas.');
      setIsPersonalizando(false);
    } catch {
      setMessage('Não foi possível salvar o avatar.');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarAparencia = () => {
    setRascunho(salvo);
    setIsPersonalizando(false);
  };

  return (
    <div className="profile-screen avatar-screen">
      <header className="profile-screen-header">
        <h1>Personalizar avatar</h1>
        <p>Use seus itens para montar sua identidade</p>
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
                disabled={carregando || salvando}
              >
                <Pencil size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="avatar-only-circle">
              <div className="avatar-only-shadow" />
              <AvatarCerebro aparencia={rascunho} className="h-full w-full" />
            </div>
            <button className="avatar-only-restore" type="button" onClick={() => void restore()} disabled={carregando || salvando}>
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
              aoSalvar={() => void salvarAparencia()}
              aoCancelar={cancelarAparencia}
              temAlteracoes={temAlteracoes && !salvando}
            />
          </div>
        )}
      </div>
    </div>
  );
}
