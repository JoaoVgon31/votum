/** Resultado da verificação de quórum de uma sessão. */
export interface ResultadoQuorum {
  /** Indica se a participação atingiu o mínimo exigido. */
  atingido: boolean;
  /** Participação apurada, em percentual (0 a 100). */
  participacao: number;
  /** Percentual mínimo de participação exigido pela estratégia (0 a 100). */
  percentualMinimo: number;
}

/**
 * Contrato do padrão Strategy para verificação de quórum.
 * Cada contexto eleitoral (CA, presidencial, condomínio) pode fornecer
 * a sua própria regra sem que o núcleo precise conhecê-la.
 */
export interface EstrategiaQuorum {
  /**
   * @param totalPresencas Tamanho da lista de presença (quem votou).
   * @param totalEleitores Total de eleitores aptos importados no colégio eleitoral.
   */
  verificar(totalPresencas: number, totalEleitores: number): ResultadoQuorum;
}
