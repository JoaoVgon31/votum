/** Votos válidos apurados para uma chapa. */
export interface ContagemChapa {
  /** Identificador da chapa, como consta na cédula. */
  chapa: string;
  /** Quantidade de cédulas atribuídas à chapa. */
  votos: number;
}

/** Quem venceu, a partir das contagens já fechadas. */
export interface DecisaoApuracao {
  /** Chapa eleita, ou null quando ninguém foi eleito. */
  vencedora: string | null;
  /** Indica que a primeira colocação ficou empatada. */
  empate: boolean;
  /** Chapas empatadas na primeira colocação. Fica vazia quando há vencedora. */
  chapasEmpatadas: readonly string[];
}

/**
 * Contrato do padrão Strategy para a regra de apuração.
 * A estratégia recebe as contagens prontas e devolve o eleito. Ela não sabe
 * de onde vieram as cédulas nem como brancos e nulos foram separados, então
 * outros cenários (presidencial, condomínio) podem trocar a regra sem mexer
 * no restante do núcleo.
 */
export interface EstrategiaApuracao {
  /**
   * @param contagens Uma entrada por chapa concorrente, inclusive as zeradas.
   */
  decidir(contagens: readonly ContagemChapa[]): DecisaoApuracao;
}
