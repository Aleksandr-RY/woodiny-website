import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Mail, Phone, Building2, Calendar, Inbox } from "lucide-react";
import type { Inquiry } from "@shared/schema";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Новая", variant: "destructive" },
  in_progress: { label: "В работе", variant: "default" },
  closed: { label: "Закрыта", variant: "secondary" },
};

export default function AdminInquiries() {
  const { toast } = useToast();
  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({ queryKey: ["/api/inquiries"] });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/inquiries/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inquiries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Заявка удалена" });
    },
  });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-md" />)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-inquiries-title">Заявки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление входящими заявками с сайта</p>
      </div>
      {!inquiries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Заявок пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Новые заявки появятся здесь</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id} data-testid={`card-inquiry-${inq.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg" data-testid={`text-inquiry-name-${inq.id}`}>{inq.name}</span>
                      <Badge variant={statusMap[inq.status]?.variant || "outline"} data-testid={`badge-status-${inq.id}`}>
                        {statusMap[inq.status]?.label || inq.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {inq.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{inq.phone}</span>}
                      {inq.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{inq.email}</span>}
                      {inq.company && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{inq.company}</span>}
                      {inq.createdAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(inq.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </div>
                    {inq.message && <p className="text-sm mt-2 leading-relaxed">{inq.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={inq.status}
                      onValueChange={(status) => updateStatus.mutate({ id: inq.id, status })}
                    >
                      <SelectTrigger className="w-36" data-testid={`select-status-${inq.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Новая</SelectItem>
                        <SelectItem value="in_progress">В работе</SelectItem>
                        <SelectItem value="closed">Закрыта</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(inq.id)}
                      data-testid={`button-delete-inquiry-${inq.id}`}
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
    </div>
  );
}
