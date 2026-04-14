import { CotacaoSucessoResponse } from "@/types/cotacao";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface QuotationSummaryProps {
  data: CotacaoSucessoResponse;
  onBack: () => void;
  onConsultar: () => void;
  isLoadingAcompanhamento: boolean;
}

const statusLabels: Record<string, string> = {
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const QuotationSummary = ({ data, onBack, onConsultar, isLoadingAcompanhamento }: QuotationSummaryProps) => {
  const [copied, setCopied] = useState(false);

  const deadlineFormatted = new Date(data.deadlineAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.cotacaoId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Cotação iniciada</h2>
          <p className="text-sm text-muted-foreground">{data.mensagem}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <InfoCard label="Pedido" value={`#${data.numeroPedido}`} />
        <InfoCard label="Status">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
            {statusLabels[data.status] || data.status}
          </Badge>
        </InfoCard>
        <InfoCard label="Prazo limite" value={deadlineFormatted} />
        <InfoCard label="Peso total" value={`${data.pesoTotal} kg`} />
        <InfoCard label="Total de volumes" value={String(data.totalVolumes)} />
        <InfoCard label="Cotação ID">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-mono text-foreground truncate">{data.cotacaoId}</span>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-primary transition-colors shrink-0" title="Copiar">
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </InfoCard>
      </div>

      <Button variant="outline" className="w-full sm:w-auto" onClick={onConsultar} disabled={isLoadingAcompanhamento}>
        {isLoadingAcompanhamento ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Consultar andamento da cotação
      </Button>
    </div>
  );
};

const InfoCard = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <span className="text-xs text-muted-foreground block mb-1">{label}</span>
    {children || <span className="text-sm font-medium text-foreground">{value}</span>}
  </div>
);

export default QuotationSummary;
