import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Search, Loader2 } from "lucide-react";
import logoACM from "@/assets/LOGO_ACM.png";

interface OrderSearchFormEmailProps {
  onEnviarCotacao: (numeroPedido: string) => void;
  onConsultarCotacao: (numeroPedido: string) => void;
  isLoading: boolean;
  loadingType: "enviar" | "consultar" | null;
}

const OrderSearchFormEmail = ({
  onEnviarCotacao,
  onConsultarCotacao,
  isLoading,
  loadingType,
}: OrderSearchFormEmailProps) => {
  const [numeroPedido, setNumeroPedido] = useState("");

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroPedido.trim()) onEnviarCotacao(numeroPedido.trim());
  };

  const handleConsultar = () => {
    if (numeroPedido.trim()) onConsultarCotacao(numeroPedido.trim());
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="w-full flex flex-col items-center text-center gap-3">
        <img src={logoACM} alt="Alcopla" className="h-20 object-contain" />
        <h1 className="text-2xl font-semibold text-foreground">Cotação de Frete por Email</h1>
        <p className="text-muted-foreground text-sm">
          Envie a cotação por email aos fornecedores ou consulte um pedido já enviado.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <form onSubmit={handleEnviar} className="space-y-4">
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
              {isLoading && loadingType === "enviar" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                <><Mail className="mr-2 h-4 w-4" />Enviar cotação por email</>
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
      </div>
    </div>
  );
};

export default OrderSearchFormEmail;
