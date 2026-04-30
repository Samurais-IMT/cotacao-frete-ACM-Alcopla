import { useEffect, useState, useRef, useCallback } from "react";
import { AcompanhamentoResponse, ItemCotacao } from "@/types/cotacao";
import { consultarAcompanhamento, selecionarVencedor } from "@/services/cotacaoService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Clock, CheckCircle2, AlertTriangle, Users,
  RefreshCw, Copy, Check, MapPin, Trophy, Loader2
} from "lucide-react";

interface AcompanhamentoViewProps {
  data: AcompanhamentoResponse;
  onBack: () => void;
  onDataUpdate: (data: AcompanhamentoResponse) => void;
  dadosPedido?: { itens: ItemCotacao[]; pesoTotal: number; totalVolumes: number } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  respondido: { label: "Respondido", variant: "default" },
  aguardando: { label: "Aguardando", variant: "secondary" },
  encerrado:  { label: "Encerrado",  variant: "destructive" },
};

function useCountdown(segundosRestantes: number | undefined, encerrada: boolean) {
  const [secondsLeft, setSecondsLeft] = useState<number>(Math.max(0, segundosRestantes ?? 0));

  useEffect(() => {
    if (segundosRestantes != null) {
      setSecondsLeft(Math.max(0, Math.floor(segundosRestantes)));
    }
  }, [segundosRestantes]);

  useEffect(() => {
    if (encerrada || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [encerrada, secondsLeft > 0]);

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

const AcompanhamentoView = ({ data, onBack, onDataUpdate, dadosPedido }: AcompanhamentoViewProps) => {
  const timeLeft = useCountdown(data.segundosRestantes, data.encerrada);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [telefoneVencedor, setTelefoneVencedor] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroVencedor, setErroVencedor] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shouldStop = data.encerrada || data.todosResponderam || data.vencedorDefinido;
  const podeSelecionar = (data.encerrada || data.todosResponderam) && !data.vencedorDefinido;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.cotacaoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const sortedFornecedores = [...data.fornecedores].sort((a, b) => {
    if (a.vencedor && !b.vencedor) return -1;
    if (!a.vencedor && b.vencedor) return 1;
    const aRes = a.status === "respondido" ? 0 : 1;
    const bRes = b.status === "respondido" ? 0 : 1;
    if (aRes !== bRes) return aRes - bRes;
    if (aRes === 0) return parseValor(a.valor) - parseValor(b.valor);
    return 0;
  });

  const formattedDeadline = (() => {
    if (!data.deadlineAt) return "—";
    return new Date(data.deadlineAt).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  })();

  const enderecoFormatado = (() => {
    const e = data.enderecoDestino;
    if (!e) return null;
    return [
      e.logradouro + (e.numero ? `, ${e.numero}` : ""),
      e.complemento,
      e.bairro,
      e.cidade + (e.estado ? `/${e.estado}` : ""),
      e.cep ? `CEP: ${e.cep}` : "",
    ].filter(Boolean).join(" — ");
  })();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await consultarAcompanhamento(data.cotacaoId);
      onDataUpdate(updated);
    } catch { /* ignora */ }
    finally { setIsRefreshing(false); }
  }, [data.cotacaoId, onDataUpdate]);

  useEffect(() => {
    if (shouldStop) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(refresh, POLLING_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [shouldStop, refresh]);

  const handleConfirmarVencedor = async () => {
    if (!telefoneVencedor) return;
    setConfirmando(true);
    setErroVencedor("");
    try {
      const res = await selecionarVencedor(data.cotacaoId, telefoneVencedor);
      if (res.sucesso) {
        await refresh();
      } else {
        setErroVencedor(res.mensagem || "Erro ao definir vencedor.");
      }
    } catch {
      setErroVencedor("Erro ao conectar. Tente novamente.");
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefreshing ? "opacity-80" : "opacity-100"}`}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">Acompanhamento da cotação</h2>
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

      {/* Card de status */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <p className="text-sm font-medium text-foreground">{data.mensagemStatus}</p>

        {data.vencedorDefinido && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <Trophy className="h-4 w-4" />
            Vencedor já definido para esta cotação.
          </div>
        )}
        {!data.vencedorDefinido && data.todosResponderam && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Todos os orçamentos já foram recebidos.
          </div>
        )}
        {data.encerrada && !data.vencedorDefinido && (
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
            <span className="text-xs text-muted-foreground block mb-1">Prazo final</span>
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

        {enderecoFormatado && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1 border-t border-border">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{enderecoFormatado}</span>
          </div>
        )}
      </div>

      {/* Tabela de fornecedores — sempre a mesma, valores aparecem conforme respondem */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Fornecedores ({data.totalFornecedores})</h3>
          {podeSelecionar && (
            <span className="text-xs text-muted-foreground">Selecione o vencedor</span>
          )}
        </div>

        {data.fornecedores.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            Aguardando dados dos fornecedores...
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {podeSelecionar && <TableHead className="w-10"></TableHead>}
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Respondido em</TableHead>
                    {data.vencedorDefinido && <TableHead>Resultado</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFornecedores.map((f) => (
                    <TableRow
                      key={f.nome + f.telefone}
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
                          {f.status === "respondido" && (
                            <input
                              type="radio"
                              name="vencedor"
                              value={f.telefone}
                              checked={telefoneVencedor === f.telefone}
                              onChange={() => { setTelefoneVencedor(f.telefone); setErroVencedor(""); }}
                              className="cursor-pointer accent-primary"
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                          {statusConfig[f.status]?.label ?? f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {f.valor ? `R$ ${f.valor}` : "—"}
                      </TableCell>
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
                          ? new Date(f.respondidoEm).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                              timeZone: "America/Sao_Paulo",
                            })
                          : "—"}
                      </TableCell>
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

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {sortedFornecedores.map((f) => (
                <div
                  key={f.nome + f.telefone}
                  className={`bg-card border border-border rounded-lg p-4 space-y-2 ${
                    f.vencedor ? "border-green-400" : f.statusFinal === "perdedor" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {podeSelecionar && f.status === "respondido" && (
                        <input
                          type="radio"
                          name="vencedor"
                          value={f.telefone}
                          checked={telefoneVencedor === f.telefone}
                          onChange={() => { setTelefoneVencedor(f.telefone); setErroVencedor(""); }}
                          className="cursor-pointer accent-primary"
                        />
                      )}
                      <span className="font-medium text-foreground text-sm">{f.nome}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <Badge variant={statusConfig[f.status]?.variant ?? "secondary"}>
                        {statusConfig[f.status]?.label ?? f.status}
                      </Badge>
                      {f.statusFinal === "vencedor" && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Trophy className="h-3 w-3 mr-1" /> Vencedor
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Valor</span>
                      <span className="font-medium text-foreground">{f.valor ? `R$ ${f.valor}` : "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Prazo</span>
                      <span className="font-medium text-foreground">
                        {(() => {
                          if (f.prazo && f.prazoDias) return `${f.prazo} (${f.prazoDias}d)`;
                          if (f.prazo) return f.prazo;
                          if (f.prazoDias) return `${f.prazoDias} dias`;
                          return "—";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão confirmar vencedor */}
            {podeSelecionar && (
              <div className="space-y-2 pt-1">
                {erroVencedor && <p className="text-sm text-destructive">{erroVencedor}</p>}
                <Button
                  onClick={handleConfirmarVencedor}
                  disabled={!telefoneVencedor || confirmando}
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

      {/* Produtos do pedido — só aparece quando vem da criação */}
      {dadosPedido && dadosPedido.itens.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Produtos do pedido ({dadosPedido.itens.length}) — Peso total: {dadosPedido.pesoTotal}kg — Volumes: {dadosPedido.totalVolumes}
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
