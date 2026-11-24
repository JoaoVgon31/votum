export class CondominioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CondominioError';
  }
}

export class ParametrosCondominioInvalidosError extends CondominioError {
  constructor(message: string) {
    super(message);
    this.name = 'ParametrosCondominioInvalidosError';
  }
}

export class UnidadeNaoEncontradaError extends CondominioError {
  readonly unidadeId: string;

  constructor(unidadeId: string) {
    super(`A unidade "${unidadeId}" não está cadastrada no condomínio.`);
    this.unidadeId = unidadeId;
    this.name = 'UnidadeNaoEncontradaError';
  }
}

export class ProprietarioSemUnidadesError extends CondominioError {
  readonly proprietarioId: string;

  constructor(proprietarioId: string) {
    super(
      `O proprietário "${proprietarioId}" não possui unidades cadastradas no condomínio.`,
    );
    this.proprietarioId = proprietarioId;
    this.name = 'ProprietarioSemUnidadesError';
  }
}

export class UnidadeJaVotouError extends CondominioError {
  readonly unidadeId: string;

  constructor(unidadeId: string) {
    super(`A unidade "${unidadeId}" já registrou voto nesta pauta.`);
    this.unidadeId = unidadeId;
    this.name = 'UnidadeJaVotouError';
  }
}

export class PautaEncerradaError extends CondominioError {
  readonly pautaId: string;

  constructor(pautaId: string) {
    super(`A votação da pauta "${pautaId}" já foi encerrada.`);
    this.pautaId = pautaId;
    this.name = 'PautaEncerradaError';
  }
}

export class UnidadeInadimplenteError extends CondominioError {
  readonly unidadeId: string;

  constructor(unidadeId: string) {
    super(
      `A unidade "${unidadeId}" possui pendências financeiras em aberto e está impedida de votar na assembleia, podendo apenas acompanhar como ouvinte.`,
    );
    this.unidadeId = unidadeId;
    this.name = 'UnidadeInadimplenteError';
  }
}

export class PautaNaoEncerradaParaAtaError extends CondominioError {
  readonly pautaId: string;

  constructor(pautaId: string) {
    super(
      `A pauta "${pautaId}" ainda não foi encerrada e não pode ser consolidada na ata da assembleia.`,
    );
    this.pautaId = pautaId;
    this.name = 'PautaNaoEncerradaParaAtaError';
  }
}
