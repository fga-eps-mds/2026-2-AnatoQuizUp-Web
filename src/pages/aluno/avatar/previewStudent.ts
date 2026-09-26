import type { User } from '../../../entities/user/model/types';
/** Prévia do layout real: mesma barra lateral, sem serviços ou autenticação. */
export const previewStudent: User = {
  id: 'preview-local',
  name: 'Aluno Exemplo',
  nickname: 'alunoexemplo',
  email: 'aluno@exemplo.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  authProvider: 'LOCAL',
  course: 'Medicina',
  institution: 'Instituição de exemplo',
  period: 1,
};

