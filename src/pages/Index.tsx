import { useState } from "react";
import { CotacaoErroResponse, AcompanhamentoResponse, ItemCotacao } from "@/types/cotacao";
import { buscarCotacao, consultarAcompanhamento } from "@/services/cotacaoService";
import OrderSearchForm from "@/components/cotacao/OrderSearchForm";
import ErrorMessage from "@/components/cotacao/ErrorMessage";
import AcompanhamentoView from "@/components/cotacao/AcompanhamentoView";
import backgroundImg from "@/assets/background.jpg";

interface DadosPedido {
  itens: ItemCotacao[];
  pesoTotal: number;
  totalVolumes: number;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"nova" | "buscar" | null>(null);
  const [acompanhamento, setAcompanhamento] = useState<AcompanhamentoResponse | null>(null);
  const [dadosPedido, setDadosPedido] = useState<DadosPedido | null>(null);
  const [error, setError] = useState<CotacaoErroResponse | string | null>(null);

  const handleNovaCotacao = async (numeroPedido: string) => {
    setIsLoading(true);
    setLoadingType("nova");
    setError(null);

    try {
      const response = await buscarCotacao(numeroPedido);

      if (response.sucesso === true) {
        const deadline = new Date(response.deadlineAt);
        const now = new Date();
        const diffSeconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

        const prazoFormatado = deadline.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });

        const acomp: AcompanhamentoResponse = {
          sucesso: true,
          cotacaoId: response.cotacaoId,
          numeroPedido: response.numeroPedido,
          deadlineAt: response.deadlineAt,
          segundosRestantes: diffSeconds,
          prazoLimiteFormatado: prazoFormatado,
          encerrada: false,
          totalFornecedores: response.totalFornecedores ?? 1,
          totalRespondidos: 0,
          todosResponderam: false,
          mensagemStatus: "Aguardando retorno dos fornecedores.",
          fornecedores: response.fornecedor ? [{
            nome: response.fornecedor,
            telefone: response.fornecedor_telefone || "—",
            status: "aguardando",
            valor: null,
            prazo: null,
            prazoDias: null,
            respondidoEm: null,
          }] : [],
        };
        setAcompanhamento(acomp);
        setDadosPedido({
          itens: response.itens,
          pesoTotal: response.pesoTotal,
          totalVolumes: response.totalVolumes,
        });
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

  const handleBuscarCotacao = async (cotacaoId: string) => {
    setIsLoading(true);
    setLoadingType("buscar");
    setError(null);

    try {
      const response = await consultarAcompanhamento(cotacaoId);
      if (response.sucesso) {
        setAcompanhamento(response);
      } else {
        setError("Cotação não encontrada. Verifique o ID e tente novamente.");
      }
    } catch {
      setError("Cotação não encontrada ou erro ao conectar. Verifique o ID e tente novamente.");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleBack = () => {
    setAcompanhamento(null);
    setDadosPedido(null);
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
          {acompanhamento ? (
            <AcompanhamentoView data={acompanhamento} onBack={handleBack} onDataUpdate={setAcompanhamento} dadosPedido={dadosPedido} isCriacao={!!dadosPedido} />
          ) : (
            <div className="space-y-6">
              <OrderSearchForm
                onSubmitNovaCotacao={handleNovaCotacao}
                onSubmitBuscarCotacao={handleBuscarCotacao}
                isLoading={isLoading}
                loadingType={loadingType}
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

export default Index;
