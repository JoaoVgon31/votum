import { gerarRecibo } from '../recibo/gerarRecibo.ts';
import type { Cedula } from '../session/Cedula.ts';
import type { ItemMural } from './ItemMural.ts';

/**
 * Monta o mural público a partir das cédulas da urna.
 * Um item por cédula, só com o recibo e o horário do depósito.
 */
export async function gerarMural(
  cedulas: readonly Cedula[],
): Promise<readonly ItemMural[]> {
  return Promise.all(
    cedulas.map(async (cedula) => ({
      recibo: await gerarRecibo(cedula),
      registradoEm: cedula.registradoEm,
    })),
  );
}
