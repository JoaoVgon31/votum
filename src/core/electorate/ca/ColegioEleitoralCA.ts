import type { ColegioEleitoral } from '../ColegioEleitoral';
import eleitoresAptosCA from './eleitores_aptos_ca.json';

export class ColegioEleitoralCA implements ColegioEleitoral {
  private readonly eleitoresAptos: ReadonlySet<string>;

  constructor(
    eleitoresAptos: readonly string[] = eleitoresAptosCA.eleitoresAptos,
  ) {
    this.eleitoresAptos = new Set(eleitoresAptos);
  }

  public verificarAptidao(identificador: string): boolean {
    return this.eleitoresAptos.has(identificador);
  }
}
