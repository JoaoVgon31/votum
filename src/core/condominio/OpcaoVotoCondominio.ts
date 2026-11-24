/**
 * Opções de deliberação para pautas de assembleia condominial.
 */
export const OpcaoVotoCondominio = {
  FAVORAVEL: 'Favoravel',
  CONTRARIO: 'Contrario',
  ABSTENCAO: 'Abstencao',
} as const;

export type OpcaoVotoCondominio =
  (typeof OpcaoVotoCondominio)[keyof typeof OpcaoVotoCondominio];

export function ehOpcaoVotoCondominio(
  valor: string,
): valor is OpcaoVotoCondominio {
  return (
    valor === OpcaoVotoCondominio.FAVORAVEL ||
    valor === OpcaoVotoCondominio.CONTRARIO ||
    valor === OpcaoVotoCondominio.ABSTENCAO
  );
}
