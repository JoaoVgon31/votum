import type { ItemMural } from './ItemMural.ts';

/** Diz se o recibo pesquisado consta na lista oficial do mural. */
export function pesquisarNoMural(
  mural: readonly ItemMural[],
  recibo: string,
): boolean {
  return mural.some((item) => item.recibo === recibo);
}
