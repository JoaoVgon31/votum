import { describe, expect, it } from 'vitest';
import { ColegioEleitoralCA } from '../../electorate/ca/ColegioEleitoralCA.ts';
import { EleitorInaptoError } from '../../electorate/errors/ColegioEleitoralError.ts';
import { StatusFinalSessao } from '../../quorum/StatusFinalSessao.ts';
import type { Cedula } from '../../session/Cedula.ts';
import { SessaoVotacao } from '../../session/SessaoVotacao.ts';
import { ProcessoEleitoral } from '../ProcessoEleitoral.ts';

describe('ProcessoEleitoral - Orquestração de Electorate e Session (Facade)', () => {
  const eleitoresAptos = ['202601', '202602', '202603'];

  const criarSessaoAberta = () => {
    const sessao = new SessaoVotacao(
      'sessao-ca-2026',
      'Eleição Centro Acadêmico 2026',
    );
    sessao.agendar();
    sessao.abrir();
    return sessao;
  };

  const votar = (
    sessao: SessaoVotacao,
    idPrefixo: string,
    votos: readonly string[],
  ) => {
    votos.forEach((conteudo, indice) => {
      const cedula: Cedula = {
        id: `${idPrefixo}-${String(indice)}`,
        conteudo,
        registradoEm: new Date(),
      };
      sessao.registrarVoto(cedula);
    });
  };

  describe('Critério 1: Registro de voto', () => {
    it('deve registrar o voto na sessão quando o eleitor está apto', () => {
      const processo = new ProcessoEleitoral(
        new ColegioEleitoralCA(eleitoresAptos),
      );
      const sessao = criarSessaoAberta();

      processo.registrarVoto(sessao, '202601', {
        id: 'cedula-1',
        conteudo: 'CHAPA_A',
        registradoEm: new Date(),
      });

      expect(sessao.totalCedulas).toBe(1);
      expect(sessao.cedulas[0].conteudo).toBe('CHAPA_A');
    });

    it('deve lançar EleitorInaptoError e não registrar o voto quando o eleitor não consta no colégio eleitoral', () => {
      const processo = new ProcessoEleitoral(
        new ColegioEleitoralCA(eleitoresAptos),
      );
      const sessao = criarSessaoAberta();

      expect(() => {
        processo.registrarVoto(sessao, '999999', {
          id: 'cedula-1',
          conteudo: 'CHAPA_A',
          registradoEm: new Date(),
        });
      }).toThrow(EleitorInaptoError);
      expect(sessao.totalCedulas).toBe(0);
    });
  });

  describe('Critério 2: Apuração do resultado', () => {
    it('deve declarar a sessão deserta e não eleger ninguém quando a participação fica abaixo do quórum mínimo', () => {
      const processo = new ProcessoEleitoral(
        new ColegioEleitoralCA(eleitoresAptos),
      );
      const sessao = criarSessaoAberta();
      votar(sessao, 'cedula', ['CHAPA_A']);

      const { resultadoQuorum, ata } = processo.apurarResultado(
        sessao,
        ['CHAPA_A', 'CHAPA_B'],
        100,
      );

      expect(resultadoQuorum.atingido).toBe(false);
      expect(ata.status).toBe(StatusFinalSessao.DESERTA);
      expect(ata.vencedor).toBeNull();
    });

    it('deve apurar a vencedora e declarar a sessão concluída quando o quórum é atingido', () => {
      const processo = new ProcessoEleitoral(
        new ColegioEleitoralCA(eleitoresAptos),
      );
      const sessao = criarSessaoAberta();
      votar(sessao, 'cedula', ['CHAPA_A', 'CHAPA_A', 'CHAPA_B']);

      const { resultadoQuorum, ata } = processo.apurarResultado(
        sessao,
        ['CHAPA_A', 'CHAPA_B'],
        10,
      );

      expect(resultadoQuorum.atingido).toBe(true);
      expect(ata.status).toBe(StatusFinalSessao.CONCLUIDA);
      expect(ata.vencedor).toBe('CHAPA_A');
      expect(ata.totalVotos).toBe(3);
    });

    it('deve retornar vencedor nulo quando há empate na apuração mesmo com o quórum atingido', () => {
      const processo = new ProcessoEleitoral(
        new ColegioEleitoralCA(eleitoresAptos),
      );
      const sessao = criarSessaoAberta();
      votar(sessao, 'cedula', ['CHAPA_A', 'CHAPA_B']);

      const { resultadoQuorum, ata } = processo.apurarResultado(
        sessao,
        ['CHAPA_A', 'CHAPA_B'],
        10,
      );

      expect(resultadoQuorum.atingido).toBe(true);
      expect(ata.status).toBe(StatusFinalSessao.CONCLUIDA);
      expect(ata.vencedor).toBeNull();
    });
  });
});
