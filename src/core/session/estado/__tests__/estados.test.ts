import { describe, expect, it } from 'vitest';
import {
  OperacaoInvalidaError,
  SessaoNaoAbertaError,
  TransicaoInvalidaError,
} from '../../errors/SessaoError.ts';
import { StatusSessao } from '../../StatusSessao.ts';
import { criarEstado } from '../estados.ts';

describe('Estados de SessaoVotacao (State)', () => {
  describe('criarEstado', () => {
    it.each([
      StatusSessao.EM_CONFIGURACAO,
      StatusSessao.AGENDADA,
      StatusSessao.ABERTA,
      StatusSessao.EM_APURACAO,
      StatusSessao.CONCLUIDA,
      StatusSessao.CANCELADA,
    ])('cria um estado cujo status é %s', (status) => {
      expect(criarEstado(status).status).toBe(status);
    });
  });

  describe('EmConfiguracao', () => {
    const estado = () => criarEstado(StatusSessao.EM_CONFIGURACAO);

    it('permite agendar, indo para Agendada', () => {
      expect(estado().agendar()).toBe(StatusSessao.AGENDADA);
    });

    it('permite cancelar, indo para Cancelada', () => {
      expect(estado().cancelar()).toBe(StatusSessao.CANCELADA);
    });

    it('não permite abrir diretamente', () => {
      expect(() => estado().abrir()).toThrow(TransicaoInvalidaError);
    });

    it('não permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).toThrow(SessaoNaoAbertaError);
    });
  });

  describe('Agendada', () => {
    const estado = () => criarEstado(StatusSessao.AGENDADA);

    it('permite revisar configuração, voltando para EmConfiguracao', () => {
      expect(estado().revisarConfiguracao()).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('permite abrir, indo para Aberta', () => {
      expect(estado().abrir()).toBe(StatusSessao.ABERTA);
    });

    it('permite cancelar, indo para Cancelada', () => {
      expect(estado().cancelar()).toBe(StatusSessao.CANCELADA);
    });

    it('não permite iniciar apuração diretamente', () => {
      expect(() => estado().iniciarApuracao()).toThrow(TransicaoInvalidaError);
    });

    it('não permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).toThrow(SessaoNaoAbertaError);
    });
  });

  describe('Aberta', () => {
    const estado = () => criarEstado(StatusSessao.ABERTA);

    it('permite iniciar apuração, indo para EmApuracao', () => {
      expect(estado().iniciarApuracao()).toBe(StatusSessao.EM_APURACAO);
    });

    it('permite cancelar, indo para Cancelada', () => {
      expect(estado().cancelar()).toBe(StatusSessao.CANCELADA);
    });

    it('permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).not.toThrow();
    });

    it('não permite agendar novamente', () => {
      expect(() => estado().agendar()).toThrow(TransicaoInvalidaError);
    });
  });

  describe('EmApuracao', () => {
    const estado = () => criarEstado(StatusSessao.EM_APURACAO);

    it('permite encerrar apuração, indo para Concluida', () => {
      expect(estado().encerrarApuracao()).toBe(StatusSessao.CONCLUIDA);
    });

    it('não permite cancelar', () => {
      expect(() => estado().cancelar()).toThrow(OperacaoInvalidaError);
    });

    it('não permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).toThrow(SessaoNaoAbertaError);
    });
  });

  describe('Concluida', () => {
    const estado = () => criarEstado(StatusSessao.CONCLUIDA);

    it('não permite cancelar', () => {
      expect(() => estado().cancelar()).toThrow(OperacaoInvalidaError);
    });

    it('não permite encerrar apuração novamente', () => {
      expect(() => estado().encerrarApuracao()).toThrow(TransicaoInvalidaError);
    });

    it('não permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).toThrow(SessaoNaoAbertaError);
    });
  });

  describe('Cancelada', () => {
    const estado = () => criarEstado(StatusSessao.CANCELADA);

    it('não permite cancelar novamente', () => {
      expect(() => estado().cancelar()).toThrow(OperacaoInvalidaError);
    });

    it('não permite registrar voto', () => {
      expect(() => {
        estado().garantirRegistroPermitido();
      }).toThrow(SessaoNaoAbertaError);
    });
  });
});
