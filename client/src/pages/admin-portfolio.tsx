import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import type { Portfolio } from "@shared/schema";

function PortfolioForm({ item, onDone }: { item?: Portfolio; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    imageUrl: item?.imageUrl || "",
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: () => item
      ? apiRequest("PATCH", `/api/portfolio/${item.id}`, form)
      : apiRequest("POST", "/api/portfolio", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: item ? "Работа обновлена" : "Работа добавлена" });
      onDone();
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Название</label>
        <Input placeholder="Название работы" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Описание</label>
        <Textarea placeholder="Краткое описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Изображение</label>
        <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          <span className="text-sm">Активная</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">Порядок:</label>
          <Input type="number" className="w-20" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Отмена</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminPortfolio() {
  const { toast } = useToast();
  const [editItem, setEditItem] = useState<Portfolio | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: items = [], isLoading } = useQuery<Portfolio[]>({
    queryKey: ["/api/portfolio"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/portfolio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Работа удалена" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Портфолио</h1>
          <p className="text-muted-foreground text-sm mt-1">Управление примерами работ на главной странице</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Добавить работу</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Новая работа</DialogTitle></DialogHeader>
            <PortfolioForm onDone={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Работы ещё не добавлены</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />Добавить первую работу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={!item.isActive ? "opacity-60" : ""}>
              <div className="aspect-video relative bg-muted rounded-t-xl overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {!item.isActive && (
                  <div className="absolute top-2 right-2 bg-muted/90 text-muted-foreground text-xs px-2 py-0.5 rounded">Скрыта</div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{item.title}</h3>
                {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                <div className="flex gap-2 mt-3">
                  <Dialog open={editItem?.id === item.id} onOpenChange={(o) => !o && setEditItem(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditItem(item)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Изменить
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Редактировать работу</DialogTitle></DialogHeader>
                      {editItem && <PortfolioForm item={editItem} onDone={() => setEditItem(null)} />}
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить работу?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
