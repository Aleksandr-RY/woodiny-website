import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

const smtpFields = [
  { key: "smtp_host",      label: "SMTP сервер",         placeholder: "smtp.yandex.ru",       type: "text" },
  { key: "smtp_port",      label: "Порт",                placeholder: "465",                  type: "text" },
  { key: "smtp_user",      label: "Email (от кого)",     placeholder: "info@woodiny.ru",      type: "text" },
  { key: "smtp_pass",      label: "Пароль",              placeholder: "••••••••",             type: "password" },
  { key: "smtp_to",        label: "Получатель (кому)",   placeholder: "manager@woodiny.ru",   type: "text" },
  { key: "smtp_from_name", label: "Имя отправителя",     placeholder: "Woodiny",              type: "text" },
  { key: "smtp_subject",   label: "Тема письма",         placeholder: "Новая заявка от {name}", type: "text" },
  { key: "smtp_cc",        label: "Копия (CC)",          placeholder: "director@woodiny.ru",  type: "text" },
  { key: "smtp_bcc",       label: "Скрытая копия (BCC)", placeholder: "",                     type: "text" },
];

type TestState = "idle" | "loading" | "success" | "error";

export default function AdminEmail() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [sslEnabled, setSslEnabled] = useState(true);
  const [testState, setTestState] = useState<TestState>("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);

      const secure = map["smtp_secure"];
      const port = map["smtp_port"] || "465";
      if (secure !== undefined && secure !== "") {
        setSslEnabled(secure === "1");
      } else {
        setSslEnabled(port === "465");
      }
    }
  }, [settings]);

  const isConfigured = !!(values["smtp_host"] && values["smtp_user"] && values["smtp_pass"]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const field of smtpFields) {
        await apiRequest("PUT", `/api/settings/${field.key}`, { value: values[field.key] ?? "", category: "smtp" });
      }
      await apiRequest("PUT", "/api/settings/smtp_secure", { value: sslEnabled ? "1" : "0", category: "smtp" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Настройки почты сохранены" });
    },
  });

  const handleTest = async () => {
    setTestState("loading");
    setTestMsg("");
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* HTML response */ }
      if (!res.ok || !data.ok) {
        setTestState("error");
        setTestMsg(data.message || (text.startsWith("<") ? `Ошибка ${res.status}: маршрут не найден на сервере` : text));
      } else {
        setTestState("success");
        setTestMsg(data.message || "Письмо отправлено");
      }
    } catch (e: any) {
      setTestState("error");
      setTestMsg(e.message || "Ошибка сети");
    }
  };

  if (isLoading) return <Skeleton className="h-80 w-full rounded-md" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email уведомления</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Настройки отправки писем при поступлении новых заявок
        </p>
      </div>

      {/* Статус */}
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 mb-6 text-sm ${
        isConfigured
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}>
        {isConfigured
          ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
        }
        <span>
          {isConfigured
            ? `SMTP настроен — письма будут приходить на ${values["smtp_to"] || values["smtp_user"] || "указанный адрес"}`
            : "SMTP не настроен — заполните сервер, email и пароль чтобы включить уведомления"
          }
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Основные параметры */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Параметры подключения</CardTitle>
            <CardDescription>Сервер, порт, учётные данные</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smtpFields.slice(0, 5).map((f) => (
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

            {/* SSL / TLS toggle */}
            <div>
              <label className="text-sm font-medium mb-2 block">Шифрование</label>
              <div className="flex rounded-md border overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => { setSslEnabled(true); setValues({ ...values, smtp_port: "465" }); }}
                  className={`flex-1 px-3 py-2 transition-colors ${sslEnabled ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  SSL (порт 465)
                </button>
                <button
                  type="button"
                  onClick={() => { setSslEnabled(false); setValues({ ...values, smtp_port: "587" }); }}
                  className={`flex-1 px-3 py-2 transition-colors ${!sslEnabled ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  TLS / STARTTLS (порт 587)
                </button>
              </div>
            </div>

            {/* Провайдеры */}
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm mb-1.5">Настройки провайдеров:</p>
              <p>• <strong>Яндекс.Почта:</strong> smtp.yandex.ru, порт 465, SSL</p>
              <p>• <strong>Gmail:</strong> smtp.gmail.com, порт 587, TLS</p>
              <p>• <strong>Mail.ru:</strong> smtp.mail.ru, порт 465, SSL</p>
            </div>
          </CardContent>
        </Card>

        {/* Дополнительные параметры */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Оформление письма</CardTitle>
            <CardDescription>Имя отправителя, тема, копии</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {smtpFields.slice(5).map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                <Input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
                {f.key === "smtp_subject" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Используйте <code className="bg-muted px-1 rounded">{"{name}"}</code> для подстановки имени клиента
                  </p>
                )}
              </div>
            ))}

            {/* Тест */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Тестовое письмо</p>
              <p className="text-xs text-muted-foreground mb-3">
                Отправит письмо на адрес получателя с текущими сохранёнными настройками
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testState === "loading" || !isConfigured}
                className="w-full"
              >
                {testState === "loading"
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправка...</>
                  : <><Send className="mr-2 h-4 w-4" /> Отправить тестовое письмо</>
                }
              </Button>

              {testState === "success" && (
                <div className="flex items-center gap-2 mt-3 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  {testMsg}
                </div>
              )}
              {testState === "error" && (
                <div className="flex items-start gap-2 mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  {testMsg}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Сохранить */}
      <div className="mt-6">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </div>
    </div>
  );
}
