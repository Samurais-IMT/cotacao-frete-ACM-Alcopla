import { ItemCotacao } from "@/types/cotacao";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ItemsTableProps {
  itens: ItemCotacao[];
}

const ItemsTable = ({ itens }: ItemsTableProps) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-foreground">Itens do pedido ({itens.length})</h3>

    {/* Desktop table */}
    <div className="hidden md:block border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Código</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Peso unit. (kg)</TableHead>
            <TableHead className="text-right">Peso total (kg)</TableHead>
            <TableHead className="text-right">A × L × C (cm)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.cod_produto}>
              <TableCell className="font-mono text-sm">{item.cod_produto}</TableCell>
              <TableCell>{item.descricao}</TableCell>
              <TableCell className="text-right">{item.quantidade}</TableCell>
              <TableCell className="text-right">{item.pesoUnitario}</TableCell>
              <TableCell className="text-right font-medium">{item.pesoTotalItem}</TableCell>
              <TableCell className="text-right">{item.altura} × {item.largura} × {item.comprimento}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Mobile cards */}
    <div className="md:hidden space-y-3">
      {itens.map((item) => (
        <div key={item.cod_produto} className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-xs text-muted-foreground">{item.cod_produto}</span>
              <p className="font-medium text-foreground text-sm">{item.descricao}</p>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">Qtd: {item.quantidade}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-muted-foreground block">Peso unit.</span><span className="font-medium text-foreground">{item.pesoUnitario} kg</span></div>
            <div><span className="text-muted-foreground block">Peso total</span><span className="font-medium text-foreground">{item.pesoTotalItem} kg</span></div>
            <div><span className="text-muted-foreground block">A×L×C</span><span className="font-medium text-foreground">{item.altura}×{item.largura}×{item.comprimento}</span></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ItemsTable;
