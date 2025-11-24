import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { insertClientProfileSchema } from "@shared/schema";
import { User, Save } from "lucide-react";
import type { ClientProfile } from "@shared/schema";

export default function ClientProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<ClientProfile>({
    queryKey: ["/api/profile"],
  });

  const form = useForm({
    resolver: zodResolver(insertClientProfileSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      email: profile?.email || "",
      phoneNumber: profile?.phoneNumber || "",
      taxNumber: profile?.taxNumber || "",
      address: profile?.address || "",
      city: profile?.city || "",
      postalCode: profile?.postalCode || "",
    },
  });

  const saveProfile = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Perfil guardado",
        description: "Os seus dados foram atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao guardar perfil.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Dados pessoais para pedidos de assistência</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Estes dados serão incluídos automaticamente nos emails de assistência enviados aos fabricantes.
          </p>
        </Card>

        {/* Form */}
        <Card className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveProfile.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Seu nome" 
                          {...field}
                          data-testid="input-fullname"
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
                          placeholder="seu@email.com"
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto *</FormLabel>
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

                {/* Tax Number */}
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribuinte (NIF)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456789"
                          {...field}
                          data-testid="input-nif"
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Morada *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, número, complementos"
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
                          placeholder="Lisboa"
                          {...field}
                          data-testid="input-city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Postal Code */}
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1000-000"
                          {...field}
                          data-testid="input-postal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={saveProfile.isPending}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveProfile.isPending ? "Guardando..." : "Guardar Perfil"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
