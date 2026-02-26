import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Eye, LayoutDashboard, Users, BarChart3, Settings2,
  Package, Factory, FileText, MessageCircle, Image
} from "lucide-react";

type SectionData = Record<string, any>;

function useSectionContent(sectionKey: string, defaultValue: SectionData) {
  const { data: allContent } = useQuery<Record<string, SectionData>>({
    queryKey: ["/api/content"],
  });

  const [localData, setLocalData] = useState<SectionData>(defaultValue);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (allContent && allContent[sectionKey]) {
      setLocalData(allContent[sectionKey]);
      setIsDirty(false);
    }
  }, [allContent, sectionKey]);

  const update = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  return { data: localData, update, isDirty, setIsDirty };
}

function SectionField({ label, value, onChange, multiline = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {multiline ? (
        <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value || ""} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function HeroEditor({ onSave }: { onSave: (key: string, data: SectionData) => void }) {
  const defaults = {
    badge: "Собственное производство",
    title: "Деревянные изделия<br>для вашего бизнеса —<br><em>в каждом доме</em>",
    subtitle: "Собственное производство в Московской области. Контроль качества на каждом этапе. Работаем с крупными партиями.",
    text: "Крупносерийное производство изделий из дерева",
  };
  const { data, update, isDirty, setIsDirty } = useSectionContent("hero", defaults);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutDashboard className="h-5 w-5" />
          Герой (главный блок)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionField label="Бейдж" value={data.badge} onChange={v => update("badge", v)} />
        <SectionField label="Заголовок (HTML разрешён: br, em)" value={data.title} onChange={v => update("title", v)} multiline />
        <SectionField label="Подзаголовок" value={data.subtitle} onChange={v => update("subtitle", v)} multiline />
        <SectionField label="Текст под заголовком" value={data.text} onChange={v => update("text", v)} />
        <Button disabled={!isDirty} onClick={() => { onSave("hero", data); setIsDirty(false); }} data-testid="button-save-hero">
          <Save className="mr-2 h-4 w-4" />Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

function ClientsEditor({ onSave }: { onSave: (key: string, data: SectionData) => void }) {
  const defaults = {
    label: "Наши клиенты",
    title: "Кому мы подходим",
    desc: "Работаем с бизнесом, которому нужны стабильные поставки качественных деревянных изделий",
  };
  const { data, update, isDirty, setIsDirty } = useSectionContent("clients", defaults);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Клиенты
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionField label="Подпись" value={data.label} onChange={v => update("label", v)} />
        <SectionField label="Заголовок" value={data.title} onChange={v => update("title", v)} />
        <SectionField label="Описание" value={data.desc} onChange={v => update("desc", v)} multiline />
        <Button disabled={!isDirty} onClick={() => { onSave("clients", data); setIsDirty(false); }} data-testid="button-save-clients">
          <Save className="mr-2 h-4 w-4" />Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

function StatsEditor({ onSave }: { onSave: (key: string, data: SectionData) => void }) {
  const defaultStats = [
    { count: "100000", suffix: "", label: "изделий в месяц" },
    { count: "1500", suffix: " м²", label: "производственных площадей" },
    { count: "10", suffix: "+", label: "лет на рынке" },
    { count: "50", suffix: "+", label: "постоянных клиентов" },
  ];

  const { data: allContent } = useQuery<Record<string, SectionData>>({
    queryKey: ["/api/content"],
  });

  const [stats, setStats] = useState(defaultStats);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (allContent && allContent["stats"]) {
      const loaded = allContent["stats"];
      const merged = defaultStats.map((d, i) => ({
        count: loaded[i]?.count ?? d.count,
        suffix: loaded[i]?.suffix ?? d.suffix,
        label: loaded[i]?.label ?? d.label,
      }));
      setStats(merged);
      setIsDirty(false);
    }
  }, [allContent]);

  const updateStat = (idx: number, field: string, value: string) => {
    setStats(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    setIsDirty(true);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Статистика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Показатель {i + 1}</p>
            <div className="grid grid-cols-3 gap-3">
              <SectionField label="Число" value={stat.count} onChange={v => updateStat(i, "count", v)} />
              <SectionField label="Суффикс" value={stat.suffix} onChange={v => updateStat(i, "suffix", v)} />
              <SectionField label="Подпись" value={stat.label} onChange={v => updateStat(i, "label", v)} />
            </div>
          </div>
        ))}
        <Button disabled={!isDirty} onClick={() => { onSave("stats", stats as any); setIsDirty(false); }} data-testid="button-save-stats">
          <Save className="mr-2 h-4 w-4" />Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

function SimpleSectionEditor({ sectionKey, title, icon: Icon, defaults, onSave }: {
  sectionKey: string;
  title: string;
  icon: any;
  defaults: { label: string; title: string; desc: string };
  onSave: (key: string, data: SectionData) => void;
}) {
  const { data, update, isDirty, setIsDirty } = useSectionContent(sectionKey, defaults);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionField label="Подпись" value={data.label} onChange={v => update("label", v)} />
        <SectionField label="Заголовок" value={data.title} onChange={v => update("title", v)} />
        <SectionField label="Описание" value={data.desc} onChange={v => update("desc", v)} multiline />
        <Button disabled={!isDirty} onClick={() => { onSave(sectionKey, data); setIsDirty(false); }} data-testid={`button-save-${sectionKey}`}>
          <Save className="mr-2 h-4 w-4" />Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

function ContactsEditor({ onSave }: { onSave: (key: string, data: SectionData) => void }) {
  const defaults = {
    label: "Оставить заявку",
    title: "Рассчитаем ваш заказ<br>в течение 1 рабочего дня",
  };
  const { data, update, isDirty, setIsDirty } = useSectionContent("contacts", defaults);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Форма заявки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionField label="Подпись" value={data.label} onChange={v => update("label", v)} />
        <SectionField label="Заголовок (HTML разрешён)" value={data.title} onChange={v => update("title", v)} multiline />
        <Button disabled={!isDirty} onClick={() => { onSave("contacts", data); setIsDirty(false); }} data-testid="button-save-contacts">
          <Save className="mr-2 h-4 w-4" />Сохранить
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminSiteEditor() {
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: SectionData }) => {
      await apiRequest("PUT", `/api/settings/${key}`, {
        value: JSON.stringify(data),
        category: "content",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Сохранено", description: "Изменения применены на сайте" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
    },
  });

  const handleSave = (key: string, data: SectionData) => {
    saveMutation.mutate({ key, data });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Редактор сайта</h1>
          <p className="text-muted-foreground mt-1">Управление контентом секций на главной странице</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" data-testid="button-preview-site">
            <Eye className="mr-2 h-4 w-4" />
            Предпросмотр сайта
          </Button>
        </a>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-sections">
          <TabsTrigger value="hero" className="text-xs">Герой</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs">Клиенты</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Статистика</TabsTrigger>
          <TabsTrigger value="capabilities" className="text-xs">Производство</TabsTrigger>
          <TabsTrigger value="production" className="text-xs">Цех</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Продукция</TabsTrigger>
          <TabsTrigger value="process" className="text-xs">Процесс</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs">Портфолио</TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs">Заявка</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6">
          <HeroEditor onSave={handleSave} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsEditor onSave={handleSave} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsEditor onSave={handleSave} />
        </TabsContent>

        <TabsContent value="capabilities" className="mt-6">
          <SimpleSectionEditor
            sectionKey="capabilities"
            title="Производственные возможности"
            icon={Factory}
            defaults={{ label: "Наше производство", title: "Производственные возможности", desc: "Современное оборудование и многолетний опыт для реализации проектов любой сложности" }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="production" className="mt-6">
          <SimpleSectionEditor
            sectionKey="production"
            title="Галерея производства"
            icon={Image}
            defaults={{ label: "Наше производство", title: "Собственный цех в Подмосковье", desc: "Современное оборудование, отлаженные процессы и строгий контроль качества на каждом этапе" }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <SimpleSectionEditor
            sectionKey="products"
            title="Секция продукции"
            icon={Package}
            defaults={{ label: "Каталог", title: "Продукция", desc: "Производим широкий ассортимент изделий из натурального дерева" }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="process" className="mt-6">
          <SimpleSectionEditor
            sectionKey="process"
            title="Процесс работы"
            icon={Settings2}
            defaults={{ label: "Процесс", title: "Как мы работаем", desc: "Отлаженный процесс от первого запроса до отгрузки готовой продукции" }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <SimpleSectionEditor
            sectionKey="portfolio"
            title="Портфолио"
            icon={FileText}
            defaults={{ label: "Наши работы", title: "Портфолио", desc: "Примеры изделий, выполненных для наших клиентов" }}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactsEditor onSave={handleSave} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
