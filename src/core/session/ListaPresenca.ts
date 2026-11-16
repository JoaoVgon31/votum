import { EleitorJaVotouError } from './errors/SessaoError.ts';

export class ListaPresenca {
  private readonly _eleitores = new Set<string>();

  public registrar(identificadorEleitor: string): void {
    if (this._eleitores.has(identificadorEleitor)) {
      throw new EleitorJaVotouError(identificadorEleitor);
    }
    this._eleitores.add(identificadorEleitor);
  }

  public contem(identificadorEleitor: string): boolean {
    return this._eleitores.has(identificadorEleitor);
  }

  public get total(): number {
    return this._eleitores.size;
  }

  public esvaziar(): void {
    this._eleitores.clear();
  }
}
