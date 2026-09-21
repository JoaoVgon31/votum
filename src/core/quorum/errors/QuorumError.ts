export class QuorumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuorumError';
  }
}

export class ParametrosQuorumInvalidosError extends QuorumError {
  constructor(message: string) {
    super(message);
    this.name = 'ParametrosQuorumInvalidosError';
  }
}
