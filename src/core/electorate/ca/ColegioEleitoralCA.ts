import type { ColegioEleitoral } from '../ColegioEleitoral';
import { EleitorInaptoError } from '../errors/ColegioEleitoralError';
import eleitoresAptosCA from './eleitores_aptos_ca.json';

export class ColegioEleitoralCA implements ColegioEleitoral {
  private readonly eleitoresAptos: ReadonlySet<string>;

  constructor(
    eleitoresAptos: readonly string[] = eleitoresAptosCA.eleitoresAptos,
  ) {
    this.eleitoresAptos = new Set(eleitoresAptos);
  }

  public verificarAptidao(identificador: string): void {
    const identificadorLimpo = identificador.trim();
    if (!this.eleitoresAptos.has(identificadorLimpo)) {
      throw new EleitorInaptoError(identificador);
    }
  }
}
