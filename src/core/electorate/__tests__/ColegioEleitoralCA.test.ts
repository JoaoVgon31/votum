import { describe, expect, it } from 'vitest';
import { ColegioEleitoralCA } from '../ca/ColegioEleitoralCA';
import { EleitorInaptoError } from '../errors/ColegioEleitoralError';

describe('ColegioEleitoralCA - Importação do colégio eleitoral e validação de eleitores aptos', () => {
  const colegioEleitoralCAMock = ['202601', '202602', '202603'];

  describe('Critério 1: Importação do colégio eleitoral', () => {
    it('deve importar o colégio eleitoral do arquivo JSON versionado quando nenhum array for injetado', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA();
      expect(() => {
        colegioEleitoralCA.verificarAptidao('202608');
      }).not.toThrow();
    });

    it('deve importar o colégio eleitoral do array injetado quando fornecido', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA(colegioEleitoralCAMock);
      expect(() => {
        colegioEleitoralCA.verificarAptidao('202601');
      }).not.toThrow();
    });
  });

  describe('Critério 2: Validação de eleitores', () => {
    it('deve validar um eleitor cuja matrícula consta no colégio eleitoral', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA(colegioEleitoralCAMock);
      expect(() => {
        colegioEleitoralCA.verificarAptidao('202602');
      }).not.toThrow();
    });

    it('deve validar a matrícula ignorando espaços em branco', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA(colegioEleitoralCAMock);
      expect(() => {
        colegioEleitoralCA.verificarAptidao('  202602  ');
      }).not.toThrow();
    });

    it('deve lançar um erro quando a matrícula não consta no colégio eleitoral', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA(colegioEleitoralCAMock);
      expect(() => {
        colegioEleitoralCA.verificarAptidao('202604');
      }).toThrow(EleitorInaptoError);
    });

    it('deve adicionar o identificador na estrutura da exceção lançada quando a matrícula não consta no colégio eleitoral', () => {
      const colegioEleitoralCA = new ColegioEleitoralCA(colegioEleitoralCAMock);
      expect(() => {
        colegioEleitoralCA.verificarAptidao('202605');
      }).toThrow(
        expect.objectContaining({
          name: 'EleitorInaptoError',
          identificador: '202605',
        }),
      );
    });
  });
});
