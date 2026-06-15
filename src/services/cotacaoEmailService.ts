import {
  EnviarCotacaoEmailResponse,
  AcompanhamentoEmailResponse,
  SelecionarVencedorEmailResponse,
} from "@/types/cotacaoEmail";

const ENVIAR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/cotacao_email";
const CONSULTAR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/consultar-cotacao-email";
const SELECIONAR_VENCEDOR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/selecionar-vencedor-email";

export async function enviarCotacaoEmail(
  numeroPedido: string
): Promise<EnviarCotacaoEmailResponse> {
  const response = await fetch(ENVIAR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function consultarCotacaoEmail(
  numeroPedido: string
): Promise<AcompanhamentoEmailResponse> {
  const response = await fetch(CONSULTAR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}

export async function selecionarVencedorEmail(
  numeroPedido: string,
  fornecedorEmail: string
): Promise<SelecionarVencedorEmailResponse> {
  const response = await fetch(SELECIONAR_VENCEDOR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido, fornecedorEmail }),
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
}
