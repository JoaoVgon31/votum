export class ApuracaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApuracaoError';
  }
}

export class ParametrosApuracaoInvalidosError extends ApuracaoError {
  constructor(message: string) {
    super(message);
    this.name = 'ParametrosApuracaoInvalidosError';
  }
}

export class CedulaInvalidaError extends ApuracaoError {
  constructor(message: string) {
    super(message);
    this.name = 'CedulaInvalidaError';
  }
}
