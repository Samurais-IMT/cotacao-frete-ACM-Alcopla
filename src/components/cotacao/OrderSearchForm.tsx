import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, FileSearch, MapPin } from "lucide-react";
import logoACM from "@/assets/LOGO_ACM.png";
import { EnderecoDestino } from "@/types/cotacao";

interface OrderSearchFormProps {
  onSubmitNovaCotacao: (numeroPedido: string, endereco: EnderecoDestino) => void;
  onSubmitBuscarCotacao: (cotacaoId: string) => void;
  isLoading: boolean;
  loadingType: "nova" | "buscar" | null;
}

const enderecoVazio: EnderecoDestino = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

const OrderSearchForm = ({
  onSubmitNovaCotacao,
  onSubmitBuscarCotacao,
  isLoading,
  loadingType,
}: OrderSearchFormProps) => {
  const [numeroPedido, setNumeroPedido] = useState("");
  const [cotacaoId, setCotacaoId] = useState("");
  const [endereco, setEndereco] = useState<EnderecoDestino>(enderecoVazio);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepErro, setCepErro] = useState("");

  const setField = (campo: keyof EnderecoDestino, valor: string) => {
    setEndereco((prev) => ({ ...prev, [campo]: valor }));
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    setCepErro("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepErro("CEP não encontrado.");
        return;
      }

      setEndereco((prev) => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch {
      setCepErro("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 8);
    const formatado = valor.length > 5 ? `${valor.slice(0, 5)}-${valor.slice(5)}` : valor;
    setField("cep", formatado);
    setCepErro("");
    if (valor.length === 8) buscarCep(valor);
  };

  const enderecoValido =
    endereco.cep.replace(/\D/g, "").length === 8 &&
    endereco.logradouro.trim() !== "" &&
    endereco.numero.trim() !== "" &&
    endereco.cidade.trim() !== "" &&
    endereco.estado.trim() !== "";

  const handleSubmitNova = (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroPedido.trim() && enderecoValido) {
      onSubmitNovaCotacao(numeroPedido.trim(), endereco);
    }
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

        <form onSubmit={handleSubmitNova} className="space-y-4">
          {/* Número do pedido */}
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

          {/* Endereço de destino */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Endereço de destino</span>
            </div>

            {/* CEP */}
            <div>
              <label htmlFor="cep" className="text-xs text-muted-foreground mb-1 block">
                CEP <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="cep"
                  type="text"
                  placeholder="00000-000"
                  value={endereco.cep}
                  onChange={handleCepChange}
                  disabled={isLoading}
                  className="h-10 pr-8"
                  maxLength={9}
                />
                {buscandoCep && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {cepErro && <p className="text-xs text-destructive mt-1">{cepErro}</p>}
            </div>

            {/* Logradouro + Número */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label htmlFor="logradouro" className="text-xs text-muted-foreground mb-1 block">
                  Logradouro <span className="text-destructive">*</span>
                </label>
                <Input
                  id="logradouro"
                  type="text"
                  placeholder="Rua, Av..."
                  value={endereco.logradouro}
                  onChange={(e) => setField("logradouro", e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div>
                <label htmlFor="numero" className="text-xs text-muted-foreground mb-1 block">
                  Número <span className="text-destructive">*</span>
                </label>
                <Input
                  id="numero"
                  type="text"
                  placeholder="123"
                  value={endereco.numero}
                  onChange={(e) => setField("numero", e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>

            {/* Complemento */}
            <div>
              <label htmlFor="complemento" className="text-xs text-muted-foreground mb-1 block">
                Complemento
              </label>
              <Input
                id="complemento"
                type="text"
                placeholder="Apto, Sala, Bloco..."
                value={endereco.complemento}
                onChange={(e) => setField("complemento", e.target.value)}
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Bairro + Cidade + Estado */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label htmlFor="bairro" className="text-xs text-muted-foreground mb-1 block">
                  Bairro
                </label>
                <Input
                  id="bairro"
                  type="text"
                  placeholder="Bairro"
                  value={endereco.bairro}
                  onChange={(e) => setField("bairro", e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="cidade" className="text-xs text-muted-foreground mb-1 block">
                  Cidade <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cidade"
                  type="text"
                  placeholder="Cidade"
                  value={endereco.cidade}
                  onChange={(e) => setField("cidade", e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div>
                <label htmlFor="estado" className="text-xs text-muted-foreground mb-1 block">
                  UF <span className="text-destructive">*</span>
                </label>
                <Input
                  id="estado"
                  type="text"
                  placeholder="SP"
                  value={endereco.estado}
                  onChange={(e) => setField("estado", e.target.value.toUpperCase().slice(0, 2))}
                  disabled={isLoading}
                  className="h-10"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading || !numeroPedido.trim() || !enderecoValido}
          >
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
          <Button
            type="submit"
            variant="outline"
            className="w-full h-11"
            disabled={isLoading || !cotacaoId.trim()}
          >
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
