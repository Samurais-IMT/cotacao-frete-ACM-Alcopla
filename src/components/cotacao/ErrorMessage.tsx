import { CotacaoErroResponse } from "@/types/cotacao";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error: CotacaoErroResponse | string;
}

const ErrorMessage = ({ error }: ErrorMessageProps) => {
  const isString = typeof error === "string";
  const mensagem = isString ? error : error.mensagem;
  const faltantes = !isString && error.faltantes ? error.faltantes : null;

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-foreground font-medium">{mensagem}</p>
      </div>

      {faltantes && faltantes.length > 0 && (
        <div className="ml-8 space-y-2">
          <p className="text-xs text-muted-foreground">Produtos com dados faltantes:</p>
          {faltantes.map((f) => (
            <div key={f.cod_produto} className="text-xs bg-card border border-border rounded p-2">
              <span className="font-medium text-foreground">{f.cod_produto}</span>
              <span className="text-muted-foreground"> — {f.descricao}</span>
              <p className="text-destructive mt-1">Campos: {f.campos.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
