import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Phone, Mail, UserCircle } from "lucide-react";
import type { Staff } from "@shared/schema";

function StaffForm({ member, onDone }: { member?: Staff; onDone: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: member?.name || "",
    position: member?.position || "",
    phone: member?.phone || "",
    email: member?.email || "",
    department: member?.department || "",
    isActive: member?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: () => member
      ? apiRequest("PATCH", `/api/staff/${member.id}`, form)
      : apiRequest("POST", "/api/staff", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: member ? "Сотрудник обновлён" : "Сотрудник добавлен" });
      onDone();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">ФИО</label>
        <Input data-testid="input-staff-name" placeholder="Иванов Иван Иванович" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Должность</label>
          <Input data-testid="input-staff-position" placeholder="Менеджер" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Отдел</label>
          <Input data-testid="input-staff-dept" placeholder="Производство" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Телефон</label>
          <Input data-testid="input-staff-phone" placeholder="+7 (XXX) XXX-XX-XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input data-testid="input-staff-email" placeholder="email@woodini.ru" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-staff-active" />
        <span className="text-sm">Активный</span>
      </div>
      <Button data-testid="button-save-staff" type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}

export default function AdminStaff() {
  const { toast } = useToast();
  const { data: staffList, isLoading } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });
  const [addOpen, setAddOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Сотрудник удалён" });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-md" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-staff-title">Сотрудники</h1>
          <p className="text-sm text-muted-foreground mt-1">{staffList?.length || 0} сотрудников</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-staff"><Plus className="mr-2 h-4 w-4" />Добавить</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Новый сотрудник</DialogTitle></DialogHeader>
            <StaffForm onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {!staffList?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Сотрудников пока нет</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Добавьте сотрудников компании</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffList.map((s) => (
            <Card key={s.id} data-testid={`card-staff-${s.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-muted-foreground">{s.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold" data-testid={`text-staff-name-${s.id}`}>{s.name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {s.position && <span className="text-sm text-muted-foreground">{s.position}</span>}
                        {s.department && <Badge variant="outline" className="text-xs">{s.department}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {s.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{s.phone}</span>}
                        {s.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{s.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-staff-${s.id}`}><Pencil className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Редактировать</DialogTitle></DialogHeader>
                        <StaffForm member={s} onDone={() => {}} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} data-testid={`button-delete-staff-${s.id}`}>
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
