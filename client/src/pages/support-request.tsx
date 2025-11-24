import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { insertSupportRequestSchema } from "@shared/schema";
import { ArrowLeft, Send, AlertCircle, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithBrand } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SupportRequest() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: product } = useQuery<ProductWithBrand>({
    queryKey: ["/api/products", id],
  });

  const form = useForm({
    resolver: zodResolver(insertSupportRequestSchema),
    defaultValues: {
      productId: id || "",
      issueDescription: "",
      category: "",
      severity: "medium",
    },
  });

  const sendSupportRequest = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/support-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", id] });
      toast({
        title: "Pedido enviado com sucesso!",
        description: "O email foi enviado ao fabricante com os detalhes da avaria.",
      });
      setLocation(`/produto/${id}`);
    },
    onError: () => {
      toast({
        title: "Erro ao enviar pedido",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = () => {
    const formValues = form.getValues();
    console.log("Form values:", formValues);
    console.log("Form errors:", form.formState.errors);
    
    // Validate required fields
    if (!formValues.productId || !formValues.issueDescription || !formValues.category || !formValues.severity) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    sendSupportRequest.mutate(formValues);
  };

  if (!product) {
    return null;
  }

  const purchaseDate = new Date(product.purchaseDate).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/produto/${id}`)} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Reportar Avaria</h1>
            <p className="text-muted-foreground">{product.name} - {product.brand.name}</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Pedido de Assistência ao Fabricante
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Este formulário irá gerar e enviar automaticamente um email para <strong>{product.brand.supportEmail}</strong> com a descrição da avaria, o talão de compra e os dados do produto.
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Descrição do Problema</h2>
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descreva a avaria ou problema</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva em detalhe o problema que está a experienciar com o produto..."
                          className="min-h-32 resize-none"
                          {...field}
                          data-testid="input-issue-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Quanto mais detalhada for a descrição, mais fácil será para o fabricante ajudar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Problema</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="malfunction">Mau Funcionamento</SelectItem>
                          <SelectItem value="defect">Defeito de Fabrico</SelectItem>
                          <SelectItem value="damage">Dano/Avaria</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Severidade</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="low" id="low" data-testid="radio-severity-low" />
                            <label htmlFor="low" className="text-sm font-normal cursor-pointer">
                              Baixa - Problema menor
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="medium" id="medium" data-testid="radio-severity-medium" />
                            <label htmlFor="medium" className="text-sm font-normal cursor-pointer">
                              Média - Impacta utilização
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="high" id="high" data-testid="radio-severity-high" />
                            <label htmlFor="high" className="text-sm font-normal cursor-pointer">
                              Alta - Produto inutilizável
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Email Preview */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Pré-visualização do Email</h2>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <strong>Para:</strong> {product.brand.supportEmail}
                </div>
                <div>
                  <strong>Assunto:</strong> Pedido de Assistência - {product.name} ({product.model})
                </div>
                <Separator />
                <div className="space-y-2">
                  <p><strong>Produto:</strong> {product.name}</p>
                  <p><strong>Modelo:</strong> {product.model}</p>
                  {product.serialNumber && <p><strong>Nº Série:</strong> {product.serialNumber}</p>}
                  <p><strong>Data de Compra:</strong> {purchaseDate}</p>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold mb-1">Descrição do Problema:</p>
                  <p className="text-muted-foreground italic">
                    {form.watch("issueDescription") || "[A sua descrição aparecerá aqui]"}
                  </p>
                </div>
                <Separator />
                <div className="flex gap-2">
                  {product.receiptUrl && (
                    <Badge variant="outline">
                      📎 Talão de compra anexado
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Categoria: {form.watch("category") || "N/A"}
                  </Badge>
                  <Badge variant="outline">
                    Severidade: {form.watch("severity") || "média"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(`/produto/${id}`)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={sendSupportRequest.isPending}
                data-testid="button-send"
              >
                {sendSupportRequest.isPending ? (
                  "A enviar..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Pedido
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
