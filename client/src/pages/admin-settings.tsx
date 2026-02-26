import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, Mail, MapPin, Clock, Upload, FileText } from "lucide-react";
import { SiTelegram, SiWhatsapp, SiVk, SiInstagram } from "react-icons/si";
import type { SiteSetting } from "@shared/schema";

const MaxIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

const contactFields = [
  { key: "phone", label: "Городской телефон", placeholder: "8 (495) XXX-XX-XX", icon: Phone, color: "" },
  { key: "mobile", label: "Мобильный телефон", placeholder: "8 (9XX) XXX-XX-XX", icon: Phone, color: "" },
  { key: "email", label: "Email", placeholder: "woodiny@mail.ru", icon: Mail, color: "" },
  { key: "address", label: "Адрес", placeholder: "Московская область, г. ...", icon: MapPin, color: "" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/woodiny", icon: SiTelegram, color: "text-[#26A5E4]" },
  { key: "max_messenger", label: "MAX (VK Мессенджер)", placeholder: "https://max.ru/woodiny", icon: MaxIcon, color: "text-[#0077FF]" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/7XXXXXXXXXX", icon: SiWhatsapp, color: "text-[#25D366]" },
  { key: "vk", label: "ВКонтакте", placeholder: "https://vk.com/woodiny", icon: SiVk, color: "text-[#0077FF]" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/woodini", icon: SiInstagram, color: "text-[#E4405F]" },
  { key: "work_hours", label: "Часы работы", placeholder: "Пн-Пт: 9:00-18:00", icon: Clock, color: "" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [values, setValues] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: priceInfo, refetch: refetchPrice } = useQuery<{ exists: boolean; size?: number; modified?: string }>({
    queryKey: ["/api/price-info"],
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const field of contactFields) {
        if (values[field.key] !== undefined) {
          await apiRequest("PUT", `/api/settings/${field.key}`, { value: values[field.key], category: "contacts" });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Контакты сохранены" });
    },
  });

  const [uploading, setUploading] = useState(false);

  const handlePriceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast({ title: "Ошибка", description: "Загрузите файл в формате PDF", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-price", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/octet-stream" },
        body: buffer,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast({ title: "Прайс-лист загружен" });
      refetchPrice();
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (isLoading) return <Skeleton className="h-60 w-full rounded-md" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Настройки контактов</h1>
        <p className="text-sm text-muted-foreground mt-1">Контактная информация для сайта</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Контактная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            className="space-y-4"
          >
            {contactFields.map((f) => (
              <div key={f.key} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className={`h-4 w-4 ${f.color || "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                  <Input
                    data-testid={`input-setting-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button data-testid="button-save-settings" type="submit" disabled={saveMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Прайс-лист</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Загрузите PDF-файл с прайс-листом. Клиенты смогут скачать его после отправки заявки.
          </p>
          {priceInfo?.exists && priceInfo.size && priceInfo.size > 100 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-md bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">price.pdf</span>
                <span className="text-muted-foreground ml-2">
                  ({(priceInfo.size / 1024).toFixed(0)} КБ, обновлён {new Date(priceInfo.modified!).toLocaleDateString("ru-RU")})
                </span>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePriceUpload}
            data-testid="input-price-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="button-upload-price"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Загрузка..." : "Загрузить PDF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
