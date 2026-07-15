import { useState } from "react";
import { buscarPedidoEmail, enviarCotacaoEmail } from "@/services/cotacaoEmailService";
import OrderSearchFormEmail from "@/components/cotacao/OrderSearchFormEmail";
import AcompanhamentoViewEmail from "@/components/cotacao/AcompanhamentoViewEmail";
import ErrorMessage from "@/components/cotacao/ErrorMessage";
import { CotacaoErroResponse } from "@/types/cotacao";
import { BuscarPedidoEmailSucesso } from "@/types/cotacaoEmail";
import backgroundImg from "@/assets/background.jpg";

const IndexEmail = () => {
  const [numeroPedidoAtivo, setNumeroPedidoAtivo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"buscar" | "enviar" | "consultar" | null>(null);
  const [error, setError] = useState<CotacaoErroResponse | string | null>(null);
  const [pedidoEncontrado, setPedidoEncontrado] = useState<BuscarPedidoEmailSucesso | null>(null);

  const handleBuscarPedido = async (numeroPedido: string) => {
    setIsLoading(true);
    setLoadingType("buscar");
    setError(null);
    setPedidoEncontrado(null);

    try {
      const response = await buscarPedidoEmail(numeroPedido);
      if (response.sucesso === true) {
        setPedidoEncontrado(response);
      } else {
        setError(response as CotacaoErroResponse);
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleEnviarCotacao = async (numeroPedido: string, transportadoras: number[]) => {
    setIsLoading(true);
    setLoadingType("enviar");
    setError(null);

    try {
      const response = await enviarCotacaoEmail(numeroPedido, transportadoras);
      if (response.sucesso === true) {
        setPedidoEncontrado(null);
        setNumeroPedidoAtivo(numeroPedido);
      } else {
        setError(response as CotacaoErroResponse);
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleConsultarCotacao = (numeroPedido: string) => {
    setError(null);
    setPedidoEncontrado(null);
    setNumeroPedidoAtivo(numeroPedido);
  };

  const handleBack = () => {
    setNumeroPedidoAtivo(null);
    setPedidoEncontrado(null);
    setError(null);
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen bg-background/85 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          {numeroPedidoAtivo ? (
            <AcompanhamentoViewEmail
              numeroPedido={numeroPedidoAtivo}
              onBack={handleBack}
            />
          ) : (
            <div className="space-y-6">
              <OrderSearchFormEmail
                onBuscarPedido={handleBuscarPedido}
                onEnviarCotacao={handleEnviarCotacao}
                onConsultarCotacao={handleConsultarCotacao}
                isLoading={isLoading}
                loadingType={loadingType}
                pedidoEncontrado={pedidoEncontrado}
              />
              {error && (
                <div className="max-w-lg mx-auto">
                  <ErrorMessage error={error} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndexEmail;
