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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image as ImageIcon, GripVertical } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { MediaPicker } from "@/components/media-picker";
import type { Portfolio } from "@shared/schema";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
        {form.imageUrl && (
          <div className="mb-2 rounded-lg overflow-hidden border aspect-video relative bg-muted">
            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <Tabs defaultValue="upload">
          <TabsList className="mb-2">
            <TabsTrigger value="upload">Загрузить</TabsTrigger>
            <TabsTrigger value="library">Из библиотеки</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          </TabsContent>
          <TabsContent value="library">
            <div className="flex items-center gap-3">
              <MediaPicker
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
              {form.imageUrl && (
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setForm({ ...form, imageUrl: "" })}>
                  Очистить
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          <span className="text-sm">Активная</span>
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

function SortableCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Portfolio;
  onEdit: (item: Portfolio) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={!item.isActive ? "opacity-60" : ""}>
        <CardContent className="p-3 flex items-center gap-3">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">{item.description}</p>
            )}
            {!item.isActive && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">Скрыта</span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Изменить
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPortfolio() {
  const { toast } = useToast();
  const [editItem, setEditItem] = useState<Portfolio | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [localItems, setLocalItems] = useState<Portfolio[] | null>(null);

  const { data: items = [], isLoading } = useQuery<Portfolio[]>({
    queryKey: ["/api/portfolio"],
  });

  const displayItems = localItems ?? [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/portfolio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setLocalItems(null);
      toast({ title: "Работа удалена" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      await Promise.all(
        updates.map(({ id, sortOrder }) =>
          apiRequest("PATCH", `/api/portfolio/${id}`, { sortOrder })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setLocalItems(null);
    },
    onError: (e: any) => {
      setLocalItems(null);
      toast({ title: "Ошибка сортировки", description: e.message, variant: "destructive" });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayItems.findIndex((i) => i.id === active.id);
    const newIndex = displayItems.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(displayItems, oldIndex, newIndex);

    setLocalItems(reordered);

    const updates = reordered
      .map((item, idx) => ({ id: item.id, sortOrder: idx }))
      .filter((u, idx) => displayItems[idx]?.id !== u.id);

    reorderMutation.mutate(
      reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Портфолио</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Перетащите карточки для изменения порядка на лендинге
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Добавить работу</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Новая работа</DialogTitle></DialogHeader>
            <PortfolioForm onDone={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : displayItems.length === 0 ? (
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayItems.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  onEdit={(i) => setEditItem(i)}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={editItem !== null} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактировать работу</DialogTitle></DialogHeader>
          {editItem && <PortfolioForm item={editItem} onDone={() => setEditItem(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить работу?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
