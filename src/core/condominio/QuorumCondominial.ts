import { ParametrosCondominioInvalidosError } from './errors/CondominioError.ts';
import { arredondarFracao } from './UnidadeCondominial.ts';

/**
 * Tipos de quórum exigidos por pauta da assembleia condominial.
 */
export const TipoQuorumCondominial = {
  MAIORIA_SIMPLES_PRESENTES: 'MaioriaSimplesPresentes',
  DOIS_TERCOS_TOTAL: 'DoisTercosTotal',
  UNANIMIDADE: 'Unanimidade',
} as const;

export type TipoQuorumCondominial =
  (typeof TipoQuorumCondominial)[keyof typeof TipoQuorumCondominial];

export function ehTipoQuorumCondominial(
  valor: string,
): valor is TipoQuorumCondominial {
  return (
    valor === TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES ||
    valor === TipoQuorumCondominial.DOIS_TERCOS_TOTAL ||
    valor === TipoQuorumCondominial.UNANIMIDADE
  );
}

/**
 * Status atribuído à deliberação de uma pauta condominial.
 */
export const StatusDeliberacaoPauta = {
  EM_VOTACAO: 'Em Votação',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  QUORUM_INSUFICIENTE: 'Quórum Insuficiente',
} as const;

export type StatusDeliberacaoPauta =
  (typeof StatusDeliberacaoPauta)[keyof typeof StatusDeliberacaoPauta];

export interface StatusQuorumTempoReal {
  readonly tipoQuorum: TipoQuorumCondominial;
  readonly quorumDeliberacaoAtingido: boolean;
  readonly fracaoMinimaExigida: number;
  readonly fracaoTotalVotante: number;
  readonly fracaoTotalCondominio: number;
  readonly percentualParticipacaoTotal: number;
}

export function validarTipoQuorumCondominial(
  tipoQuorum: TipoQuorumCondominial,
): void {
  if (!ehTipoQuorumCondominial(tipoQuorum)) {
    throw new ParametrosCondominioInvalidosError(
      `O tipo de quórum "${String(tipoQuorum)}" é inválido.`,
    );
  }
}

export function avaliarQuorumTempoReal(
  tipoQuorum: TipoQuorumCondominial,
  fracaoTotalVotante: number,
  fracaoTotalCondominio: number,
): StatusQuorumTempoReal {
  const percentualParticipacaoTotal =
    fracaoTotalCondominio > 0
      ? Math.round((fracaoTotalVotante / fracaoTotalCondominio) * 10000) / 100
      : 0;

  let fracaoMinimaExigida: number;
  let quorumDeliberacaoAtingido: boolean;

  if (tipoQuorum === TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES) {
    fracaoMinimaExigida = 0;
    quorumDeliberacaoAtingido = fracaoTotalVotante > 0;
  } else if (tipoQuorum === TipoQuorumCondominial.DOIS_TERCOS_TOTAL) {
    fracaoMinimaExigida = arredondarFracao((fracaoTotalCondominio * 2) / 3);
    quorumDeliberacaoAtingido =
      fracaoTotalVotante * 3 >= fracaoTotalCondominio * 2;
  } else {
    fracaoMinimaExigida = arredondarFracao(fracaoTotalCondominio);
    quorumDeliberacaoAtingido = fracaoTotalVotante >= fracaoTotalCondominio;
  }

  return {
    tipoQuorum,
    quorumDeliberacaoAtingido,
    fracaoMinimaExigida,
    fracaoTotalVotante,
    fracaoTotalCondominio,
    percentualParticipacaoTotal,
  };
}

export function calcularStatusDeliberacaoFinal(
  tipoQuorum: TipoQuorumCondominial,
  fracaoFavoravel: number,
  fracaoContraria: number,
  fracaoTotalVotante: number,
  fracaoTotalCondominio: number,
): StatusDeliberacaoPauta {
  const statusQuorum = avaliarQuorumTempoReal(
    tipoQuorum,
    fracaoTotalVotante,
    fracaoTotalCondominio,
  );

  if (!statusQuorum.quorumDeliberacaoAtingido) {
    return StatusDeliberacaoPauta.QUORUM_INSUFICIENTE;
  }

  if (tipoQuorum === TipoQuorumCondominial.MAIORIA_SIMPLES_PRESENTES) {
    return fracaoFavoravel > fracaoContraria
      ? StatusDeliberacaoPauta.APROVADA
      : StatusDeliberacaoPauta.REJEITADA;
  }

  if (tipoQuorum === TipoQuorumCondominial.DOIS_TERCOS_TOTAL) {
    return fracaoFavoravel * 3 >= fracaoTotalCondominio * 2
      ? StatusDeliberacaoPauta.APROVADA
      : StatusDeliberacaoPauta.REJEITADA;
  }

  return fracaoFavoravel >= fracaoTotalCondominio
    ? StatusDeliberacaoPauta.APROVADA
    : StatusDeliberacaoPauta.REJEITADA;
}
