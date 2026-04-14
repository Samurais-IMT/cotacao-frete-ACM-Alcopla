import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, FileSearch } from "lucide-react";
import logoACM from "@/assets/LOGO_ACM.png";

interface OrderSearchFormProps {
  onSubmitNovaCotacao: (numeroPedido: string) => void;
  onSubmitBuscarCotacao: (cotacaoId: string) => void;
  isLoading: boolean;
  loadingType: "nova" | "buscar" | null;
}

const OrderSearchForm = ({ onSubmitNovaCotacao, onSubmitBuscarCotacao, isLoading, loadingType }: OrderSearchFormProps) => {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [cotacaoId, setCotacaoId] = useState("");

  const handleSubmitNova = (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroPedido.trim()) onSubmitNovaCotacao(numeroPedido.trim());
  };

  const handleSubmitBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (cotacaoId.trim()) onSubmitBuscarCotacao(cotacaoId.trim());
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="w-full flex flex-col items-center text-center gap-3">
        <img src={logoACM} alt="Alcopla" className="h-20 object-contain" />
        <h1 className="text-2xl font-semibold text-foreground">Cotação de Frete</h1>
        <p className="text-muted-foreground text-sm">
          Inicie uma nova cotação ou consulte uma existente.
        </p>
      </div>

      {/* Nova cotação */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Iniciar nova cotação</h2>
        </div>
        <form onSubmit={handleSubmitNova} className="space-y-3">
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
          <Button type="submit" className="w-full h-11" disabled={isLoading || !numeroPedido.trim()}>
            {isLoading && loadingType === "nova" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando cotação...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Iniciar cotação
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Buscar cotação existente */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileSearch className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Buscar cotação existente</h2>
        </div>
        <form onSubmit={handleSubmitBuscar} className="space-y-3">
          <div>
            <label htmlFor="cotacaoId" className="text-sm font-medium text-foreground mb-1.5 block">
              ID da cotação
            </label>
            <Input
              id="cotacaoId"
              type="text"
              placeholder="Ex: COT-367488-1775847158858"
              value={cotacaoId}
              onChange={(e) => setCotacaoId(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full h-11" disabled={isLoading || !cotacaoId.trim()}>
            {isLoading && loadingType === "buscar" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <FileSearch className="mr-2 h-4 w-4" />
                Buscar cotação
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OrderSearchForm;
