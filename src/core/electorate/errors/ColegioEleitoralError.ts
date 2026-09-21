export class ColegioEleitoralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ColegioEleitoralError';
  }
}

export class EleitorInaptoError extends ColegioEleitoralError {
  readonly identificador: string;

  constructor(identificador: string) {
    super(
      `O eleitor com identificador ${identificador} não consta no colégio eleitoral.`,
    );
    this.identificador = identificador;
    this.name = 'EleitorInaptoError';
  }
}
