import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Search, Loader2, Package, AlertTriangle } from "lucide-react";
import logoACM from "@/assets/LOGO_ACM.png";
import { Transportadora } from "@/types/cotacaoEmail";

interface OrderSearchFormEmailProps {
  onBuscarPedido: (numeroPedido: string) => void;
  onEnviarCotacao: (numeroPedido: string, transportadoras: number[]) => void;
  onConsultarCotacao: (numeroPedido: string) => void;
  isLoading: boolean;
  loadingType: "buscar" | "enviar" | "consultar" | null;
  pedidoEncontrado?: {
    numeroPedido: string;
    enderecoFormatado: string;
    pesoTotal: number;
    totalVolumes: number;
    veiculoRecomendado: string;
    transportadoras: Transportadora[];
    cotacaoExistente: boolean;
  } | null;
}

const OrderSearchFormEmail = ({
  onBuscarPedido,
  onEnviarCotacao,
  onConsultarCotacao,
  isLoading,
  loadingType,
  pedidoEncontrado,
}: OrderSearchFormEmailProps) => {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroPedido.trim()) {
      setSelecionadas([]);
      onBuscarPedido(numeroPedido.trim());
    }
  };

  const handleConsultar = () => {
    if (numeroPedido.trim()) onConsultarCotacao(numeroPedido.trim());
  };

  const handleEnviar = () => {
    if (pedidoEncontrado && selecionadas.length > 0) {
      onEnviarCotacao(pedidoEncontrado.numeroPedido, selecionadas);
    }
  };

  const toggleTransportadora = (cod: number) => {
    setSelecionadas(prev =>
      prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]
    );
  };

  const toggleTodas = () => {
    if (!pedidoEncontrado) return;
    const todos = pedidoEncontrado.transportadoras.map(t => t.cod_transportadora);
    setSelecionadas(prev => prev.length === todos.length ? [] : todos);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="w-full flex flex-col items-center text-center gap-3">
        <img src={logoACM} alt="Alcopla" className="h-20 object-contain" />
        <h1 className="text-2xl font-semibold text-foreground">Cotação de Frete por Email</h1>
        <p className="text-muted-foreground text-sm">
          Busque o pedido, selecione as transportadoras e envie a cotação por email.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <form onSubmit={handleBuscar} className="space-y-4">
          <div>
            <label htmlFor="numeroPedido" className="text-sm font-medium text-foreground mb-1.5 block">
              Número do pedido
            </label>
            <Input
              id="numeroPedido"
              type="text"
              placeholder="Ex: 367488"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || !numeroPedido.trim()}
            >
              {isLoading && loadingType === "buscar" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Buscando...</>
              ) : (
                <><Package className="mr-2 h-4 w-4" />Buscar pedido</>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleConsultar}
              disabled={isLoading || !numeroPedido.trim()}
            >
              {isLoading && loadingType === "consultar" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Consultando...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" />Consultar cotação</>
              )}
            </Button>
          </div>
        </form>

        {pedidoEncontrado && (
          <div className="space-y-4 pt-2 border-t border-border">

            {pedidoEncontrado.cotacaoExistente && (
              <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Já existe uma cotação enviada para este pedido. Deseja reenviar?
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Pedido #{pedidoEncontrado.numeroPedido}</p>
              <p>{pedidoEncontrado.enderecoFormatado}</p>
              <p>Peso total: <strong>{pedidoEncontrado.pesoTotal?.toFixed(2).replace('.', ',')} kg</strong> · Volumes: <strong>{pedidoEncontrado.totalVolumes}</strong> · Veículo: <strong>{pedidoEncontrado.veiculoRecomendado}</strong></p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Transportadoras</p>
                <button
                  type="button"
                  onClick={toggleTodas}
                  className="text-xs text-primary hover:underline"
                >
                  {selecionadas.length === pedidoEncontrado.transportadoras.length ? "Desmarcar todas" : "Selecionar todas"}
                </button>
              </div>

              <div className="space-y-2">
                {pedidoEncontrado.transportadoras.map(t => (
                  <label
                    key={t.cod_transportadora}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selecionadas.includes(t.cod_transportadora)}
                      onChange={() => toggleTransportadora(t.cod_transportadora)}
                      className="w-4 h-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.nome_fantasia}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-11"
              onClick={handleEnviar}
              disabled={isLoading || selecionadas.length === 0}
            >
              {isLoading && loadingType === "enviar" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                <><Mail className="mr-2 h-4 w-4" />Enviar cotação por email ({selecionadas.length})</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSearchFormEmail;
