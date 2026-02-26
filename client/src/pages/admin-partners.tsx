import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building, Upload, Image } from "lucide-react";
import type { Partner } from "@shared/schema";

function PartnerForm({ partner, onDone }: { partner?: Partner; onDone: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: partner?.name || "",
    logoUrl: partner?.logoUrl || "",
    brandColor: partner?.brandColor || "",
    isActive: partner?.isActive ?? true,
    sortOrder: partner?.sortOrder ?? 0,
  });

  const mutation = useMutation({
    mutationFn: () => partner
      ? apiRequest("PATCH", `/api/partners/${partner.id}`, form)
      : apiRequest("POST", "/api/partners", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: partner ? "Партнёр обновлён" : "Партнёр добавлен" });
      onDone();
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partner) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (!["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) {
      toast({ title: "Поддерживаются PNG, JPG, SVG, WEBP", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch(`/api/upload-partner-logo/${partner.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/octet-stream", "X-File-Ext": ext },
        body: buffer,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm({ ...form, logoUrl: data.logoUrl });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Логотип загружен" });
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Название компании</label>
        <Input data-testid="input-partner-name" placeholder="ООО «Компания»" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      {partner && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Логотип</label>
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt={form.name} className="w-16 h-16 rounded-md object-contain bg-muted p-2" />
            ) : (
              <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                <Image className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={handleLogoUpload} data-testid="input-partner-logo-file" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload-partner-logo">
                <Upload className="mr-2 h-3.5 w-3.5" />
                {uploading ? "Загрузка..." : "Загрузить"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG, WEBP до 2 МБ</p>
            </div>
          </div>
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Или URL логотипа</label>
        <Input data-testid="input-partner-logo" placeholder="https://..." value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Цвет бренда</label>
        <div className="flex items-center gap-2">
          <input type="color" value={form.brandColor || "#333333"} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="w-10 h-9 rounded border cursor-pointer" data-testid="input-partner-color" />
          <Input data-testid="input-partner-color-text" placeholder="#E21B1B" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="flex-1" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-partner-active" />
          <span className="text-sm">Активный</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Порядок:</label>
          <Input data-testid="input-partner-sort" type="number" className="w-20" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </div>
      </div>
      <Button data-testid="button-save-partner" type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}

export default function AdminPartners() {
  const { toast } = useToast();
  const { data: partners, isLoading } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const [addOpen, setAddOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Партнёр удалён" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-md" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-partners-title">Партнёры</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление блоком «Нам доверяют»</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-partner"><Plus className="mr-2 h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый партнёр</DialogTitle></DialogHeader>
            <PartnerForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {!partners?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Партнёров пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Добавьте партнёров для раздела «Нам доверяют»</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {partners.map((p) => (
            <Card key={p.id} data-testid={`card-partner-${p.id}`}>
              <CardContent className="p-4 flex items-center gap-3">
                {p.logoUrl ? (
                  <img src={p.logoUrl} alt={p.name} className="w-12 h-12 rounded-md object-contain bg-muted p-1 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block" data-testid={`text-partner-name-${p.id}`} style={p.brandColor ? {color: p.brandColor} : {}}>{p.name}</span>
                  {p.brandColor && <span className="text-xs text-muted-foreground">{p.brandColor}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-edit-partner-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
                      <PartnerForm partner={p} onDone={() => {}} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-partner-${p.id}`}>
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
