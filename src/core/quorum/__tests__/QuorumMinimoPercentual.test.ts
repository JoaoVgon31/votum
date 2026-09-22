import { describe, expect, it } from 'vitest';
import type { EstrategiaQuorum } from '../EstrategiaQuorum.ts';
import { ParametrosQuorumInvalidosError } from '../errors/QuorumError.ts';
import {
  PERCENTUAL_MINIMO_CENTRO_ACADEMICO,
  QuorumMinimoPercentual,
} from '../QuorumMinimoPercentual.ts';

describe('QuorumMinimoPercentual - Estratégia de quórum mínimo', () => {
  describe('Regra padrão de 20% (Centro Acadêmico)', () => {
    it('deve exigir 20% por padrão', () => {
      const resultado = new QuorumMinimoPercentual().verificar(50, 100);

      expect(PERCENTUAL_MINIMO_CENTRO_ACADEMICO).toBe(20);
      expect(resultado.percentualMinimo).toBe(20);
    });

    it('deve implementar o contrato EstrategiaQuorum (Strategy)', () => {
      const estrategia: EstrategiaQuorum = new QuorumMinimoPercentual();

      expect(estrategia.verificar(30, 100).atingido).toBe(true);
    });

    it('não deve atingir o quórum com participação abaixo de 20% (19 de 100)', () => {
      const resultado = new QuorumMinimoPercentual().verificar(19, 100);

      expect(resultado.atingido).toBe(false);
      expect(resultado.participacao).toBeCloseTo(19);
    });

    it('deve atingir o quórum com participação exatamente igual a 20% (20 de 100)', () => {
      const resultado = new QuorumMinimoPercentual().verificar(20, 100);

      expect(resultado.atingido).toBe(true);
      expect(resultado.participacao).toBeCloseTo(20);
    });

    it('deve atingir o quórum com participação acima de 20% (21 de 100)', () => {
      const resultado = new QuorumMinimoPercentual().verificar(21, 100);

      expect(resultado.atingido).toBe(true);
    });

    it('deve tratar corretamente o limite em turmas pequenas (1 de 5 = 20%)', () => {
      expect(new QuorumMinimoPercentual().verificar(1, 5).atingido).toBe(true);
    });

    it('deve tratar corretamente o limite com divisões não exatas (3 de 15 = 20%)', () => {
      expect(new QuorumMinimoPercentual().verificar(3, 15).atingido).toBe(true);
    });

    it('não deve atingir o quórum quando falta um voto para os 20% (1 de 6 ≈ 16,7%)', () => {
      const resultado = new QuorumMinimoPercentual().verificar(1, 6);

      expect(resultado.atingido).toBe(false);
      expect(resultado.participacao).toBeCloseTo(16.67, 1);
    });

    it('não deve atingir o quórum sem nenhuma presença', () => {
      const resultado = new QuorumMinimoPercentual().verificar(0, 100);

      expect(resultado.atingido).toBe(false);
      expect(resultado.participacao).toBe(0);
    });

    it('deve atingir o quórum com participação total', () => {
      const resultado = new QuorumMinimoPercentual().verificar(100, 100);

      expect(resultado.atingido).toBe(true);
      expect(resultado.participacao).toBe(100);
    });
  });

  describe('Percentual configurável', () => {
    it('deve respeitar um percentual mínimo personalizado (50%)', () => {
      const estrategia = new QuorumMinimoPercentual(50);

      expect(estrategia.verificar(49, 100).atingido).toBe(false);
      expect(estrategia.verificar(50, 100).atingido).toBe(true);
    });

    it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])(
      'deve rejeitar percentual mínimo inválido (%s)',
      (percentual) => {
        expect(() => new QuorumMinimoPercentual(percentual)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      },
    );
  });

  describe('Validação dos parâmetros', () => {
    it.each([0, -10, 1.5])(
      'deve rejeitar total de eleitores inválido (%s)',
      (total) => {
        expect(() => new QuorumMinimoPercentual().verificar(0, total)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      },
    );

    it.each([-1, 2.5])(
      'deve rejeitar total de presenças inválido (%s)',
      (presencas) => {
        expect(() =>
          new QuorumMinimoPercentual().verificar(presencas, 100),
        ).toThrow(ParametrosQuorumInvalidosError);
      },
    );

    it('deve rejeitar presenças maiores que o total de eleitores', () => {
      expect(() => new QuorumMinimoPercentual().verificar(101, 100)).toThrow(
        ParametrosQuorumInvalidosError,
      );
    });
  });
});
