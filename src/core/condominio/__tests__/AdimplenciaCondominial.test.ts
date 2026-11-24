import { describe, expect, it } from 'vitest';
import {
  CadastroCondominio,
  ModoAcessoPauta,
  OpcaoVotoCondominio,
  PautaCondominial,
  UnidadeInadimplenteError,
  type UnidadeCondominial,
} from '../index.ts';

describe('Bloqueio Automático de Inadimplência na Assembleia (História 2.2)', () => {
  const criarUnidades = (): UnidadeCondominial[] => [
    {
      id: 'A-101',
      numero: '101',
      bloco: 'A',
      proprietarioId: 'prop-adimplente',
      nomeTitular: 'Ana Silva',
      fracaoIdeal: 25,
      adimplente: true,
    },
    {
      id: 'A-102',
      numero: '102',
      bloco: 'A',
      proprietarioId: 'prop-inadimplente',
      nomeTitular: 'Bruno Costa',
      fracaoIdeal: 25,
      adimplente: false,
    },
    {
      id: 'B-201',
      numero: '201',
      bloco: 'B',
      proprietarioId: 'prop-misto',
      nomeTitular: 'Carla Souza',
      fracaoIdeal: 25,
      adimplente: true,
    },
    {
      id: 'B-202',
      numero: '202',
      bloco: 'B',
      proprietarioId: 'prop-misto',
      nomeTitular: 'Carla Souza',
      fracaoIdeal: 25,
      adimplente: false,
    },
  ];

  describe('Critério 1: Validação de adimplência ao acessar a pauta', () => {
    it('deve liberar acesso como Votante para unidade adimplente sem exibir aviso restritivo', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const acesso = pauta.acessarPautaUnidade('A-101');

      expect(acesso.podeVotar).toBe(true);
      expect(acesso.modoAcesso).toBe(ModoAcessoPauta.VOTANTE);
      expect(acesso.aviso).toBeNull();
      expect(acesso.unidadesAptas.map((u) => u.id)).toEqual(['A-101']);
      expect(acesso.unidadesInadimplentes).toEqual([]);
    });

    it('deve validar todas as unidades vinculadas ao proprietário ao acessar a pauta', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const acessoMisto = pauta.acessarPautaProprietario('prop-misto');

      expect(acessoMisto.podeVotar).toBe(true);
      expect(acessoMisto.modoAcesso).toBe(ModoAcessoPauta.VOTANTE);
      expect(acessoMisto.unidadesAptas.map((u) => u.id)).toEqual(['B-201']);
      expect(acessoMisto.unidadesInadimplentes.map((u) => u.id)).toEqual([
        'B-202',
      ]);
      expect(acessoMisto.aviso).toContain('B-202');
      expect(acessoMisto.aviso).toContain('ouvintes');
    });
  });

  describe('Critério 2: Restrição à votação e acesso apenas como ouvinte com aviso explicativo', () => {
    it('deve restringir unidade inadimplente ao modo Ouvinte com aviso explicativo', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const acesso = pauta.acessarPautaUnidade('A-102');

      expect(acesso.podeVotar).toBe(false);
      expect(acesso.modoAcesso).toBe(ModoAcessoPauta.OUVINTE);
      expect(acesso.aviso).toContain('A-102');
      expect(acesso.aviso).toContain('pendências financeiras');
      expect(acesso.aviso).toContain('ouvinte');
      expect(acesso.unidadesAptas).toEqual([]);
      expect(acesso.unidadesInadimplentes.map((u) => u.id)).toEqual(['A-102']);
    });

    it('deve restringir proprietário com todas as unidades inadimplentes ao modo Ouvinte', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      const acesso = pauta.acessarPautaProprietario('prop-inadimplente');

      expect(acesso.podeVotar).toBe(false);
      expect(acesso.modoAcesso).toBe(ModoAcessoPauta.OUVINTE);
      expect(acesso.aviso).toContain('A-102');
      expect(acesso.aviso).toContain('ouvinte');
    });

    it('deve impedir abertura de cédula e registro de voto por unidade inadimplente', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      expect(() => pauta.abrirCedulaUnidade('A-102')).toThrow(
        UnidadeInadimplenteError,
      );
      expect(() =>
        pauta.registrarVotoUnidade('A-102', OpcaoVotoCondominio.FAVORAVEL),
      ).toThrow(UnidadeInadimplenteError);
    });

    it('deve impedir voto em bloco quando o proprietário possui unidade inadimplente', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      expect(() =>
        pauta.registrarVotoEmBloco('prop-misto', OpcaoVotoCondominio.FAVORAVEL),
      ).toThrow(UnidadeInadimplenteError);
    });
  });

  describe('Critério 3: Atualização manual do status de adimplência pelo administrador', () => {
    it('deve permitir ao administrador regularizar manualmente uma unidade inadimplente e liberar seu voto', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      expect(pauta.acessarPautaUnidade('A-102').podeVotar).toBe(false);

      const unidadeAtualizada = pauta.atualizarAdimplenciaUnidade(
        'A-102',
        true,
      );

      expect(unidadeAtualizada.adimplente).toBe(true);
      const novoAcesso = pauta.acessarPautaUnidade('A-102');
      expect(novoAcesso.podeVotar).toBe(true);
      expect(novoAcesso.modoAcesso).toBe(ModoAcessoPauta.VOTANTE);
      expect(novoAcesso.aviso).toBeNull();

      const voto = pauta.registrarVotoUnidade(
        'A-102',
        OpcaoVotoCondominio.FAVORAVEL,
      );
      expect(voto.pesoFracaoIdeal).toBe(25);
    });

    it('deve permitir ao administrador marcar uma unidade como inadimplente manualmente e bloquear seu voto', () => {
      const cadastro = new CadastroCondominio(criarUnidades());
      const pauta = new PautaCondominial(
        'pauta-1',
        'Aprovação das contas',
        cadastro,
      );

      pauta.atualizarAdimplenciaUnidade('A-101', false);

      const acesso = pauta.acessarPautaUnidade('A-101');
      expect(acesso.podeVotar).toBe(false);
      expect(acesso.modoAcesso).toBe(ModoAcessoPauta.OUVINTE);
      expect(() =>
        pauta.registrarVotoUnidade('A-101', OpcaoVotoCondominio.FAVORAVEL),
      ).toThrow(UnidadeInadimplenteError);
    });
  });
});
