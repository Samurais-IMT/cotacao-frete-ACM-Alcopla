import { useEffect, useState, useCallback } from "react";
import { AcompanhamentoEmailResponse, ItemCotacao } from "@/types/cotacaoEmail";
import { consultarCotacaoEmail, selecionarVencedorEmail } from "@/services/cotacaoEmailService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, MapPin, Truck, RefreshCw,
  Trophy, Loader2, AlertCircle, Route as RouteIcon
} from "lucide-react";

interface AcompanhamentoViewEmailProps {
  numeroPedido: string;
  onBack: () => void;
}

const AcompanhamentoViewEmail = ({ numeroPedido, onBack }: AcompanhamentoViewEmailProps) => {
  const [data, setData] = useState<AcompanhamentoEmailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroVencedor, setErroVencedor] = useState("");

  const carregar = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setErro(null);
    try {
      const res = await consultarCotacaoEmail(numeroPedido);
      if (res.sucesso) {
        setData(res);
      } else {
        setErro(res.mensagem || "Cotação não encontrada para este pedido.");
        setData(null);
      }
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [numeroPedido]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleConfirmarVencedor = async () => {
    if (!fornecedorSelecionado) return;
    setConfirmando(true);
    setErroVencedor("");
    try {
      const res = await selecionarVencedorEmail(numeroPedido, fornecedorSelecionado);
      if (res.sucesso) {
        await carregar(true);
        setFornecedorSelecionado(null);
      } else {
        setErroVencedor(res.mensagem || "Erro ao definir vencedor.");
      }
    } catch {
      setErroVencedor("Erro ao conectar. Tente novamente.");
    } finally {
      setConfirmando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando cotação...</p>
      </div>
    );
  }

  if (erro || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground">Pedido #{numeroPedido}</h2>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{erro || "Cotação não encontrada."}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verifique se já foi enviada uma cotação por email para este pedido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const podeSelecionar = !data.vencedorDefinido && (data.fornecedores?.length ?? 0) > 0;

  const sortedFornecedores = [...(data.fornecedores || [])].sort((a, b) => {
    if (a.vencedor && !b.vencedor) return -1;
    if (!a.vencedor && b.vencedor) return 1;
    return 0;
  });

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefreshing ? "opacity-80" : "opacity-100"}`}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">Acompanhamento da cotação</h2>
          <p className="text-sm text-muted-foreground">
            Pedido #{data.numeroPedido}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => carregar(true)} disabled={isRefreshing} className="shrink-0">
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Status + Endereço */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">{data.mensagemStatus}</p>

        {data.vencedorDefinido && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <Trophy className="h-4 w-4" />
            Vencedor já definido para esta cotação.
          </div>
        )}

        {data.enderecoFormatado && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1 border-t border-border">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{data.enderecoFormatado}</span>
          </div>
        )}
      </div>

      {/* Tabela de Frete Estimado */}
      {data.freteEstimado && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Frete Estimado
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RouteIcon className="h-4 w-4" />
              <span>
                {data.freteEstimado.origemCidade} → {data.freteEstimado.distanciaKm} km
                {data.freteEstimado.duracaoEstimada && data.freteEstimado.duracaoEstimada !== 'N/A' && (
                  <> · {data.freteEstimado.duracaoEstimada}</>
                )}
              </span>
            </div>
          </div>

          <div className="hidden md:block border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tipo de Veículo</TableHead>
                  <TableHead className="text-right">Peso Máx (kg)</TableHead>
                  <TableHead className="text-right">Eixos</TableHead>
                  <TableHead className="text-right">Valor/km</TableHead>
                  <TableHead className="text-right">Valor Estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.freteEstimado.tabela.map((item) => (
                  <TableRow key={item.tipoVeiculo}>
                    <TableCell className="font-medium">{item.tipoVeiculo}</TableCell>
                    <TableCell className="text-right">{item.pesoMax.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{item.eixos}</TableCell>
                    <TableCell className="text-right font-mono">R$ {item.valorKm.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{item.valorEstimadoFormatado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {data.freteEstimado.tabela.map((item) => (
              <div key={item.tipoVeiculo} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground text-sm">{item.tipoVeiculo}</span>
                  <span className="font-mono font-semibold text-foreground">{item.valorEstimadoFormatado}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Peso máx: {item.pesoMax.toLocaleString('pt-BR')} kg</span>
                  <span>Eixos: {item.eixos}</span>
                  <span>R$ {item.valorKm.toFixed(2)}/km</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fornecedores */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Fornecedores ({data.fornecedores?.length ?? 0})</h3>
          {podeSelecionar && (
            <span className="text-xs text-muted-foreground">Selecione o vencedor</span>
          )}
        </div>

        {!data.fornecedores || data.fornecedores.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
            Nenhum fornecedor contatado para este pedido.
          </div>
        ) : (
          <>
            <div className="hidden md:block border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {podeSelecionar && <TableHead className="w-10"></TableHead>}
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    {data.vencedorDefinido && <TableHead>Resultado</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFornecedores.map((f) => (
                    <TableRow
                      key={f.email}
                      className={
                        f.vencedor
                          ? "bg-green-50 dark:bg-green-950/20"
                          : f.statusFinal === "perdedor"
                          ? "opacity-50"
                          : ""
                      }
                    >
                      {podeSelecionar && (
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => { setFornecedorSelecionado(f.email); setErroVencedor(""); }}
                            className="flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors"
                            style={{
                              borderColor: fornecedorSelecionado === f.email ? '#2563eb' : '#9ca3af',
                              backgroundColor: fornecedorSelecionado === f.email ? '#2563eb' : 'transparent'
                            }}
                          >
                            {fornecedorSelecionado === f.email && (
                              <span className="w-2 h-2 rounded-full bg-white block" />
                            )}
                          </button>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.email}</TableCell>
                      {data.vencedorDefinido && (
                        <TableCell>
                          {f.statusFinal === "vencedor" && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <Trophy className="h-3 w-3 mr-1" /> Vencedor
                            </Badge>
                          )}
                          {f.statusFinal === "perdedor" && (
                            <Badge variant="secondary">Perdedor</Badge>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {sortedFornecedores.map((f) => (
                <div
                  key={f.email}
                  className={`bg-card border border-border rounded-lg p-4 space-y-2 ${
                    f.vencedor ? "border-green-400" : f.statusFinal === "perdedor" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {podeSelecionar && (
                        <button
                          type="button"
                          onClick={() => { setFornecedorSelecionado(f.email); setErroVencedor(""); }}
                          className="flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors shrink-0"
                          style={{
                            borderColor: fornecedorSelecionado === f.email ? '#2563eb' : '#9ca3af',
                            backgroundColor: fornecedorSelecionado === f.email ? '#2563eb' : 'transparent'
                          }}
                        >
                          {fornecedorSelecionado === f.email && (
                            <span className="w-2 h-2 rounded-full bg-white block" />
                          )}
                        </button>
                      )}
                      <span className="font-medium text-foreground text-sm">{f.nome}</span>
                    </div>
                    {f.statusFinal === "vencedor" && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Trophy className="h-3 w-3 mr-1" /> Vencedor
                      </Badge>
                    )}
                    {f.statusFinal === "perdedor" && (
                      <Badge variant="secondary">Perdedor</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{f.email}</span>
                </div>
              ))}
            </div>

            {podeSelecionar && (
              <div className="space-y-2 pt-1">
                {erroVencedor && <p className="text-sm text-destructive">{erroVencedor}</p>}
                <Button
                  onClick={handleConfirmarVencedor}
                  disabled={!fornecedorSelecionado || confirmando}
                  className="w-full sm:w-auto"
                >
                  {confirmando ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmando...</>
                  ) : (
                    <><Trophy className="mr-2 h-4 w-4" />Confirmar vencedor</>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Itens do pedido */}
      {data.itens && data.itens.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Produtos do pedido ({data.itens.length}) — Peso total: {data.pesoTotal}kg — Volumes: {data.totalVolumes}
          </h3>
          <div className="hidden md:block border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Peso Bruto (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens.map((item: ItemCotacao) => (
                  <TableRow key={item.cod_produto}>
                    <TableCell className="font-mono text-sm">{item.cod_produto}</TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right font-mono">{item.pesoTotalItem.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {data.itens.map((item: ItemCotacao) => (
              <div key={item.cod_produto} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-muted-foreground">{item.cod_produto}</span>
                  <span className="text-xs font-medium text-foreground">{item.pesoTotalItem.toFixed(2)} kg</span>
                </div>
                <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                <span className="text-xs text-muted-foreground">Qtd: {item.quantidade}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcompanhamentoViewEmail;