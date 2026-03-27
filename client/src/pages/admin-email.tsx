import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

const smtpFields = [
  { key: "smtp_host", label: "SMTP сервер", placeholder: "smtp.yandex.ru", type: "text" },
  { key: "smtp_port", label: "Порт", placeholder: "465", type: "text" },
  { key: "smtp_user", label: "Email (от кого)", placeholder: "info@woodiny.ru", type: "text" },
  { key: "smtp_pass", label: "Пароль", placeholder: "••••••••", type: "password" },
  { key: "smtp_to", label: "Получатель (кому)", placeholder: "manager@woodiny.ru", type: "text" },
];

export default function AdminEmail() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const field of smtpFields) {
        await apiRequest("PUT", `/api/settings/${field.key}`, { value: values[field.key] ?? "", category: "smtp" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Настройки почты сохранены" });
    },
  });

  if (isLoading) return <Skeleton className="h-60 w-full rounded-md" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email уведомления</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Настройки отправки писем при поступлении новых заявок
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Параметры SMTP</CardTitle>
          <CardDescription>
            После сохранения новые заявки будут приходить на указанный адрес. Перезапуск сервера не требуется.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            className="space-y-5"
          >
            {smtpFields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                <Input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  autoComplete={f.type === "password" ? "new-password" : undefined}
                />
              </div>
            ))}

            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Подсказки по настройке:</p>
              <p>• Яндекс.Почта: сервер <code className="bg-background px-1 rounded">smtp.yandex.ru</code>, порт <code className="bg-background px-1 rounded">465</code></p>
              <p>• Gmail: сервер <code className="bg-background px-1 rounded">smtp.gmail.com</code>, порт <code className="bg-background px-1 rounded">587</code></p>
              <p>• Mail.ru: сервер <code className="bg-background px-1 rounded">smtp.mail.ru</code>, порт <code className="bg-background px-1 rounded">465</code></p>
            </div>

            <div className="pt-1">
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
