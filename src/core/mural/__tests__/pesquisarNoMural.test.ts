import { describe, expect, it } from 'vitest';
import type { ItemMural } from '../ItemMural.ts';
import { pesquisarNoMural } from '../pesquisarNoMural.ts';

describe('pesquisarNoMural', () => {
  const criarMural = (): readonly ItemMural[] => [
    { recibo: 'hash-1', registradoEm: new Date() },
    { recibo: 'hash-2', registradoEm: new Date() },
  ];

  it('retorna true quando o recibo pesquisado consta na lista oficial', () => {
    expect(pesquisarNoMural(criarMural(), 'hash-2')).toBe(true);
  });

  it('retorna false quando o recibo pesquisado não consta na lista oficial', () => {
    expect(pesquisarNoMural(criarMural(), 'hash-inexistente')).toBe(false);
  });
});
