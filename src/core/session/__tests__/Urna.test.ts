import { describe, expect, it } from 'vitest';
import { type Cedula, CedulaDuplicadaError, Urna } from '../index.ts';

describe('Urna - Armazenamento e integridade de cédulas', () => {
  const criarCedula = (id = 'cedula-1', conteudo = 'CHAPA_1'): Cedula => ({
    id,
    conteudo,
    registradoEm: new Date('2026-10-25T12:00:00Z'),
  });

  describe('Estado inicial', () => {
    it('deve inicializar vazia, com total igual a zero', () => {
      const urna = new Urna();
      expect(urna.total).toBe(0);
    });

    it('deve retornar lista vazia de cédulas ao inicializar', () => {
      const urna = new Urna();
      expect(urna.listar()).toEqual([]);
    });
  });

  describe('Registro de cédulas', () => {
    it('deve registrar uma cédula com sucesso e incrementar o total', () => {
      const urna = new Urna();
      const cedula = criarCedula('cedula-1', 'CHAPA_A');

      urna.registrar(cedula);

      expect(urna.total).toBe(1);
      expect(urna.listar()).toHaveLength(1);
      expect(urna.listar()[0]).toEqual(cedula);
    });

    it('deve registrar múltiplas cédulas com IDs distintos mantendo o total correto', () => {
      const urna = new Urna();
      const cedula1 = criarCedula('cedula-1', 'CHAPA_A');
      const cedula2 = criarCedula('cedula-2', 'CHAPA_B');
      const cedula3 = criarCedula('cedula-3', 'BRANCO');

      urna.registrar(cedula1);
      urna.registrar(cedula2);
      urna.registrar(cedula3);

      expect(urna.total).toBe(3);
      expect(urna.listar()).toEqual([cedula1, cedula2, cedula3]);
    });

    it('deve armazenar uma cópia defensiva da cédula para evitar mutação externa', () => {
      const urna = new Urna();
      const cedulaOriginal: Cedula = {
        id: 'cedula-mutavel',
        conteudo: 'CHAPA_ORIGINAL',
        registradoEm: new Date('2026-10-25T10:00:00Z'),
      };

      urna.registrar(cedulaOriginal);

      // Mutação posterior no objeto original
      cedulaOriginal.conteudo = 'CHAPA_MODIFICADA';

      const cedulasRegistradas = urna.listar();
      expect(cedulasRegistradas[0].conteudo).toBe('CHAPA_ORIGINAL');
    });
  });

  describe('Unicidade e rejeição de duplicatas', () => {
    it('deve lançar CedulaDuplicadaError ao tentar registrar cédula com ID duplicado', () => {
      const urna = new Urna();
      const cedula1 = criarCedula('id-repetido', 'CHAPA_A');
      const cedula2 = criarCedula('id-repetido', 'CHAPA_B');

      urna.registrar(cedula1);

      expect(() => {
        urna.registrar(cedula2);
      }).toThrow(CedulaDuplicadaError);
    });

    it('deve conter o ID da cédula duplicada na mensagem de erro', () => {
      const urna = new Urna();
      const cedula1 = criarCedula('cedula-999', 'CHAPA_1');
      const cedula2 = criarCedula('cedula-999', 'CHAPA_2');

      urna.registrar(cedula1);

      expect(() => {
        urna.registrar(cedula2);
      }).toThrow('cedula-999');
    });

    it('não deve alterar a contagem total nem o conteúdo da urna após tentativa de voto duplicado', () => {
      const urna = new Urna();
      const cedula1 = criarCedula('id-1', 'CHAPA_1');
      const cedula2 = criarCedula('id-1', 'CHAPA_2');

      urna.registrar(cedula1);

      expect(() => {
        urna.registrar(cedula2);
      }).toThrow(CedulaDuplicadaError);

      expect(urna.total).toBe(1);
      expect(urna.listar()).toEqual([cedula1]);
    });
  });

  describe('Esvaziamento da urna', () => {
    it('deve descartar todas as cédulas ao esvaziar', () => {
      const urna = new Urna();
      urna.registrar(criarCedula('c-1'));
      urna.registrar(criarCedula('c-2'));
      expect(urna.total).toBe(2);

      urna.esvaziar();

      expect(urna.total).toBe(0);
      expect(urna.listar()).toEqual([]);
    });

    it('deve permitir chamar esvaziar em uma urna que já está vazia sem lançar erros', () => {
      const urna = new Urna();
      expect(() => {
        urna.esvaziar();
      }).not.toThrow();
      expect(urna.total).toBe(0);
      expect(urna.listar()).toEqual([]);
    });
  });
});
