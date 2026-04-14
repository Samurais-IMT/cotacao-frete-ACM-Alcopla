export interface ItemCotacao {
  cod_produto: string;
  descricao: string;
  quantidade: number;
  pesoUnitario: number;
  pesoTotalItem: number;
  altura: number;
  largura: number;
  comprimento: number;
}

export interface CampoFaltante {
  cod_produto: string;
  descricao: string;
  campos: string[];
}

export interface CotacaoSucessoResponse {
  sucesso: true;
  mensagem: string;
  numeroPedido: string;
  cotacaoId: string;
  status: string;
  deadlineAt: string;
  pesoTotal: number;
  totalVolumes: number;
  totalFornecedores?: number;
  itens: ItemCotacao[];
  fornecedor?: string;
  fornecedor_telefone?: string;
}

export interface CotacaoErroResponse {
  sucesso: false;
  mensagem: string;
  faltantes?: CampoFaltante[];
}

export type CotacaoResponse = CotacaoSucessoResponse | CotacaoErroResponse;

export interface Fornecedor {
  nome: string;
  telefone: string;
  status: "respondido" | "aguardando" | "encerrado";
  valor: string | null;
  prazo: string | null;
  prazoDias: number | null;
  respondidoEm: string | null;
}

export interface AcompanhamentoResponse {
  sucesso: boolean;
  cotacaoId: string;
  numeroPedido: string;
  deadlineAt: string;
  serverNow?: string;
  segundosRestantes?: number;
  prazoLimiteFormatado?: string;
  encerrada: boolean;
  totalFornecedores: number;
  totalRespondidos: number;
  todosResponderam: boolean;
  mensagemStatus: string;
  fornecedores: Fornecedor[];
}
