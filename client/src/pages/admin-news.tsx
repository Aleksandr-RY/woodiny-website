import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calendar, FileText } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { News } from "@shared/schema";

function NewsForm({ item, onDone }: { item?: News; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: item?.title || "",
    content: item?.content || "",
    category: item?.category || "news",
    isPublished: item?.isPublished ?? false,
  });

  const mutation = useMutation({
    mutationFn: () => item
      ? apiRequest("PATCH", `/api/news/${item.id}`, form)
      : apiRequest("POST", "/api/news", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: item ? "Обновлено" : "Добавлено" });
      onDone();
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Заголовок</label>
        <Input data-testid="input-news-title" placeholder="Заголовок публикации" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Содержание</label>
        <RichTextEditor
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          placeholder="Текст публикации..."
          minHeight="250px"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Категория</label>
        <Select value={form.category || "news"} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger data-testid="select-news-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="news">Новость</SelectItem>
            <SelectItem value="promo">Акция</SelectItem>
            <SelectItem value="offer">Спецпредложение</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} data-testid="switch-news-published" />
        <span className="text-sm">Опубликовать</span>
      </div>
      <Button data-testid="button-save-news" type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}

export default function AdminNews() {
  const { toast } = useToast();
  const { data: newsList, isLoading } = useQuery<News[]>({ queryKey: ["/api/news"] });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<News | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Удалено" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Ошибка удаления", variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-md" />;

  const catLabels: Record<string, string> = { news: "Новость", promo: "Акция", offer: "Спецпредложение" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-news-title">Новости и акции</h1>
          <p className="text-sm text-muted-foreground mt-1">{newsList?.length || 0} публикаций</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-news"><Plus className="mr-2 h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Новая публикация</DialogTitle></DialogHeader>
            <NewsForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {!newsList?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Публикаций пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Создайте новость или акцию</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {newsList.map((n) => (
            <Card key={n.id} data-testid={`card-news-${n.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold" data-testid={`text-news-title-${n.id}`}>{n.title}</span>
                      <Badge variant={n.isPublished ? "default" : "secondary"}>
                        {n.isPublished ? "Опубликовано" : "Черновик"}
                      </Badge>
                      <Badge variant="outline">{catLabels[n.category || "news"] || n.category}</Badge>
                    </div>
                    <p
                      className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: n.content.replace(/<[^>]+>/g, " ").trim() }}
                    />
                    {n.createdAt && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-news-${n.id}`}><Pencil className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
                        <NewsForm item={n} onDone={() => {}} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(n)}
                      data-testid={`button-delete-news-${n.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить публикацию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.title}» будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
