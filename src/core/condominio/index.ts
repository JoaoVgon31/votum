export {
  CondominioError,
  ParametrosCondominioInvalidosError,
  PautaEncerradaError,
  ProprietarioSemUnidadesError,
  UnidadeJaVotouError,
  UnidadeNaoEncontradaError,
} from './errors/CondominioError.ts';
export {
  ehOpcaoVotoCondominio,
  OpcaoVotoCondominio,
} from './OpcaoVotoCondominio.ts';
export {
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
