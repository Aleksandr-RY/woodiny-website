import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

const smtpConnectionFields = [
  { key: "smtp_host", label: "SMTP сервер",       placeholder: "smtp.yandex.ru",     type: "text" },
  { key: "smtp_port", label: "Порт",              placeholder: "465",                type: "text" },
  { key: "smtp_user", label: "Email (от кого)",   placeholder: "info@woodiny.ru",    type: "text" },
  { key: "smtp_pass", label: "Пароль",            placeholder: "••••••••",           type: "password" },
  { key: "smtp_to",   label: "Получатель (кому)", placeholder: "manager@woodiny.ru", type: "text" },
];

const commonFields = [
  { key: "smtp_from_name", label: "Имя отправителя",     placeholder: "Woodiny",                type: "text" },
  { key: "smtp_subject",   label: "Тема письма",         placeholder: "Новая заявка от {name}", type: "text" },
  { key: "smtp_cc",        label: "Копия (CC)",          placeholder: "director@woodiny.ru",    type: "text" },
  { key: "smtp_bcc",       label: "Скрытая копия (BCC)", placeholder: "",                       type: "text" },
];

type TestState = "idle" | "loading" | "success" | "error";
type Provider = "smtp" | "brevo" | "unisender" | "emailjs";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "smtp",      label: "SMTP" },
  { id: "brevo",     label: "Brevo API" },
  { id: "unisender", label: "Unisender" },
  { id: "emailjs",   label: "EmailJS" },
];

export default function AdminEmail() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [sslEnabled, setSslEnabled] = useState(true);
  const [provider, setProvider] = useState<Provider>("smtp");
  const [testState, setTestState] = useState<TestState>("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
      const p = map["email_provider"] as Provider;
      if (p === "brevo" || p === "unisender") setProvider(p);
      else setProvider("smtp");
      const secure = map["smtp_secure"];
      const port = map["smtp_port"] || "465";
      setSslEnabled(secure !== undefined && secure !== "" ? secure === "1" : port === "465");
    }
  }, [settings]);

  const isSmtpOk      = !!(values["smtp_host"] && values["smtp_user"] && values["smtp_pass"]);
  const isBrevoOk     = !!(values["brevo_api_key"] && values["brevo_from_email"] && values["brevo_to"]);
  const isUnisenderOk = !!(values["unisender_api_key"] && values["unisender_from_email"] && values["unisender_to"]);
  const isEmailJSOk   = !!(values["emailjs_service_id"] && values["emailjs_template_id"] && values["emailjs_public_key"]);
  const isConfigured  = provider === "brevo" ? isBrevoOk : provider === "unisender" ? isUnisenderOk : provider === "emailjs" ? isEmailJSOk : isSmtpOk;

  const set = (key: string, val: string) => setValues((v) => ({ ...v, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/settings/email_provider", { value: provider, category: "email" });

      if (provider === "smtp") {
        for (const f of smtpConnectionFields)
          await apiRequest("PUT", `/api/settings/${f.key}`, { value: values[f.key] ?? "", category: "smtp" });
        await apiRequest("PUT", "/api/settings/smtp_secure", { value: sslEnabled ? "1" : "0", category: "smtp" });
      } else if (provider === "brevo") {
        for (const k of ["brevo_api_key", "brevo_from_email", "brevo_to"])
          await apiRequest("PUT", `/api/settings/${k}`, { value: values[k] ?? "", category: "email" });
      } else if (provider === "unisender") {
        for (const k of ["unisender_api_key", "unisender_from_email", "unisender_to", "unisender_list_id"])
          await apiRequest("PUT", `/api/settings/${k}`, { value: values[k] ?? "", category: "email" });
      } else {
        for (const k of ["emailjs_service_id", "emailjs_template_id", "emailjs_public_key", "emailjs_private_key"])
          await apiRequest("PUT", `/api/settings/${k}`, { value: values[k] ?? "", category: "email" });
      }

      for (const f of commonFields)
        await apiRequest("PUT", `/api/settings/${f.key}`, { value: values[f.key] ?? "", category: "email" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Настройки почты сохранены" });
    },
  });

  const handleTest = async () => {
    setTestState("loading"); setTestMsg("");
    try {
      const res = await fetch("/api/email/test", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      if (!res.ok || !data.ok) {
        setTestState("error");
        setTestMsg(data.message || (text.startsWith("<") ? `Ошибка ${res.status}: проверьте соединение с сервером` : text));
      } else {
        setTestState("success");
        setTestMsg(data.message || "Письмо отправлено");
      }
    } catch (e: any) {
      setTestState("error"); setTestMsg(e.message || "Ошибка сети");
    }
  };

  const statusText = () => {
    if (!isConfigured) {
      if (provider === "brevo")     return "Brevo не настроен — заполните API ключ, email отправителя и получателя";
      if (provider === "unisender") return "Unisender не настроен — заполните API ключ и адреса";
      if (provider === "emailjs")   return "EmailJS не настроен — заполните Service ID, Template ID и Public Key";
      return "SMTP не настроен — заполните сервер, email и пароль";
    }
    if (provider === "brevo")     return `Brevo настроен — письма будут приходить на ${values["brevo_to"]}`;
    if (provider === "unisender") return `Unisender настроен — письма будут приходить на ${values["unisender_to"]}`;
    if (provider === "emailjs")   return "EmailJS настроен — письма отправляются через ваш шаблон";
    return `SMTP настроен — письма будут приходить на ${values["smtp_to"] || values["smtp_user"] || "указанный адрес"}`;
  };

  if (isLoading) return <Skeleton className="h-80 w-full rounded-md" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email уведомления</h1>
        <p className="text-sm text-muted-foreground mt-1">Настройки отправки писем при поступлении новых заявок</p>
      </div>

      {/* Статус */}
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 mb-6 text-sm ${
        isConfigured ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}>
        {isConfigured
          ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />}
        <span>{statusText()}</span>
      </div>

      {/* Переключатель провайдера */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Способ отправки</label>
        <div className="flex rounded-md border overflow-hidden text-sm w-fit">
          {PROVIDERS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`px-5 py-2.5 transition-colors ${i > 0 ? "border-l" : ""} ${
                provider === p.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Левая карточка */}
        {provider === "smtp" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Параметры подключения</CardTitle>
              <CardDescription>Сервер, порт, учётные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {smtpConnectionFields.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                  <Input type={f.type} placeholder={f.placeholder} value={values[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    autoComplete={f.type === "password" ? "new-password" : undefined} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium mb-2 block">Шифрование</label>
                <div className="flex rounded-md border overflow-hidden text-sm">
                  <button type="button"
                    onClick={() => { setSslEnabled(true); set("smtp_port", "465"); }}
                    className={`flex-1 px-3 py-2 transition-colors ${sslEnabled ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                    SSL (порт 465)
                  </button>
                  <button type="button"
                    onClick={() => { setSslEnabled(false); set("smtp_port", "587"); }}
                    className={`flex-1 px-3 py-2 transition-colors ${!sslEnabled ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                    TLS / STARTTLS (порт 587)
                  </button>
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm mb-1.5">Настройки провайдеров:</p>
                <p>• <strong>Яндекс.Почта:</strong> smtp.yandex.ru, порт 465, SSL</p>
                <p>• <strong>Gmail:</strong> smtp.gmail.com, порт 587, TLS</p>
                <p>• <strong>Mail.ru:</strong> smtp.mail.ru, порт 465, SSL</p>
              </div>
            </CardContent>
          </Card>
        )}

        {provider === "brevo" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brevo API</CardTitle>
              <CardDescription>Отправка без SMTP — работает на любом хостинге</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Как получить API ключ:</p>
                <ol className="list-decimal ml-4 space-y-1 text-xs">
                  <li>Зарегистрируйтесь на <strong>brevo.com</strong> (бесплатно, 300 писем/день)</li>
                  <li>Перейдите в Settings → API Keys → Create new key</li>
                  <li>Верифицируйте email отправителя в Senders & IPs</li>
                </ol>
                <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-700 underline text-xs">
                  Открыть Brevo <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">API ключ</label>
                <Input type="password" placeholder="xkeysib-..." value={values["brevo_api_key"] || ""}
                  onChange={(e) => set("brevo_api_key", e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email отправителя</label>
                <Input type="email" placeholder="woodiny@mail.ru" value={values["brevo_from_email"] || ""}
                  onChange={(e) => set("brevo_from_email", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Должен быть верифицирован в Brevo</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Получатель (кому)</label>
                <Input type="email" placeholder="manager@woodiny.ru" value={values["brevo_to"] || ""}
                  onChange={(e) => set("brevo_to", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {provider === "unisender" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unisender API</CardTitle>
              <CardDescription>Российский сервис — работает без ограничений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Как получить API ключ:</p>
                <ol className="list-decimal ml-4 space-y-1 text-xs">
                  <li>Зарегистрируйтесь на <strong>unisender.com</strong> (бесплатно)</li>
                  <li>Перейдите в Настройки → Интеграции → API</li>
                  <li>Создайте список контактов, запишите его ID</li>
                  <li>Верифицируйте email отправителя</li>
                </ol>
                <a href="https://app.unisender.com/ru/settings/api" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-700 underline text-xs">
                  Открыть Unisender <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">API ключ</label>
                <Input type="password" placeholder="xxxxxxxxxxxxxxxx" value={values["unisender_api_key"] || ""}
                  onChange={(e) => set("unisender_api_key", e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email отправителя</label>
                <Input type="email" placeholder="woodiny@mail.ru" value={values["unisender_from_email"] || ""}
                  onChange={(e) => set("unisender_from_email", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Должен быть верифицирован в Unisender</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Получатель (кому)</label>
                <Input type="email" placeholder="manager@woodiny.ru" value={values["unisender_to"] || ""}
                  onChange={(e) => set("unisender_to", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">ID списка контактов</label>
                <Input type="text" placeholder="1" value={values["unisender_list_id"] || ""}
                  onChange={(e) => set("unisender_list_id", e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Найдите в Списки контактов — номер в адресной строке</p>
              </div>
            </CardContent>
          </Card>
        )}

        {provider === "emailjs" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">EmailJS</CardTitle>
              <CardDescription>Отправка через ваш шаблон на emailjs.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Как настроить:</p>
                <ol className="list-decimal ml-4 space-y-1 text-xs">
                  <li>Зарегистрируйтесь на <strong>emailjs.com</strong> (бесплатно, 200 писем/месяц)</li>
                  <li>Add New Service → подключите вашу почту</li>
                  <li>Email Templates → создайте шаблон с переменными: <code className="bg-blue-100 px-1 rounded">{"{{name}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{phone}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{message}}"}</code></li>
                  <li>Account → API Keys → скопируйте Public и Private ключи</li>
                </ol>
                <a href="https://dashboard.emailjs.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-700 underline text-xs">
                  Открыть EmailJS <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Service ID</label>
                <Input placeholder="service_xxxxxxx" value={values["emailjs_service_id"] || ""}
                  onChange={(e) => set("emailjs_service_id", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Template ID</label>
                <Input placeholder="template_xxxxxxx" value={values["emailjs_template_id"] || ""}
                  onChange={(e) => set("emailjs_template_id", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Public Key</label>
                <Input placeholder="xxxxxxxxxxxxxxxxxxxx" value={values["emailjs_public_key"] || ""}
                  onChange={(e) => set("emailjs_public_key", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Private Key</label>
                <Input type="password" placeholder="••••••••••••••••••••" value={values["emailjs_private_key"] || ""}
                  onChange={(e) => set("emailjs_private_key", e.target.value)} autoComplete="new-password" />
                <p className="text-xs text-muted-foreground mt-1">Account → API Keys → Private Key (для серверной отправки)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Правая карточка — оформление + тест */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Оформление письма</CardTitle>
            <CardDescription>Имя отправителя, тема, копии</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {commonFields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                <Input type={f.type} placeholder={f.placeholder} value={values[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)} />
                {f.key === "smtp_subject" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Используйте <code className="bg-muted px-1 rounded">{"{name}"}</code> для подстановки имени клиента
                  </p>
                )}
              </div>
            ))}

            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Тестовое письмо</p>
              <p className="text-xs text-muted-foreground mb-3">
                Отправит письмо с текущими <strong>сохранёнными</strong> настройками
              </p>
              <Button type="button" variant="outline" onClick={handleTest}
                disabled={testState === "loading" || !isConfigured} className="w-full">
                {testState === "loading"
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправка...</>
                  : <><Send className="mr-2 h-4 w-4" /> Отправить тестовое письмо</>}
              </Button>
              {testState === "success" && (
                <div className="flex items-center gap-2 mt-3 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />{testMsg}
                </div>
              )}
              {testState === "error" && (
                <div className="flex items-start gap-2 mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />{testMsg}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </div>
    </div>
  );
}
