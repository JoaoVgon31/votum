/**
 * Estados finais de uma sessão após a verificação de quórum.
 * Espelham os estados terminais "Concluida" e "Deserta" do diagrama de
 * estados do ciclo de vida da sessão.
 */
export const StatusFinalSessao = {
  CONCLUIDA: 'Concluida',
  DESERTA: 'Deserta',
} as const;

export type StatusFinalSessao =
  (typeof StatusFinalSessao)[keyof typeof StatusFinalSessao];
