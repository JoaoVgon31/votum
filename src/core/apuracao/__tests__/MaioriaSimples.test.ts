import { describe, expect, it } from 'vitest';
import type { EstrategiaApuracao } from '../EstrategiaApuracao.ts';
import { MaioriaSimples } from '../MaioriaSimples.ts';

describe('MaioriaSimples - Particionamento em classes de equivalência do resultado', () => {
  describe('Classe: vencedor único', () => {
    it('[Classe: vencedor único] deve implementar o contrato EstrategiaApuracao (Strategy)', () => {
      const estrategia: EstrategiaApuracao = new MaioriaSimples();

      expect(
        estrategia.decidir([
          { chapa: 'A', votos: 3 },
          { chapa: 'B', votos: 1 },
        ]).vencedora,
      ).toBe('A');
    });

    it('[Classe: vencedor único] deve eleger a chapa com mais votos válidos', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 12 },
        { chapa: 'B', votos: 20 },
        { chapa: 'C', votos: 7 },
      ]);

      expect(decisao.vencedora).toBe('B');
      expect(decisao.empate).toBe(false);
      expect(decisao.chapasEmpatadas).toEqual([]);
    });

    it('[Classe: vencedor único] deve eleger por maioria simples, sem exigir metade mais um', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 40 },
        { chapa: 'B', votos: 35 },
        { chapa: 'C', votos: 25 },
      ]);

      expect(decisao.vencedora).toBe('A');
    });

    it('[Classe: vencedor único] deve eleger por diferença de um voto', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 51 },
        { chapa: 'B', votos: 50 },
      ]);

      expect(decisao.vencedora).toBe('A');
    });

    it('[Classe: vencedor único] deve eleger a chapa única que recebeu votos', () => {
      const decisao = new MaioriaSimples().decidir([{ chapa: 'A', votos: 4 }]);

      expect(decisao.vencedora).toBe('A');
      expect(decisao.empate).toBe(false);
    });
  });

  describe('Classe: empate entre duas chapas na primeira colocação', () => {
    it('[Classe: empate entre duas chapas] não deve eleger ninguém com duas chapas na frente com a mesma votação', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 10 },
        { chapa: 'B', votos: 10 },
        { chapa: 'C', votos: 2 },
      ]);

      expect(decisao.vencedora).toBeNull();
      expect(decisao.empate).toBe(true);
      expect(decisao.chapasEmpatadas).toEqual(['A', 'B']);
    });
  });

  describe('Classe: empate entre três ou mais chapas na primeira colocação', () => {
    it('[Classe: empate entre três ou mais chapas] não deve incluir as chapas fora da primeira colocação no empate', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 5 },
        { chapa: 'B', votos: 5 },
        { chapa: 'C', votos: 5 },
        { chapa: 'D', votos: 4 },
      ]);

      expect(decisao.vencedora).toBeNull();
      expect(decisao.empate).toBe(true);
      expect(decisao.chapasEmpatadas).toEqual(['A', 'B', 'C']);
    });
  });

  describe('Classe: nenhum voto válido (todas zeradas)', () => {
    it('[Classe: nenhum voto válido] não deve eleger ninguém quando nenhuma chapa recebeu voto válido', () => {
      const decisao = new MaioriaSimples().decidir([
        { chapa: 'A', votos: 0 },
        { chapa: 'B', votos: 0 },
      ]);

      expect(decisao.vencedora).toBeNull();
      expect(decisao.empate).toBe(true);
    });

    it('[Classe: nenhum voto válido] não deve eleger a chapa única que ficou sem nenhum voto', () => {
      const decisao = new MaioriaSimples().decidir([{ chapa: 'A', votos: 0 }]);

      expect(decisao.vencedora).toBeNull();
    });
  });
});
