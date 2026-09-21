export const StatusSessao = {
  EM_CONFIGURACAO: 'EmConfiguracao',
  AGENDADA: 'Agendada',
  ABERTA: 'Aberta',
  EM_APURACAO: 'EmApuracao',
  CANCELADA: 'Cancelada',
} as const;

export type StatusSessao = (typeof StatusSessao)[keyof typeof StatusSessao];
