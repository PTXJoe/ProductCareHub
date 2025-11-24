import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Star, Users, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsData = {
  topRatedProviders: Array<{ id: string; name: string; rating: number; reviewCount: number }>;
  topBrands: Array<{ id: string; name: string; productCount: number }>;
  topProducts: Array<{ id: string; name: string; rating: number; reviewCount: number }>;
  stats: {
    totalProducts: number;
    totalProviders: number;
    avgWarrantyExpiration: number;
  };
};

export default function Analytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const [products, providers, reviews] = await Promise.all([
        fetch("/api/products").then(r => r.json()),
        fetch("/api/service-providers").then(r => r.json()),
        fetch("/api/community/reviews").then(r => r.json()),
      ]);

      // Calculate top brands
      const brandCounts: { [key: string]: { name: string; count: number; id: string } } = {};
      products.forEach((p: any) => {
        if (!brandCounts[p.brandId]) {
          brandCounts[p.brandId] = { name: p.brand.name, count: 0, id: p.brandId };
        }
        brandCounts[p.brandId].count++;
      });

      // Calculate top rated providers
      const providerRatings: { [key: string]: { name: string; ratings: number[]; id: string } } = {};
      providers.forEach((p: any) => {
        providerRatings[p.id] = { name: p.name, ratings: [], id: p.id };
      });
      reviews.forEach((r: any) => {
        if (r.providerId) {
          if (!providerRatings[r.providerId]) {
            providerRatings[r.providerId] = { name: "Unknown", ratings: [], id: r.providerId };
          }
          providerRatings[r.providerId].ratings.push(r.rating);
        }
      });

      // Calculate top products by rating
      const productRatings: { [key: string]: { name: string; ratings: number[]; brand: string; id: string } } = {};
      products.forEach((p: any) => {
        productRatings[p.id] = { name: p.name, ratings: [], brand: p.brand.name, id: p.id };
      });
      reviews.forEach((r: any) => {
        if (productRatings[r.productId]) {
          productRatings[r.productId].ratings.push(r.rating);
        }
      });

      return {
        topRatedProviders: Object.values(providerRatings)
          .filter(p => p.ratings.length > 0)
          .map(p => ({
            id: p.id,
            name: p.name,
            rating: Math.round((p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) * 10) / 10,
            reviewCount: p.ratings.length,
          }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5),
        topBrands: Object.values(brandCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(b => ({ id: b.id, name: b.name, productCount: b.count })),
        topProducts: Object.values(productRatings)
          .filter(p => p.ratings.length > 0)
          .map(p => ({
            id: p.id,
            name: `${p.name} (${p.brand})`,
            rating: Math.round((p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) * 10) / 10,
            reviewCount: p.ratings.length,
          }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5),
        stats: {
          totalProducts: products.length,
          totalProviders: providers.length,
          avgWarrantyExpiration: Math.round(
            products.reduce((sum: number, p: any) => {
              const days = Math.ceil(
                (new Date(p.warrantyExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + Math.max(days, 0);
            }, 0) / (products.length || 1)
          ),
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-4xl font-bold mb-8">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-2">Estatísticas globais da plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Package className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Produtos Registados</p>
              <p className="text-3xl font-bold">{data?.stats.totalProducts || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Provedores</p>
              <p className="text-3xl font-bold">{data?.stats.totalProviders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-12 w-12 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Dias Médios de Garantia</p>
              <p className="text-3xl font-bold">{data?.stats.avgWarrantyExpiration || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Brands */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Marcas Mais Populares</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.topBrands || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="productCount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Providers */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Melhores Provedores</h2>
          <div className="space-y-4">
            {(data?.topRatedProviders || []).map(provider => (
              <div key={provider.id} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.reviewCount} avaliações</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{provider.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Produtos Melhor Avaliados</h2>
          <div className="space-y-3">
            {(data?.topProducts || []).map(product => (
              <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.reviewCount} reviews</p>
                </div>
                <Badge variant="outline" className="flex gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {product.rating}/5
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
