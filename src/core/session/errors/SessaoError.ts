export class SessaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessaoError';
  }
}

export class SessaoNaoAbertaError extends SessaoError {
  constructor(message = 'Não é permitido registrar voto: a sessão de votação não está aberta.') {
    super(message);
    this.name = 'SessaoNaoAbertaError';
  }
}

export class TransicaoInvalidaError extends SessaoError {
  constructor(message: string) {
    super(message);
    this.name = 'TransicaoInvalidaError';
  }
}

export class OperacaoInvalidaError extends SessaoError {
  constructor(message: string) {
    super(message);
    this.name = 'OperacaoInvalidaError';
  }
}
