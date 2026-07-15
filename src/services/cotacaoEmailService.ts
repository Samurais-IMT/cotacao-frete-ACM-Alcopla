import {
  BuscarPedidoEmailResponse,
  EnviarCotacaoEmailResponse,
  AcompanhamentoEmailResponse,
  SelecionarVencedorEmailResponse,
} from "@/types/cotacaoEmail";

const BUSCAR_PEDIDO_ENDPOINT = "https://n8n.unoerp.com.br/webhook/buscar-pedido-email";
const ENVIAR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/cotacao_email";
const CONSULTAR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/consultar-cotacao-email";
const SELECIONAR_VENCEDOR_ENDPOINT = "https://n8n.unoerp.com.br/webhook/selecionar-vencedor-email";

export async function buscarPedidoEmail(
  numeroPedido: string
): Promise<BuscarPedidoEmailResponse> {
  const response = await fetch(BUSCAR_PEDIDO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido }),
  });
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
  return response.json();
}

export async function enviarCotacaoEmail(
  numeroPedido: string,
  transportadoras: number[]
): Promise<EnviarCotacaoEmailResponse> {
  const response = await fetch(ENVIAR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroPedido, transportadoras }),
  });
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
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
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
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
  if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
  return response.json();
}
