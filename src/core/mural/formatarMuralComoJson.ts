import type { ItemMural } from './ItemMural.ts';

export function formatarMuralComoJson(mural: readonly ItemMural[]): string {
  return JSON.stringify(mural, null, 2);
}
