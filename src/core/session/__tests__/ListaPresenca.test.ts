import { describe, expect, it } from 'vitest';
import { EleitorJaVotouError, ListaPresenca } from '../index.ts';

describe('ListaPresenca - Rastreio de presença desvinculado da cédula', () => {
  describe('Estado inicial', () => {
    it('deve inicializar vazia, com total igual a zero', () => {
      const lista = new ListaPresenca();
      expect(lista.total).toBe(0);
    });

    it('não deve conter nenhum eleitor ao inicializar', () => {
      const lista = new ListaPresenca();
      expect(lista.contem('202601')).toBe(false);
    });
  });

  describe('Registro de presença', () => {
    it('deve registrar a presença de um eleitor e incrementar o total', () => {
      const lista = new ListaPresenca();

      lista.registrar('202601');

      expect(lista.total).toBe(1);
      expect(lista.contem('202601')).toBe(true);
    });

    it('deve registrar múltiplos eleitores distintos mantendo o total correto', () => {
      const lista = new ListaPresenca();

      lista.registrar('202601');
      lista.registrar('202602');
      lista.registrar('202603');

      expect(lista.total).toBe(3);
    });
  });

  describe('Rejeição de presença duplicada', () => {
    it('deve lançar EleitorJaVotouError ao tentar registrar o mesmo eleitor duas vezes', () => {
      const lista = new ListaPresenca();
      lista.registrar('202601');

      expect(() => {
        lista.registrar('202601');
      }).toThrow(EleitorJaVotouError);
    });

    it('deve conter o identificador do eleitor na estrutura do erro lançado', () => {
      const lista = new ListaPresenca();
      lista.registrar('202601');

      expect(() => {
        lista.registrar('202601');
      }).toThrow(
        expect.objectContaining({
          name: 'EleitorJaVotouError',
          identificadorEleitor: '202601',
        }),
      );
    });

    it('não deve alterar o total após tentativa de presença duplicada', () => {
      const lista = new ListaPresenca();
      lista.registrar('202601');

      expect(() => {
        lista.registrar('202601');
      }).toThrow(EleitorJaVotouError);

      expect(lista.total).toBe(1);
    });
  });

  describe('Esvaziamento da lista', () => {
    it('deve descartar todas as presenças ao esvaziar', () => {
      const lista = new ListaPresenca();
      lista.registrar('202601');
      lista.registrar('202602');
      expect(lista.total).toBe(2);

      lista.esvaziar();

      expect(lista.total).toBe(0);
      expect(lista.contem('202601')).toBe(false);
    });

    it('deve permitir registrar novamente um eleitor depois de esvaziar a lista', () => {
      const lista = new ListaPresenca();
      lista.registrar('202601');
      lista.esvaziar();

      expect(() => {
        lista.registrar('202601');
      }).not.toThrow();
      expect(lista.contem('202601')).toBe(true);
    });
  });
});
