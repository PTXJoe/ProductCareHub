import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { insertProductSchema } from "@shared/schema";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, X, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertProductSchema.extend({
  purchaseDate: z.string().min(1, "Data de compra é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: "Marca", description: "Selecione o fabricante" },
  { id: 2, title: "Detalhes", description: "Informação do produto" },
  { id: 3, title: "Talão", description: "Upload da fatura" },
  { id: 4, title: "Fotos", description: "Imagens do produto" },
];

export default function RegisterProduct() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandId: "",
      name: "",
      model: "",
      serialNumber: "",
      category: "",
      purchaseDate: "",
      store: "",
      notes: "",
    },
  });

  const createProduct = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });
      
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }
      
      photoFiles.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });

      return apiRequest("POST", "/api/products", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto registado com sucesso!",
        description: "O produto foi adicionado à sua coleção.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erro ao registar produto",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photoFiles.length > 5) {
      toast({
        title: "Limite de fotos excedido",
        description: "Pode adicionar até 5 fotos.",
        variant: "destructive",
      });
      return;
    }

    setPhotoFiles([...photoFiles, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    createProduct.mutate(data);
  };

  const nextStep = () => setCurrentStep(Math.min(currentStep + 1, STEPS.length));
  const prevStep = () => setCurrentStep(Math.max(currentStep - 1, 1));

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Registar Produto</h1>
            <p className="text-muted-foreground">Adicione um novo produto à sua coleção</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep ? "text-primary" : step.id < currentStep ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-muted"
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Selecione a Marca</h2>
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca do Produto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-brand">
                              <SelectValue placeholder="Escolha a marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands?.map((brand: any) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Escolha a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Eletrodomésticos">Eletrodomésticos</SelectItem>
                            <SelectItem value="Informática">Informática</SelectItem>
                            <SelectItem value="Televisão e Áudio">Televisão e Áudio</SelectItem>
                            <SelectItem value="Telefones">Telefones</SelectItem>
                            <SelectItem value="Fotografia">Fotografia</SelectItem>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Detalhes do Produto</h2>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: iPhone 15 Pro" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A2848" {...field} data-testid="input-model" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série / IMEI (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 123456789" {...field} data-testid="input-serial" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} data-testid="input-purchase-date" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="store"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loja (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Fnac, Worten, Amazon" {...field} data-testid="input-store" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais..." {...field} data-testid="input-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Upload do Talão de Compra</h2>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate transition-colors">
                    {receiptPreview ? (
                      <div className="space-y-4">
                        <img src={receiptPreview} alt="Receipt preview" className="max-h-64 mx-auto rounded-md" />
                        <Button type="button" variant="outline" onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview("");
                        }} data-testid="button-remove-receipt">
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">Clique para fazer upload</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou PDF até 10MB</p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleReceiptUpload}
                          className="hidden"
                          data-testid="input-receipt"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Fotos do Produto</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removePhoto(index)}
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {photoFiles.length < 5 && (
                      <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover-elevate transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-xs text-center text-muted-foreground px-2">Adicionar foto</p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          data-testid="input-photos"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Máximo 5 fotos</p>
                </div>
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep} className="ml-auto" data-testid="button-next">
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" disabled={createProduct.isPending} data-testid="button-submit">
                  {createProduct.isPending ? "A registar..." : "Registar Produto"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
