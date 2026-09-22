import type { ResultadoQuorum } from '../quorum/EstrategiaQuorum.ts';
import type { StatusFinalSessao } from '../quorum/StatusFinalSessao.ts';

/** Dados consolidados necessários para emitir a ata de uma sessão. */
export interface DadosAta {
  /** Título da sessão (ex.: "Eleição Centro Acadêmico 2026"). */
  titulo: string;
  /** Estado final da sessão após a verificação de quórum. */
  status: StatusFinalSessao;
  /** Chapa vencedora, ou null quando não há vencedor. */
  vencedor: string | null;
  /** Total de votos registrados. */
  totalVotos: number;
  /** Total de eleitores aptos importados no colégio eleitoral. */
  totalEleitores: number;
  /** Tamanho da lista de presença. */
  totalPresencas: number;
  /**
   * Resultado já calculado pelo AvaliadorQuorum. A participação exibida na
   * ata vem dele, para não recalcular a mesma conta em dois lugares.
   */
  resultadoQuorum: ResultadoQuorum;
  /** Momento da emissão; se omitido, usa o instante atual. */
  geradaEm?: Date;
}

/** Ata de resultado já consolidada (serializável em JSON). */
export interface AtaResultado {
  titulo: string;
  status: StatusFinalSessao;
  /** Sempre null quando a sessão é declarada Deserta. */
  vencedor: string | null;
  totalVotos: number;
  totalEleitores: number;
  totalPresencas: number;
  /** Participação em percentual, com duas casas decimais. */
  participacao: number;
  /** Data/hora de emissão no formato ISO 8601. */
  geradaEm: string;
}
