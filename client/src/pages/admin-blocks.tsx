import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronUp, ChevronDown, Pencil, Eye, EyeOff,
  LayoutTemplate, Layers, Star, Package, Image as ImageIcon,
  Settings2, Phone, Users, Plus, Trash2
} from "lucide-react";
import type { Block } from "@shared/schema";

const BLOCK_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  hero:      { label: "Главный экран (Hero)",     icon: LayoutTemplate, color: "bg-amber-100 text-amber-800" },
  clients:   { label: "Клиенты / Партнёры",       icon: Users,          color: "bg-blue-100 text-blue-800" },
  features:  { label: "Преимущества",              icon: Star,           color: "bg-green-100 text-green-800" },
  products:  { label: "Каталог продукции",         icon: Package,        color: "bg-purple-100 text-purple-800" },
  portfolio: { label: "Портфолио",                 icon: ImageIcon,      color: "bg-rose-100 text-rose-800" },
  process:   { label: "Как мы работаем",           icon: Settings2,      color: "bg-orange-100 text-orange-800" },
  contacts:  { label: "Контакты",                  icon: Phone,          color: "bg-teal-100 text-teal-800" },
};

function HeroEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Заголовок главного экрана" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Подзаголовок</label>
        <Textarea rows={3} value={data.subtitle || ""} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} placeholder="Описание под заголовком" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Текст кнопки</label>
          <Input value={data.cta || ""} onChange={(e) => onChange({ ...data, cta: e.target.value })} placeholder="Оставить заявку" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Текст второй кнопки</label>
          <Input value={data.ctaSecondary || ""} onChange={(e) => onChange({ ...data, ctaSecondary: e.target.value })} placeholder="Каталог продукции" />
        </div>
      </div>
    </div>
  );
}

function ClientsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Нам доверяют" />
      </div>
      <p className="text-sm text-muted-foreground">Партнёры берутся из раздела «Партнёры» автоматически.</p>
    </div>
  );
}

function FeaturesEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const items: any[] = data.items || [];
  const updateItem = (idx: number, field: string, val: string) => {
    const next = items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    onChange({ ...data, items: next });
  };
  const addItem = () => onChange({ ...data, items: [...items, { icon: "star", title: "", description: "" }] });
  const removeItem = (idx: number) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок раздела</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Почему выбирают нас" />
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="Название" value={item.title || ""} onChange={(e) => updateItem(idx, "title", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={2} placeholder="Описание" value={item.description || ""} onChange={(e) => updateItem(idx, "description", e.target.value)} />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1.5" />Добавить преимущество</Button>
    </div>
  );
}

function ProductsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Каталог продукции" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Описание</label>
        <Textarea rows={2} value={data.description || ""} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Описание раздела" />
      </div>
      <p className="text-sm text-muted-foreground">Карточки товаров берутся из раздела «Продукция» автоматически.</p>
    </div>
  );
}

function PortfolioEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Портфолио" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Описание</label>
        <Textarea rows={2} value={data.description || ""} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Описание раздела" />
      </div>
      <p className="text-sm text-muted-foreground">Работы берутся из раздела «Портфолио» автоматически.</p>
    </div>
  );
}

function ProcessEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const steps: any[] = data.steps || [];
  const updateStep = (idx: number, field: string, val: string) => {
    const next = steps.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    onChange({ ...data, steps: next });
  };
  const addStep = () => onChange({ ...data, steps: [...steps, { title: "", description: "" }] });
  const removeStep = (idx: number) => onChange({ ...data, steps: steps.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок раздела</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Как мы работаем" />
      </div>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="border rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}.</span>
              <Input className="flex-1" placeholder="Название шага" value={step.title || ""} onChange={(e) => updateStep(idx, "title", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeStep(idx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={2} placeholder="Описание шага" value={step.description || ""} onChange={(e) => updateStep(idx, "description", e.target.value)} />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus className="h-3.5 w-3.5 mr-1.5" />Добавить шаг</Button>
    </div>
  );
}

function ContactsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Заголовок</label>
        <Input value={data.title || ""} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="Свяжитесь с нами" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Телефон</label>
          <Input value={data.phone || ""} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+7 (495) 000-00-00" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <Input value={data.email || ""} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="info@woodiny.ru" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Адрес</label>
        <Input value={data.address || ""} onChange={(e) => onChange({ ...data, address: e.target.value })} placeholder="Московская область" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">WhatsApp (номер)</label>
        <Input value={data.whatsapp || ""} onChange={(e) => onChange({ ...data, whatsapp: e.target.value })} placeholder="79001234567" />
      </div>
    </div>
  );
}

function BlockEditor({ block, onClose }: { block: Block; onClose: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<any>(() => {
    try { return JSON.parse(block.data); } catch { return {}; }
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/blocks/${block.id}`, { data: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({ title: "Блок сохранён" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const renderEditor = () => {
    switch (block.type) {
      case "hero":      return <HeroEditor data={data} onChange={setData} />;
      case "clients":   return <ClientsEditor data={data} onChange={setData} />;
      case "features":  return <FeaturesEditor data={data} onChange={setData} />;
      case "products":  return <ProductsEditor data={data} onChange={setData} />;
      case "portfolio": return <PortfolioEditor data={data} onChange={setData} />;
      case "process":   return <ProcessEditor data={data} onChange={setData} />;
      case "contacts":  return <ContactsEditor data={data} onChange={setData} />;
      default: return <Textarea rows={10} value={JSON.stringify(data, null, 2)} onChange={(e) => { try { setData(JSON.parse(e.target.value)); } catch {} }} className="font-mono text-sm" />;
    }
  };

  const info = BLOCK_LABELS[block.type];
  const Icon = info?.icon || Layers;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-fit ${info?.color || "bg-muted"}`}>
        <Icon className="h-4 w-4" />
        {info?.label || block.type}
      </div>
      {renderEditor()}
      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminBlocks() {
  const { toast } = useToast();
  const [editBlock, setEditBlock] = useState<Block | null>(null);

  const { data: allBlocks = [], isLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/blocks/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/blocks"] }),
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: "up" | "down" }) => {
      const sorted = [...allBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = sorted.findIndex((b) => b.id === id);
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === sorted.length - 1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const current = sorted[idx];
      const swap = sorted[swapIdx];
      await Promise.all([
        apiRequest("PATCH", `/api/blocks/${current.id}`, { order: swap.order }),
        apiRequest("PATCH", `/api/blocks/${swap.id}`, { order: current.order }),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/blocks"] }),
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const sorted = [...allBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Редактор страницы</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Управляйте блоками главной страницы — меняйте порядок, тексты и видимость
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((block, idx) => {
            const info = BLOCK_LABELS[block.type];
            const Icon = info?.icon || Layers;
            return (
              <Card key={block.id} className={`transition-opacity ${!block.isActive ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        disabled={idx === 0 || moveMutation.isPending}
                        onClick={() => moveMutation.mutate({ id: block.id, direction: "up" })}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        disabled={idx === sorted.length - 1 || moveMutation.isPending}
                        onClick={() => moveMutation.mutate({ id: block.id, direction: "down" })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className={`p-2 rounded-lg flex-shrink-0 ${info?.color || "bg-muted"}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{info?.label || block.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {(() => { try { const d = JSON.parse(block.data); return d.title || "—"; } catch { return "—"; } })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={block.isActive ? "default" : "secondary"} className="text-xs">
                        {block.isActive ? "Видимый" : "Скрытый"}
                      </Badge>
                      <Switch
                        checked={block.isActive}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: block.id, isActive: v })}
                      />
                      <Button variant="outline" size="sm" onClick={() => setEditBlock(block)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Редактировать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editBlock !== null} onOpenChange={(o) => !o && setEditBlock(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать блок</DialogTitle>
          </DialogHeader>
          {editBlock && <BlockEditor block={editBlock} onClose={() => setEditBlock(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
