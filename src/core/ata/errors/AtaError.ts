export class AtaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtaError';
  }
}

export class DadosAtaInvalidosError extends AtaError {
  constructor(message: string) {
    super(message);
    this.name = 'DadosAtaInvalidosError';
  }
}
