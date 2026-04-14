import { CotacaoResponse, AcompanhamentoResponse } from "@/types/cotacao";

const ENDPOINT = "https://n8n.unoerp.com.br/webhook-test/cotacao_em_tela";
const ACOMPANHAMENTO_ENDPOINT = "https://n8n.unoerp.com.br/webhook-test/consultar-cotacao-front";

export async function buscarCotacao(numeroPedido: string): Promise<CotacaoResponse> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function consultarAcompanhamento(cotacaoId: string): Promise<AcompanhamentoResponse> {
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
