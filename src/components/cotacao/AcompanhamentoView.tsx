import { useEffect, useState, useRef, useCallback } from "react";
import { AcompanhamentoResponse, ItemCotacao } from "@/types/cotacao";
import { consultarAcompanhamento } from "@/services/cotacaoService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Users, RefreshCw, Copy, Check } from "lucide-react";

interface AcompanhamentoViewProps {
  data: AcompanhamentoResponse;
  onBack: () => void;
  onDataUpdate: (data: AcompanhamentoResponse) => void;
  dadosPedido?: { itens: ItemCotacao[]; pesoTotal: number; totalVolumes: number } | null;
  isCriacao?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  respondido: { label: "Respondido", variant: "default" },
  aguardando: { label: "Aguardando", variant: "secondary" },
  encerrado: { label: "Encerrado", variant: "destructive" },
};

function useCountdown(segundosRestantes: number | undefined, encerrada: boolean, offset: number = 0) {
  const [secondsLeft, setSecondsLeft] = useState<number>(Math.max(0, (segundosRestantes ?? 0) + offset));

  // Sync whenever API provides a new value
  useEffect(() => {
    if (segundosRestantes != null) {
      setSecondsLeft(Math.max(0, Math.floor(segundosRestantes) + offset));
    }
  }, [segundosRestantes, offset]);

  useEffect(() => {
    if (encerrada || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [encerrada, secondsLeft > 0]); // restart interval when it goes from 0 to positive (API update)

  if (encerrada || secondsLeft <= 0) return "Prazo encerrado";

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function parseValor(valor: string | null | undefined): number {
  if (!valor) return Infinity;
  return parseFloat(valor.replace(/\./g, "").replace(",", ".")) || Infinity;
}

const POLLING_INTERVAL = 10_000;

const AcompanhamentoView = ({ data, onBack, onDataUpdate, dadosPedido, isCriacao }: AcompanhamentoViewProps) => {
  // Creation: countdown already correct, no offset. Tracking: API returns +3h, subtract 10800.
  const countdownOffset = isCriacao ? 0 : -10800;
  const timeLeft = useCountdown(data.segundosRestantes, data.encerrada, countdownOffset);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.cotacaoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const shouldStop = data.encerrada || data.todosResponderam;

  const sortedFornecedores = [...data.fornecedores].sort((a, b) => {
    const aRespondido = a.status === "respondido" ? 0 : 1;
    const bRespondido = b.status === "respondido" ? 0 : 1;
    if (aRespondido !== bRespondido) return aRespondido - bRespondido;
    if (aRespondido === 0) return parseValor(a.valor) - parseValor(b.valor);
    return 0;
  });

  const formattedDeadline = (() => {
    const deadlineDate = new Date(data.deadlineAt);
    if (isCriacao) {
      // Creation: deadlineAt already correct, just format with timezone
      return deadlineDate.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    }
    // Tracking: deadlineAt from API has +3h, subtract to get correct display
    if (data.prazoLimiteFormatado) {
      const corrected = new Date(deadlineDate.getTime() - 3 * 60 * 60 * 1000);
      return corrected.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
    }
    return deadlineDate.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  })();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await consultarAcompanhamento(data.cotacaoId);
      onDataUpdate(updated);
    } catch {
      // silently ignore polling errors
    } finally {
      setIsRefreshing(false);
    }
  }, [data.cotacaoId, onDataUpdate]);

  useEffect(() => {
    if (shouldStop) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(refresh, POLLING_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shouldStop, refresh]);

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefreshing ? "opacity-80" : "opacity-100"}`}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{isCriacao ? "Criação de cotação" : "Acompanhamento da cotação"}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Pedido #{data.numeroPedido} — {data.cotacaoId}
            <button onClick={handleCopy} className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors" title="Copiar ID">
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </p>
        </div>
        {!shouldStop && (
          <Button variant="ghost" size="icon" onClick={refresh} disabled={isRefreshing} className="shrink-0">
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {/* Status message */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">{data.mensagemStatus}</p>

        {data.todosResponderam && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Todos os orçamentos já foram enviados.
          </div>
        )}

        {data.encerrada && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Prazo encerrado para esta cotação.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground block mb-1">Countdown</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-semibold text-foreground">{timeLeft}</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground block mb-1">Prazo Final</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{formattedDeadline}</span>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <span className="text-xs text-muted-foreground block mb-1">Respondidos</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{data.totalRespondidos} de {data.totalFornecedores}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers table */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Fornecedores ({data.totalFornecedores})</h3>

        {data.fornecedores.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            Aguardando dados dos fornecedores...
          </div>
        ) : isCriacao ? (
          <>
            {/* Creation screen: only name + status */}
            {/* Desktop */}
            <div className="hidden md:block border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFornecedores.map((f) => (
                    <TableRow key={f.nome + f.telefone}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.telefone}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                          {statusConfig[f.status]?.label ?? f.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {sortedFornecedores.map((f) => (
                <div key={f.nome + f.telefone} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-foreground text-sm">{f.nome}</span>
                    <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                      {statusConfig[f.status]?.label ?? f.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.telefone}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Tracking screen: full table */}
            {/* Desktop */}
            <div className="hidden md:block border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Respondido em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFornecedores.map((f) => (
                    <TableRow key={f.nome + f.telefone}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                          {statusConfig[f.status]?.label ?? f.status}
                        </Badge>
                      </TableCell>
                    <TableCell className="text-right font-mono">{f.valor ? `R$ ${f.valor}` : "—"}</TableCell>
                    <TableCell>
                      {(() => {
                        if (f.prazo && f.prazoDias) return `${f.prazo} (${f.prazoDias} dias)`;
                        if (f.prazo) return f.prazo;
                        if (f.prazoDias) return `${f.prazoDias} dias`;
                        return "—";
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {f.respondidoEm
                        ? (() => {
                            const date = new Date(f.respondidoEm);
                            date.setTime(date.getTime() - 3 * 60 * 60 * 1000);
                            return date.toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).replace(",", "");
                          })()
                        : "—"}
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {sortedFornecedores.map((f) => (
                <div key={f.nome + f.telefone} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-foreground text-sm">{f.nome}</span>
                    <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                      {statusConfig[f.status]?.label ?? f.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground block">Valor</span><span className="font-medium text-foreground">{f.valor ? `R$ ${f.valor}` : "—"}</span></div>
                    <div><span className="text-muted-foreground block">Prazo</span><span className="font-medium text-foreground">{(() => {
                      if (f.prazo && f.prazoDias) return `${f.prazo} (${f.prazoDias} dias)`;
                      if (f.prazo) return f.prazo;
                      if (f.prazoDias) return `${f.prazoDias} dias`;
                      return "—";
                    })()}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground block">Respondido em</span><span className="font-medium text-foreground">{f.respondidoEm ? (() => {
                      const date = new Date(f.respondidoEm);
                      date.setTime(date.getTime() - 3 * 60 * 60 * 1000);
                      return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
                    })() : "—"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Itens do pedido (only from new quotation) */}
      {dadosPedido && dadosPedido.itens.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Produtos do pedido ({dadosPedido.itens.length}) — Peso total: {dadosPedido.pesoTotal}kg — Volumes: {dadosPedido.totalVolumes}
          </h3>

          {/* Desktop */}
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
                {dadosPedido.itens.map((item) => (
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

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {dadosPedido.itens.map((item) => (
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

export default AcompanhamentoView;
