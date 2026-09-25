import { PerfilAlunoPage } from '../perfil/ui/PerfilAlunoPage';
import { previewStudent } from './previewStudent';

/** Página do perfil com dados identificados como exemplo, só em desenvolvimento. */
export function ProfilePreviewPage() {
  return <>
    <div className="profile-preview-banner">Prévia visual com dados de exemplo</div>
    <PerfilAlunoPage previewUser={previewStudent} />
  </>;
}
