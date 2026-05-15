import { FreteEstimado } from "@/types/cotacao";
import { Truck, MapPin, Clock, Route } from "lucide-react";

interface FreteEstimadoTableProps {
  freteEstimado: FreteEstimado;
}

const FreteEstimadoTable = ({ freteEstimado }: FreteEstimadoTableProps) => {
  if (freteEstimado.status !== "OK" || !freteEstimado.tabela.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
          Frete Estimado (Referência)
        </h3>
      </div>

      {/* Info rota */}
      <div className="flex flex-wrap gap-4 text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>Origem: {freteEstimado.origemCidade}</span>
        </div>
        <div className="flex items-center gap-1">
          <Route className="h-3.5 w-3.5" />
          <span>{freteEstimado.distanciaKm} km</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{freteEstimado.duracaoEstimada}</span>
        </div>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-blue-200 dark:border-blue-800">
              <th className="text-left py-2 px-2 text-blue-800 dark:text-blue-200 font-medium text-xs">
                Tipo Veículo
              </th>
              <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200 font-medium text-xs">
                Peso Máx
              </th>
              <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200 font-medium text-xs">
                Eixos
              </th>
              <th className="text-center py-2 px-2 text-blue-800 dark:text-blue-200 font-medium text-xs">
                R$/km
              </th>
              <th className="text-right py-2 px-2 text-blue-800 dark:text-blue-200 font-medium text-xs">
                Valor Estimado
              </th>
            </tr>
          </thead>
          <tbody>
            {freteEstimado.tabela.map((veiculo, index) => (
              <tr
                key={veiculo.tipoVeiculo}
                className={
                  index % 2 === 0
                    ? "bg-white/50 dark:bg-blue-950/20"
                    : "bg-blue-50/50 dark:bg-blue-950/40"
                }
              >
                <td className="py-2 px-2 font-medium text-foreground text-xs">
                  {veiculo.tipoVeiculo}
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                  {veiculo.pesoMax.toLocaleString("pt-BR")} kg
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                  {veiculo.eixos}
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                  R$ {veiculo.valorKm.toFixed(2).replace(".", ",")}
                </td>
                <td className="py-2 px-2 text-right font-semibold text-blue-700 dark:text-blue-300 text-xs">
                  {veiculo.valorEstimadoFormatado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabela Mobile */}
      <div className="md:hidden space-y-2">
        {freteEstimado.tabela.map((veiculo) => (
          <div
            key={veiculo.tipoVeiculo}
            className="bg-white/60 dark:bg-blue-950/30 rounded-md p-3 flex items-center justify-between"
          >
            <div>
              <span className="font-medium text-foreground text-sm block">{veiculo.tipoVeiculo}</span>
              <span className="text-muted-foreground text-xs">
                {veiculo.pesoMax.toLocaleString("pt-BR")} kg · {veiculo.eixos} eixos · R$ {veiculo.valorKm.toFixed(2).replace(".", ",")}/km
              </span>
            </div>
            <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
              {veiculo.valorEstimadoFormatado}
            </span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-blue-500 dark:text-blue-400 italic">
        * Valores estimados com base na tabela de referência. Use como comparativo para os orçamentos dos fornecedores abaixo.
      </p>
    </div>
  );
};

export default FreteEstimadoTable;
