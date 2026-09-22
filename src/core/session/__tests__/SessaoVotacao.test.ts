import { describe, expect, it } from 'vitest';
import {
  type Cedula,
  CedulaDuplicadaError,
  OperacaoInvalidaError,
  SessaoNaoAbertaError,
  SessaoVotacao,
  StatusSessao,
  TransicaoInvalidaError,
} from '../index.ts';

describe('SessaoVotacao - Gerenciamento do ciclo de vida', () => {
  const criarSessaoExemplo = () =>
    new SessaoVotacao('sessao-ca-2026', 'Eleição Centro Acadêmico 2026');

  const criarCedula = (id = 'cedula-1', conteudo = 'CHAPA_1'): Cedula => ({
    id,
    conteudo,
    registradoEm: new Date(),
  });

  describe('Critério 1: Estado inicial', () => {
    it('deve sempre iniciar no estado EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      expect(sessao.status).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('deve inicializar com a urna vazia (zero cédulas)', () => {
      const sessao = criarSessaoExemplo();
      expect(sessao.totalCedulas).toBe(0);
      expect(sessao.cedulas).toEqual([]);
    });
  });

  describe('Critério 2: Transições sequenciais de estado', () => {
    it('deve permitir a transição sequencial completa: EmConfiguracao -> Agendada -> Aberta -> EmApuracao -> Concluida', () => {
      const sessao = criarSessaoExemplo();

      // EmConfiguracao -> Agendada
      sessao.agendar();
      expect(sessao.status).toBe(StatusSessao.AGENDADA);

      // Agendada -> Aberta
      sessao.abrir();
      expect(sessao.status).toBe(StatusSessao.ABERTA);

      // Aberta -> EmApuracao
      sessao.iniciarApuracao();
      expect(sessao.status).toBe(StatusSessao.EM_APURACAO);

      // EmApuracao -> Concluida
      sessao.encerrarApuracao();
      expect(sessao.status).toBe(StatusSessao.CONCLUIDA);
    });

    it('deve permitir retornar de Agendada para EmConfiguracao ao revisar configurações', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      expect(sessao.status).toBe(StatusSessao.AGENDADA);

      sessao.revisarConfiguracao();
      expect(sessao.status).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('deve lançar TransicaoInvalidaError ao tentar abrir diretamente a partir de EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      expect(() => {
        sessao.abrir();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('deve lançar TransicaoInvalidaError ao tentar iniciar apuração a partir de EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      expect(() => {
        sessao.iniciarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('deve lançar TransicaoInvalidaError ao tentar iniciar apuração a partir de Agendada', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      expect(() => {
        sessao.iniciarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.AGENDADA);
    });

    it('deve lançar TransicaoInvalidaError ao tentar agendar uma sessão que já está Aberta', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      expect(() => {
        sessao.agendar();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.ABERTA);
    });

    it('deve lançar TransicaoInvalidaError ao tentar revisar configurações de uma sessão que não está Agendada', () => {
      const sessao = criarSessaoExemplo();
      expect(() => {
        sessao.revisarConfiguracao();
      }).toThrow(TransicaoInvalidaError);
    });

    it('deve lançar TransicaoInvalidaError ao tentar encerrar apuração a partir de EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      expect(() => {
        sessao.encerrarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.EM_CONFIGURACAO);
    });

    it('deve lançar TransicaoInvalidaError ao tentar encerrar apuração a partir de Agendada', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      expect(() => {
        sessao.encerrarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.AGENDADA);
    });

    it('deve lançar TransicaoInvalidaError ao tentar encerrar apuração a partir de Aberta', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      expect(() => {
        sessao.encerrarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.ABERTA);
    });

    it('deve lançar TransicaoInvalidaError ao tentar encerrar apuração quando a sessão já está Concluida', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.iniciarApuracao();
      sessao.encerrarApuracao();

      expect(() => {
        sessao.encerrarApuracao();
      }).toThrow(TransicaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.CONCLUIDA);
    });
  });

  describe('Critério 3: Bloqueio de registro de votos fora do estado Aberta', () => {
    it('deve permitir registrar voto com sucesso quando a sessão estiver Aberta', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      const cedula = criarCedula('hash-123', 'CHAPA_A');
      sessao.registrarVoto(cedula);

      expect(sessao.totalCedulas).toBe(1);
      expect(sessao.cedulas[0].id).toBe('hash-123');
      expect(sessao.cedulas[0].conteudo).toBe('CHAPA_A');
    });

    it('deve lançar SessaoNaoAbertaError ao tentar registrar voto no estado EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      expect(() => {
        sessao.registrarVoto(criarCedula());
      }).toThrow(SessaoNaoAbertaError);
      expect(sessao.totalCedulas).toBe(0);
    });

    it('deve lançar SessaoNaoAbertaError ao tentar registrar voto no estado Agendada', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      expect(() => {
        sessao.registrarVoto(criarCedula());
      }).toThrow(SessaoNaoAbertaError);
      expect(sessao.totalCedulas).toBe(0);
    });

    it('deve lançar SessaoNaoAbertaError ao tentar registrar voto no estado EmApuracao', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.iniciarApuracao();

      expect(() => {
        sessao.registrarVoto(criarCedula());
      }).toThrow(SessaoNaoAbertaError);
    });

    it('deve lançar SessaoNaoAbertaError ao tentar registrar voto no estado Cancelada', () => {
      const sessao = criarSessaoExemplo();
      sessao.cancelar();

      expect(() => {
        sessao.registrarVoto(criarCedula());
      }).toThrow(SessaoNaoAbertaError);
    });

    it('deve lançar SessaoNaoAbertaError ao tentar registrar voto no estado Concluida', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.iniciarApuracao();
      sessao.encerrarApuracao();

      expect(() => {
        sessao.registrarVoto(criarCedula());
      }).toThrow(SessaoNaoAbertaError);
    });

    it('deve armazenar a cédula preservando a data de registro informada', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      const dataVoto = new Date('2026-10-01T10:00:00Z');
      sessao.registrarVoto({ id: 'voto-1', conteudo: 'CHAPA_1', registradoEm: dataVoto });

      expect(sessao.cedulas[0].registradoEm).toEqual(dataVoto);
    });

    it('deve manter integridade das cédulas retornadas evitando mutação direta externa', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.registrarVoto(criarCedula('c1', 'CHAPA_1'));

      const cedulasObtidas = sessao.cedulas as Cedula[];
      cedulasObtidas.push(criarCedula('c2_externa', 'CHAPA_2'));

      expect(sessao.totalCedulas).toBe(1);
    });
  });

  describe('Critério 4: Cancelamento da sessão e purga de cédulas em memória', () => {
    it('deve permitir cancelar a sessão a partir do estado EmConfiguracao', () => {
      const sessao = criarSessaoExemplo();
      sessao.cancelar();
      expect(sessao.status).toBe(StatusSessao.CANCELADA);
    });

    it('deve permitir cancelar a sessão a partir do estado Agendada', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.cancelar();
      expect(sessao.status).toBe(StatusSessao.CANCELADA);
    });

    it('deve alterar o status para Cancelada e limpar as cédulas em memória ao cancelar sessão Aberta', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      sessao.registrarVoto(criarCedula('v1', 'CHAPA_1'));
      sessao.registrarVoto(criarCedula('v2', 'CHAPA_2'));
      expect(sessao.totalCedulas).toBe(2);

      sessao.cancelar();

      expect(sessao.status).toBe(StatusSessao.CANCELADA);
      expect(sessao.totalCedulas).toBe(0);
      expect(sessao.cedulas).toEqual([]);
    });

    it('deve lançar OperacaoInvalidaError ao tentar cancelar uma sessão já cancelada', () => {
      const sessao = criarSessaoExemplo();
      sessao.cancelar();
      expect(() => {
        sessao.cancelar();
      }).toThrow(OperacaoInvalidaError);
    });

    it('deve lançar OperacaoInvalidaError ao tentar cancelar uma sessão que já está EmApuracao', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.iniciarApuracao();

      expect(() => {
        sessao.cancelar();
      }).toThrow(OperacaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.EM_APURACAO);
    });

    it('deve lançar OperacaoInvalidaError ao tentar cancelar uma sessão que já está Concluida', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();
      sessao.iniciarApuracao();
      sessao.encerrarApuracao();

      expect(() => {
        sessao.cancelar();
      }).toThrow(OperacaoInvalidaError);
      expect(sessao.status).toBe(StatusSessao.CONCLUIDA);
    });
  });

  describe('Prevenção de registro de cédulas duplicadas', () => {
    it('deve permitir registrar múltiplas cédulas com IDs distintos', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      sessao.registrarVoto(criarCedula('cedula-1', 'CHAPA_1'));
      sessao.registrarVoto(criarCedula('cedula-2', 'CHAPA_2'));
      sessao.registrarVoto(criarCedula('cedula-3', 'BRANCO'));

      expect(sessao.totalCedulas).toBe(3);
      expect(sessao.cedulas.map((c) => c.id)).toEqual(['cedula-1', 'cedula-2', 'cedula-3']);
    });

    it('deve lançar CedulaDuplicadaError ao tentar registrar cédula com id duplicado', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      sessao.registrarVoto(criarCedula('cedula-1', 'CHAPA_1'));

      expect(() => {
        sessao.registrarVoto(criarCedula('cedula-1', 'CHAPA_2'));
      }).toThrow(CedulaDuplicadaError);
    });

    it('não deve alterar a urna ao rejeitar uma cédula com id duplicado', () => {
      const sessao = criarSessaoExemplo();
      sessao.agendar();
      sessao.abrir();

      sessao.registrarVoto(criarCedula('cedula-1', 'CHAPA_1'));
      expect(sessao.totalCedulas).toBe(1);

      expect(() => {
        sessao.registrarVoto(criarCedula('cedula-1', 'OUTRA_CHAPA'));
      }).toThrow(CedulaDuplicadaError);

      expect(sessao.totalCedulas).toBe(1);
      expect(sessao.cedulas).toHaveLength(1);
      expect(sessao.cedulas[0].conteudo).toBe('CHAPA_1');
    });
  });
});
