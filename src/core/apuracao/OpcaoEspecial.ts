/**
 * Opções que aparecem na cédula sem pertencer a nenhuma chapa.
 * O branco é a recusa de escolher; o nulo é a cédula anulada. Os dois são
 * contados à parte e ficam fora da disputa.
 */
export const OpcaoEspecial = {
  BRANCO: 'BRANCO',
  NULO: 'NULO',
} as const;

export type OpcaoEspecial = (typeof OpcaoEspecial)[keyof typeof OpcaoEspecial];

/** Conteúdo de uma cédula: a sigla de uma chapa, ou BRANCO, ou NULO. */
export type Cedula = string;

/** Diz se a cédula é branca ou nula. */
export function ehOpcaoEspecial(cedula: Cedula): cedula is OpcaoEspecial {
  return cedula === OpcaoEspecial.BRANCO || cedula === OpcaoEspecial.NULO;
}
