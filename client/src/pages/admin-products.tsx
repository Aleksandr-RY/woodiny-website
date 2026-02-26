import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, PackageOpen } from "lucide-react";
import type { Product } from "@shared/schema";

function ProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    price: product?.price || "",
    imageUrl: product?.imageUrl || "",
    isActive: product?.isActive ?? true,
    sortOrder: product?.sortOrder ?? 0,
  });

  const mutation = useMutation({
    mutationFn: () => product
      ? apiRequest("PATCH", `/api/products/${product.id}`, form)
      : apiRequest("POST", "/api/products", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: product ? "Товар обновлён" : "Товар добавлен" });
      onDone();
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Название</label>
        <Input data-testid="input-product-name" placeholder="Название товара" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Описание</label>
        <Textarea data-testid="input-product-desc" placeholder="Описание товара" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Категория</label>
          <Input data-testid="input-product-category" placeholder="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Цена</label>
          <Input data-testid="input-product-price" placeholder="от 150 руб." value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">URL изображения</label>
        <Input data-testid="input-product-image" placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-product-active" />
          <span className="text-sm">Активный</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Порядок:</label>
          <Input data-testid="input-product-sort" type="number" className="w-20" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </div>
      </div>
      <Button data-testid="button-save-product" type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}

export default function AdminProducts() {
  const { toast } = useToast();
  const { data: products, isLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Товар удалён" });
    },
  });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-md" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-products-title">Каталог товаров</h1>
          <p className="text-sm text-muted-foreground mt-1">{products?.length || 0} товаров</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product"><Plus className="mr-2 h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый товар</DialogTitle></DialogHeader>
            <ProductForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {!products?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Товаров пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Добавьте первый товар в каталог</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} data-testid={`card-product-${p.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-md object-cover shrink-0 bg-muted" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <PackageOpen className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate" data-testid={`text-product-name-${p.id}`}>{p.name}</p>
                    {!p.isActive && <Badge variant="secondary">Скрыт</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{p.category} {p.price && `\u2022 ${p.price}`}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditProduct(p)} data-testid={`button-edit-product-${p.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Редактировать товар</DialogTitle></DialogHeader>
                      <ProductForm product={editProduct || p} onDone={() => setEditProduct(null)} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-product-${p.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
