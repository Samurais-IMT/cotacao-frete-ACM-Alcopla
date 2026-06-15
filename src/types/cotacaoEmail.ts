import { ItemCotacao, CampoFaltante } from "./cotacao";

export interface FreteEstimadoItem {
  tipoVeiculo: string;
  pesoMax: number;
  eixos: number;
  valorKm: number;
  valorEstimado: number;
  valorEstimadoFormatado: string;
}

export interface FreteEstimado {
  origemCep: string;
  origemCidade: string;
  distanciaKm: number;
  duracaoEstimada: string;
  tabela: FreteEstimadoItem[];
}

export interface FornecedorEmail {
  nome: string;
  email: string;
  vencedor: boolean;
  statusFinal: "vencedor" | "perdedor" | null;
}

export interface EnviarCotacaoEmailSucesso {
  sucesso: true;
  mensagem: string;
  numeroPedido: string;
  cotacaoId: string;
  status: string;
  pesoTotal: number;
  totalVolumes: number;
  itens: ItemCotacao[];
  enderecoFormatado: string;
  totalFornecedores: number;
}

export interface EnviarCotacaoEmailErro {
  sucesso: false;
  mensagem: string;
  faltantes?: CampoFaltante[];
}

export type EnviarCotacaoEmailResponse = EnviarCotacaoEmailSucesso | EnviarCotacaoEmailErro;

export interface AcompanhamentoEmailResponse {
  sucesso: boolean;
  mensagem?: string;
  cotacaoId?: string;
  numeroPedido?: string;
  vencedorDefinido?: boolean;
  mensagemStatus?: string;
  enderecoFormatado?: string;
  itens?: ItemCotacao[];
  pesoTotal?: number;
  totalVolumes?: number;
  fornecedores?: FornecedorEmail[];
  freteEstimado?: FreteEstimado;
}

export interface SelecionarVencedorEmailResponse {
  sucesso: boolean;
  mensagem: string;
}
