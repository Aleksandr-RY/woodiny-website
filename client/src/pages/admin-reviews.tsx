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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Star, MessageCircle } from "lucide-react";
import type { Review } from "@shared/schema";

function ReviewForm({ review, onDone }: { review?: Review; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    authorName: review?.authorName || "",
    company: review?.company || "",
    text: review?.text || "",
    rating: review?.rating ?? 5,
    isActive: review?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: () => review
      ? apiRequest("PATCH", `/api/reviews/${review.id}`, form)
      : apiRequest("POST", "/api/reviews", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: review ? "Отзыв обновлён" : "Отзыв добавлен" });
      onDone();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Автор</label>
          <Input data-testid="input-review-author" placeholder="Имя автора" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Компания</label>
          <Input data-testid="input-review-company" placeholder="Название компании" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Текст отзыва</label>
        <Textarea data-testid="input-review-text" placeholder="Текст отзыва" rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Рейтинг:</label>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                <Star className={`h-5 w-5 ${n <= form.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-review-active" />
          <span className="text-sm">Активный</span>
        </div>
      </div>
      <Button data-testid="button-save-review" type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const { data: reviews, isLoading } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });
  const [addOpen, setAddOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Отзыв удалён" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-md" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-reviews-title">Отзывы и кейсы</h1>
          <p className="text-sm text-muted-foreground mt-1">{reviews?.length || 0} отзывов</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-review"><Plus className="mr-2 h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый отзыв</DialogTitle></DialogHeader>
            <ReviewForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {!reviews?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Отзывов пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Добавьте отзывы клиентов</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} data-testid={`card-review-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{r.authorName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold" data-testid={`text-review-author-${r.id}`}>{r.authorName}</span>
                      {r.company && <span className="text-sm text-muted-foreground">{r.company}</span>}
                      <div className="flex">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{r.text}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-review-${r.id}`}><Pencil className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
                        <ReviewForm review={r} onDone={() => {}} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-review-${r.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
