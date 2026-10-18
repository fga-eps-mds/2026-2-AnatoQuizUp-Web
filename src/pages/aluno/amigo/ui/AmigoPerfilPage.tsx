import { useEffect, useState } from 'react';
import { ArrowLeft, UserX } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AchievementHighlights } from '../../../../features/achievements';
import { desfazerAmizade } from '../../../../features/friendship';
import { converterItensEquipadosParaSlots } from '../../../../features/profile-cosmetics';
import type { SlotsCosmeticos } from '../../../../features/profile-cosmetics';
import { buscarPerfilSocial, type PerfilSocial } from '../../../../features/social-profile';
import { ProfileIdentityCard } from '../../../../shared/ui/profile-identity-card';

// O id da amizade pode chegar pelo state da navegacao (habilita "desfazer amizade").
type EstadoNavegacao = {
  amizadeId?: string;
} | null;

const MENSAGEM_ERRO_PERFIL = 'Não foi possível carregar este perfil.';

/**
 * Pagina do perfil social de um amigo: cartao de identidade com cosmeticos e
 * conquistas em destaque. Se veio com o id da amizade, permite desfaze-la.
 */
export const AmigoPerfilPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const amizadeId = (state as EstadoNavegacao)?.amizadeId ?? null;

  // Perfil, cosmeticos equipados e estados de carga/erro (geral e da acao de desfazer).
  const [perfil, setPerfil] = useState<PerfilSocial | null>(null);
  const [cosmeticos, setCosmeticos] = useState<SlotsCosmeticos>({});
  const [carregando, setCarregando] = useState(Boolean(id));
  const [erro, setErro] = useState<string | null>(() => (id ? null : MENSAGEM_ERRO_PERFIL));
  const [desfazendo, setDesfazendo] = useState(false);
  const [erroDesfazer, setErroDesfazer] = useState<string | null>(null);

  // Carrega o perfil social sempre que o id muda; a flag evita setState apos unmount.
  useEffect(() => {
    if (!id) {
      return;
    }

    let ativo = true;

    const carregarPerfil = async () => {
      setCarregando(true);
      setErro(null);
      setPerfil(null);
      setCosmeticos({});

      try {
        const resultadoPerfil = await buscarPerfilSocial(id);

        if (!ativo) return;

        setPerfil(resultadoPerfil);
        setCosmeticos(converterItensEquipadosParaSlots(resultadoPerfil.cosmeticos));
      } catch {
        if (!ativo) return;
        setErro(MENSAGEM_ERRO_PERFIL);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [id]);

  /** Desfaz a amizade e volta para a lista; mantem mensagem de erro em caso de falha. */
  const handleDesfazerAmizade = async () => {
    if (!amizadeId) {
      return;
    }

    setDesfazendo(true);
    setErroDesfazer(null);

    try {
      await desfazerAmizade(amizadeId);
      navigate('/aluno/amigos');
    } catch {
      setErroDesfazer('Não foi possível desfazer a amizade. Tente novamente.');
      setDesfazendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <button
            type="button"
            onClick={() => navigate('/aluno/amigos')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00214d] hover:text-[#14b8a6]"
          >
            <ArrowLeft size={16} />
            Voltar para lista de amigos
          </button>
        </header>

        {carregando && (
          <div
            role="status"
            aria-label="Carregando perfil"
            className="h-64 animate-pulse rounded-2xl bg-gray-200"
          />
        )}

        {!carregando && erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm"
          >
            <p className="font-semibold text-red-600">{erro}</p>
            <button
              type="button"
              onClick={() => navigate('/aluno/amigos')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d9488]"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        )}

        {/* Conteudo do perfil quando carregado com sucesso. */}
        {!carregando && perfil && (
          <>
            <ProfileIdentityCard
              identidade={{
                usuarioId: perfil.usuario.id,
                nome: perfil.usuario.nome,
                nickname: perfil.usuario.nickname,
                curso: perfil.usuario.curso,
              }}
              cosmeticos={cosmeticos}
              tamanho="md"
              readOnly
            />

            <AchievementHighlights conquistas={perfil.conquistasDestacadas} />

            {amizadeId && (
              <div className="flex flex-col gap-2">
                {erroDesfazer && (
                  <p role="alert" className="text-sm font-semibold text-red-600">
                    {erroDesfazer}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleDesfazerAmizade()}
                  disabled={desfazendo}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserX size={16} />
                  {desfazendo ? 'Desfazendo...' : 'Desfazer amizade'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
