import { useEffect, useState, useCallback } from "react";
import { AcompanhamentoEmailResponse, FornecedorEmail, ItemCotacao } from "@/types/cotacaoEmail";
import { consultarCotacaoEmail, selecionarVencedorEmail, salvarProposta } from "@/services/cotacaoEmailService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, MapPin, Truck, RefreshCw,
  Trophy, Loader2, AlertCircle, Route as RouteIcon, Save
} from "lucide-react";

interface AcompanhamentoViewEmailProps {
  numeroPedido: string;
  onBack: () => void;
}

interface PropostaLocal {
  valor: string;
  dias: string;
  prazo: string;
  salvando: boolean;
  salvo: boolean;
  erro: string;
}

const AcompanhamentoViewEmail = ({ numeroPedido, onBack }: AcompanhamentoViewEmailProps) => {
  const [data, setData] = useState<AcompanhamentoEmailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erroVencedor, setErroVencedor] = useState("");
  const [propostas, setPropostas] = useState<Record<string, PropostaLocal>>({});

  const carregar = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setErro(null);
    try {
      const res = await consultarCotacaoEmail(numeroPedido);
      if (res.sucesso) {
        setData(res);
        // inicializa propostas com valores do banco
        const inicial: Record<string, PropostaLocal> = {};
        (res.fornecedores || []).forEach(f => {
          inicial[f.email] = {
            valor: f.valorCotado != null ? String(f.valorCotado) : "",
            dias: f.diasCotado != null ? String(f.diasCotado) : "",
            prazo: f.prazoEntrega || "",
            salvando: false,
            salvo: f.valorCotado != null,
            erro: ""
          };
        });
        setPropostas(inicial);
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

  const handleSalvarProposta = async (email: string) => {
    const p = propostas[email];
    if (!p?.valor || !p?.dias || !p?.prazo) {
      setPropostas(prev => ({ ...prev, [email]: { ...prev[email], erro: "Preencha todos os campos." } }));
      return;
    }
    setPropostas(prev => ({ ...prev, [email]: { ...prev[email], salvando: true, erro: "" } }));
    try {
      const res = await salvarProposta(
        numeroPedido,
        email,
        Number(p.valor),
        Number(p.dias),
        p.prazo
      );
      if (res.sucesso) {
        setPropostas(prev => ({ ...prev, [email]: { ...prev[email], salvando: false, salvo: true } }));
      } else {
        setPropostas(prev => ({ ...prev, [email]: { ...prev[email], salvando: false, erro: res.mensagem } }));
      }
    } catch {
      setPropostas(prev => ({ ...prev, [email]: { ...prev[email], salvando: false, erro: "Erro ao salvar." } }));
    }
  };

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

  const todasPropostasSalvas = (fornecedores: FornecedorEmail[]) =>
    fornecedores.every(f => propostas[f.email]?.salvo);

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

  const fornecedores = data.fornecedores || [];
  const podeSelecionar = !data.vencedorDefinido && fornecedores.length > 0 && todasPropostasSalvas(fornecedores);

  const sortedFornecedores = [...fornecedores].sort((a, b) => {
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
          <p className="text-sm text-muted-foreground">Pedido #{data.numeroPedido}</p>
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
          <h3 className="text-lg font-semibold text-foreground">Fornecedores ({fornecedores.length})</h3>
          {!data.vencedorDefinido && !todasPropostasSalvas(fornecedores) && (
            <span className="text-xs text-muted-foreground">Preencha as propostas para selecionar o vencedor</span>
          )}
          {podeSelecionar && (
            <span className="text-xs text-muted-foreground">Selecione o vencedor</span>
          )}
        </div>

        {fornecedores.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
            Nenhum fornecedor contatado para este pedido.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFornecedores.map((f) => {
              const p = propostas[f.email] || { valor: "", dias: "", prazo: "", salvando: false, salvo: false, erro: "" };
              const editavel = !data.vencedorDefinido;

              return (
                <div
                  key={f.email}
                  className={`bg-card border rounded-lg p-4 space-y-3 ${
                    f.vencedor ? "border-green-400 bg-green-50 dark:bg-green-950/20" :
                    f.statusFinal === "perdedor" ? "opacity-50 border-border" : "border-border"
                  }`}
                >
                  {/* Linha superior: radio + nome + email + badge */}
                  <div className="flex items-center gap-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.email}</p>
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

                  {/* Campos de proposta */}
                  {editavel ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Valor (R$)</label>
                          <Input
                            type="number"
                            placeholder="Ex: 1500.00"
                            value={p.valor}
                            onChange={e => setPropostas(prev => ({ ...prev, [f.email]: { ...prev[f.email], valor: e.target.value, salvo: false } }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Dias</label>
                          <Input
                            type="number"
                            placeholder="Ex: 3"
                            value={p.dias}
                            onChange={e => setPropostas(prev => ({ ...prev, [f.email]: { ...prev[f.email], dias: e.target.value, salvo: false } }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Prazo de entrega</label>
                          <Input
                            type="text"
                            placeholder="Ex: 3 dias úteis"
                            value={p.prazo}
                            onChange={e => setPropostas(prev => ({ ...prev, [f.email]: { ...prev[f.email], prazo: e.target.value, salvo: false } }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {p.erro && <p className="text-xs text-destructive">{p.erro}</p>}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={p.salvo ? "outline" : "default"}
                          onClick={() => handleSalvarProposta(f.email)}
                          disabled={p.salvando || (!p.valor || !p.dias || !p.prazo)}
                          className="h-7 text-xs"
                        >
                          {p.salvando ? (
                            <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Salvando...</>
                          ) : p.salvo ? (
                            <><Save className="mr-1 h-3 w-3" />Salvo ✓</>
                          ) : (
                            <><Save className="mr-1 h-3 w-3" />Salvar proposta</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Vencedor definido — exibe valores como texto estático
                    <div className="grid grid-cols-3 gap-4 pt-1 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-sm font-medium text-foreground">
                          {f.valorCotado != null ? `R$ ${Number(f.valorCotado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dias</p>
                        <p className="text-sm font-medium text-foreground">{f.diasCotado ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prazo de entrega</p>
                        <p className="text-sm font-medium text-foreground">{f.prazoEntrega || "—"}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

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

            {!data.vencedorDefinido && !todasPropostasSalvas(fornecedores) && fornecedores.length > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                ⚠️ Salve as propostas de todos os fornecedores para poder selecionar o vencedor.
              </p>
            )}
          </div>
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
                  <TableHead className="text-right">Volumes</TableHead>
                  <TableHead className="text-right">Peso Bruto (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens.map((item: ItemCotacao) => (
                  <TableRow key={item.cod_produto}>
                    <TableCell className="font-mono text-sm">{item.cod_produto}</TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right">{item.volumeItem ?? item.quantidade}</TableCell>
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
                <span className="text-xs text-muted-foreground">Volumes: {item.volumeItem ?? item.quantidade}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcompanhamentoViewEmail;
