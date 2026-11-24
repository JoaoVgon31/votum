export {
  type AtaAssembleiaCondominial,
  type DadosAtaAssembleia,
  formatarAtaAssembleiaComoJson,
  formatarAtaAssembleiaComoTexto,
  gerarAtaAssembleia,
  type RegistroVotoNominalAta,
  type ResultadoPautaAta,
} from './AtaAssembleiaCondominial.ts';
export {
  CondominioError,
  ParametrosCondominioInvalidosError,
  PautaEncerradaError,
  PautaNaoEncerradaParaAtaError,
  ProprietarioSemUnidadesError,
  UnidadeInadimplenteError,
  UnidadeJaVotouError,
  UnidadeNaoEncontradaError,
} from './errors/CondominioError.ts';
export {
  ehOpcaoVotoCondominio,
  OpcaoVotoCondominio,
} from './OpcaoVotoCondominio.ts';
export {
  type AcessoPautaCondominial,
  ModoAcessoPauta,
  PautaCondominial,
  type ResultadoPonderadoPauta,
  type VotoUnidadeCondominial,
} from './PautaCondominial.ts';
export {
  arredondarFracao,
  CadastroCondominio,
  type CedulaCondominialAberta,
  type UnidadeCondominial,
} from './UnidadeCondominial.ts';
