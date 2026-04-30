import {
  CotacaoResponse,
  AcompanhamentoResponse,
  EnderecoDestino,
  SelecionarVencedorResponse,
} from "@/types/cotacao";

const ENDPOINT = "https://n8n.unoerp.com.br/webhook/cotacao_em_tela";
const ACOMPANHAMENTO_ENDPOINT = "https://n8n.unoerp.com.br/webhook/consultar-cotacao-front";
const SELECIONAR_VENCEDOR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/selecionar-vencedor";

export async function buscarCotacao(
  numeroPedido: string,
  enderecoDestino: EnderecoDestino
): Promise<CotacaoResponse> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido, enderecoDestino }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function consultarAcompanhamento(
  cotacaoId: string
): Promise<AcompanhamentoResponse> {
  const response = await fetch(ACOMPANHAMENTO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cotacaoId }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function selecionarVencedor(
  cotacaoId: string,
  fornecedorTelefone: string
): Promise<SelecionarVencedorResponse> {
  const response = await fetch(SELECIONAR_VENCEDOR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cotacaoId, fornecedorTelefone }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}
