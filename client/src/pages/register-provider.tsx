import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertServiceProviderSchema } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

const districts = [
  "Lisboa", "Porto", "Braga", "Aveiro", "Covilhã", "Faro",
  "Setúbal", "Leiria", "Santarém", "Castelo Branco", "Beja", "Évora"
];

const providerFormSchema = insertServiceProviderSchema.extend({
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  email: z.string().email("Email inválido"),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  district: z.string().min(1, "Distrito é obrigatório"),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

export default function RegisterProvider() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      district: "",
      supportedBrands: [],
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: async (data: ProviderFormValues) => {
      return apiRequest("/api/service-providers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Empresa registada! Aparecerá na lista após verificação.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers"] });
      setTimeout(() => setLocation("/provedores"), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao registar empresa",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/provedores">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Registar Empresa</h1>
            <p className="text-muted-foreground mt-1">
              Registar a sua empresa de assistência técnica
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createProviderMutation.mutate(data))}
              className="space-y-6"
            >
              {/* Company Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da sua empresa"
                        {...field}
                        data-testid="input-company-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+351 XXX XXX XXX"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Website */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.empresa.com"
                        {...field}
                        data-testid="input-website"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Morada *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, número, código postal"
                        {...field}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cidade"
                        {...field}
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* District */}
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-district">
                          <SelectValue placeholder="Selecionar distrito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supported Brands - Simple text list */}
              <FormField
                control={form.control}
                name="supportedBrands"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marcas Suportadas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Separe os nomes das marcas com vírgulas (ex: Apple, Samsung, LG)"
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const brands = e.target.value.split(",").map(b => b.trim()).filter(Boolean);
                          field.onChange(brands);
                        }}
                        data-testid="textarea-brands"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createProviderMutation.isPending}
                data-testid="button-submit-provider"
              >
                {createProviderMutation.isPending ? "Registando..." : "Registar Empresa"}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Info Box */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">Informações Importantes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• O seu registo será revisado antes de aparecer publicamente</li>
            <li>• Certifique-se que a informação está correta e atualizada</li>
            <li>• Os utilizadores podem avaliar a sua empresa após o registo</li>
            <li>• Especifique as marcas que oferece assistência técnica</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
