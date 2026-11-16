import { describe, expect, it } from 'vitest';
import type { EstrategiaQuorum } from '../EstrategiaQuorum.ts';
import { ParametrosQuorumInvalidosError } from '../errors/QuorumError.ts';
import {
  PERCENTUAL_MINIMO_CENTRO_ACADEMICO,
  QuorumMinimoPercentual,
} from '../QuorumMinimoPercentual.ts';

describe('QuorumMinimoPercentual - Estratégia de quórum mínimo', () => {
  it('deve implementar o contrato EstrategiaQuorum (Strategy)', () => {
    const estrategia: EstrategiaQuorum = new QuorumMinimoPercentual();

    expect(estrategia.verificar(30, 100).atingido).toBe(true);
  });

  // Particionamento em Classes de Equivalência.
  //
  // Cada bloco cobre uma entrada do sistema e separa suas classes válidas das
  // inválidas. Os representantes escolhidos ficam deliberadamente longe dos
  // limites (ex.: 50 de 100, bem acima/abaixo de 20%) porque os valores nos
  // limites já são o objeto da Análise de Valor Limite, mais abaixo — assim
  // as duas técnicas não testam exatamente os mesmos pontos.
  describe('Particionamento em Classes de Equivalência', () => {
    describe('Classes de equivalência de percentualMinimo (parâmetro do construtor)', () => {
      it('[Classe válida: percentual padrão] deve aplicar 20% quando nenhum percentual é informado', () => {
        const resultado = new QuorumMinimoPercentual().verificar(50, 100);

        expect(PERCENTUAL_MINIMO_CENTRO_ACADEMICO).toBe(20);
        expect(resultado.percentualMinimo).toBe(20);
      });

      it('[Classe válida: percentual customizado dentro da faixa 0 a 100] deve aplicar o percentual informado', () => {
        const estrategia = new QuorumMinimoPercentual(50);

        expect(estrategia.verificar(70, 100).percentualMinimo).toBe(50);
      });

      it.each([-10, -1])(
        '[Classe inválida: percentual abaixo do intervalo] deve rejeitar percentual mínimo %s',
        (percentual) => {
          expect(() => new QuorumMinimoPercentual(percentual)).toThrow(
            ParametrosQuorumInvalidosError,
          );
        },
      );

      it.each([101, 150])(
        '[Classe inválida: percentual acima do intervalo] deve rejeitar percentual mínimo %s',
        (percentual) => {
          expect(() => new QuorumMinimoPercentual(percentual)).toThrow(
            ParametrosQuorumInvalidosError,
          );
        },
      );

      it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        '[Classe inválida: percentual não finito] deve rejeitar percentual mínimo %s',
        (percentual) => {
          expect(() => new QuorumMinimoPercentual(percentual)).toThrow(
            ParametrosQuorumInvalidosError,
          );
        },
      );
    });

    describe('Classes de equivalência de totalEleitores (parâmetro de verificar)', () => {
      it('[Classe válida: totalEleitores inteiro positivo] deve calcular o quórum normalmente', () => {
        expect(new QuorumMinimoPercentual().verificar(5, 50).atingido).toBe(
          false,
        );
      });

      it.each([0, -10])(
        '[Classe inválida: totalEleitores zero ou negativo] deve rejeitar totalEleitores %s',
        (totalEleitores) => {
          expect(() =>
            new QuorumMinimoPercentual().verificar(0, totalEleitores),
          ).toThrow(ParametrosQuorumInvalidosError);
        },
      );

      it('[Classe inválida: totalEleitores não inteiro] deve rejeitar totalEleitores fracionário', () => {
        expect(() => new QuorumMinimoPercentual().verificar(0, 1.5)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      });
    });

    describe('Classes de equivalência de totalPresencas (parâmetro de verificar)', () => {
      it('[Classe válida: totalPresencas entre zero e o total de eleitores] deve calcular o quórum normalmente', () => {
        expect(new QuorumMinimoPercentual().verificar(10, 100).atingido).toBe(
          false,
        );
      });

      it('[Classe inválida: totalPresencas negativo] deve rejeitar totalPresencas negativo', () => {
        expect(() => new QuorumMinimoPercentual().verificar(-1, 100)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      });

      it('[Classe inválida: totalPresencas não inteiro] deve rejeitar totalPresencas fracionário', () => {
        expect(() => new QuorumMinimoPercentual().verificar(2.5, 100)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      });

      it('[Classe inválida: totalPresencas maior que totalEleitores] deve rejeitar totalPresencas acima do total de eleitores', () => {
        expect(() => new QuorumMinimoPercentual().verificar(101, 100)).toThrow(
          ParametrosQuorumInvalidosError,
        );
      });
    });

    describe('Classes de equivalência do resultado de verificar (atingido / não atingido)', () => {
      it('[Classe: participação claramente abaixo do mínimo] não deve atingir o quórum', () => {
        const resultado = new QuorumMinimoPercentual().verificar(5, 100);

        expect(resultado.atingido).toBe(false);
      });

      it('[Classe: participação claramente acima do mínimo] deve atingir o quórum', () => {
        const resultado = new QuorumMinimoPercentual().verificar(80, 100);

        expect(resultado.atingido).toBe(true);
      });
    });
  });

  // Análise de Valor Limite (BVA), aplicada ao percentual mínimo exigido —
  // o limite de domínio mais relevante da regra de quórum.
  //
  // São exercitados três grupos de limites:
  //  1) o limite em si (20% padrão), testando limite-1, limite e limite+1;
  //  2) os extremos do domínio de participação (0% e 100% dos eleitores);
  //  3) os extremos do próprio domínio do percentual mínimo configurável
  //     (0% e 100%), que antes só tinham seus vizinhos inválidos testados.
  describe('Análise de Valor Limite', () => {
    describe('Limite da regra padrão do Centro Acadêmico (20%)', () => {
      it('não atinge o quórum um voto abaixo do limite (19 de 100)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(19, 100);

        expect(resultado.atingido).toBe(false);
        expect(resultado.participacao).toBeCloseTo(19);
      });

      it('atinge o quórum exatamente no limite (20 de 100)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(20, 100);

        expect(resultado.atingido).toBe(true);
        expect(resultado.participacao).toBeCloseTo(20);
      });

      it('atinge o quórum um voto acima do limite (21 de 100)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(21, 100);

        expect(resultado.atingido).toBe(true);
      });

      it('trata corretamente o limite em turmas pequenas (1 de 5 = 20%)', () => {
        expect(new QuorumMinimoPercentual().verificar(1, 5).atingido).toBe(
          true,
        );
      });

      it('trata corretamente o limite com divisões não exatas (3 de 15 = 20%)', () => {
        expect(new QuorumMinimoPercentual().verificar(3, 15).atingido).toBe(
          true,
        );
      });

      it('não atinge o quórum quando falta um voto para os 20% (1 de 6 ≈ 16,7%)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(1, 6);

        expect(resultado.atingido).toBe(false);
        expect(resultado.participacao).toBeCloseTo(16.67, 1);
      });
    });

    describe('Extremos do domínio de participação (0% e 100% dos eleitores)', () => {
      it('não atinge o quórum sem nenhuma presença (extremo inferior)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(0, 100);

        expect(resultado.atingido).toBe(false);
        expect(resultado.participacao).toBe(0);
      });

      it('atinge o quórum com participação total (extremo superior)', () => {
        const resultado = new QuorumMinimoPercentual().verificar(100, 100);

        expect(resultado.atingido).toBe(true);
        expect(resultado.participacao).toBe(100);
      });
    });

    describe('Extremos do domínio do percentual mínimo configurável (0% e 100%)', () => {
      it('percentual mínimo de 0% é aceito e sempre atinge o quórum, mesmo sem presenças', () => {
        const estrategia = new QuorumMinimoPercentual(0);

        expect(estrategia.verificar(0, 100).atingido).toBe(true);
      });

      it('percentual mínimo de 100% é aceito e só atinge o quórum com participação total', () => {
        const estrategia = new QuorumMinimoPercentual(100);

        expect(estrategia.verificar(99, 100).atingido).toBe(false);
        expect(estrategia.verificar(100, 100).atingido).toBe(true);
      });
    });

    describe('Extremo inferior do domínio de totalEleitores (menor turma possível: 1 eleitor)', () => {
      it('não atinge o quórum com o único eleitor ausente', () => {
        const resultado = new QuorumMinimoPercentual().verificar(0, 1);

        expect(resultado.atingido).toBe(false);
        expect(resultado.participacao).toBe(0);
      });

      it('atinge o quórum com o único eleitor presente', () => {
        const resultado = new QuorumMinimoPercentual().verificar(1, 1);

        expect(resultado.atingido).toBe(true);
        expect(resultado.participacao).toBe(100);
      });
    });
  });
});
