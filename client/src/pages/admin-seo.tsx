import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Share2 } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

const seoFields = [
  { key: "seo_title", label: "Title (заголовок страницы)", placeholder: "ВУДИНИ — Крупносерийное производство изделий из дерева", group: "meta" },
  { key: "seo_description", label: "Meta Description", placeholder: "Собственное производство в Московской области...", textarea: true, group: "meta" },
  { key: "seo_keywords", label: "Meta Keywords", placeholder: "деревянные изделия, производство, оптом, B2B", group: "meta" },
  { key: "og_title", label: "Open Graph Title", placeholder: "ВУДИНИ — Деревянные изделия для бизнеса", group: "og" },
  { key: "og_description", label: "Open Graph Description", placeholder: "Крупносерийное производство...", textarea: true, group: "og" },
  { key: "og_image", label: "Open Graph Image URL", placeholder: "https://...", group: "og" },
];

export default function AdminSEO() {
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
      for (const field of seoFields) {
        if (values[field.key] !== undefined) {
          await apiRequest("PUT", `/api/settings/${field.key}`, { value: values[field.key], category: "seo" });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "SEO-настройки сохранены" });
    },
  });

  if (isLoading) return <Skeleton className="h-60 w-full rounded-md" />;

  const metaFields = seoFields.filter(f => f.group === "meta");
  const ogFields = seoFields.filter(f => f.group === "og");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-seo-title">SEO-настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Мета-теги и Open Graph для поисковых систем</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Мета-теги
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metaFields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                {f.textarea ? (
                  <Textarea
                    data-testid={`input-seo-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    data-testid={`input-seo-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Open Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ogFields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                {f.textarea ? (
                  <Textarea
                    data-testid={`input-seo-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    data-testid={`input-seo-${f.key}`}
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button data-testid="button-save-seo" type="submit" disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
