import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Trees, Phone, Mail, MapPin, Clock, Send,
  ChevronRight, Star, Factory, Truck, Shield,
  Users, ArrowRight, MessageCircle, CheckCircle2,
  Package, Layers, Award, Hammer
} from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";
import type { Product, Review, Partner, SiteSetting, News } from "@shared/schema";

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-amber-900 to-stone-900" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A574' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <Badge variant="outline" className="border-amber-400/30 text-amber-200 mb-6 text-sm px-4 py-1.5">
            <Factory className="h-3.5 w-3.5 mr-1.5" />
            Собственное производство в Московской области
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6" data-testid="text-hero-title">
            Крупносерийное производство
            <span className="block text-amber-300 mt-2">изделий из дерева</span>
          </h1>
          <p className="text-lg sm:text-xl text-amber-100/80 leading-relaxed mb-10 max-w-2xl">
            Разделочные доски, подносы, кухонные принадлежности и декор из массива.
            Работаем с B2B-клиентами по всей России. Индивидуальные заказы от 100 штук.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#contact">
              <Button size="lg" className="text-base px-8" data-testid="button-hero-cta">
                Оставить заявку
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="#products">
              <Button size="lg" variant="outline" className="text-base px-8 border-amber-400/30 text-amber-100 bg-white/5 backdrop-blur-sm" data-testid="button-hero-catalog">
                Каталог продукции
              </Button>
            </a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function AdvantagesSection() {
  const advantages = [
    { icon: Factory, title: "Своё производство", desc: "Полный цикл от заготовки до упаковки на собственной фабрике в МО" },
    { icon: Layers, title: "Любые объёмы", desc: "От 100 до 100 000 единиц. Гибкие сроки и масштабируемость" },
    { icon: Award, title: "Качество древесины", desc: "Работаем с дубом, буком, ясенем, берёзой. Сертифицированное сырьё" },
    { icon: Truck, title: "Доставка по РФ", desc: "Отправка транспортными компаниями в любой регион России" },
    { icon: Shield, title: "Гарантия качества", desc: "Контроль на каждом этапе. Замена при обнаружении брака" },
    { icon: Hammer, title: "Брендирование", desc: "Нанесение логотипа гравировкой или печатью на готовые изделия" },
  ];

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-advantages-title">Почему выбирают нас</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Более 10 лет производим качественные изделия из натурального дерева для бизнеса
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((item, i) => (
            <Card key={i} className="group hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const activeProducts = products?.filter(p => p.isActive) || [];

  if (!activeProducts.length) return null;

  return (
    <section id="products" className="py-20 sm:py-28 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-products-section">Наша продукция</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Широкий ассортимент изделий из массива дерева для кухни, сервировки и декора
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProducts.map((product) => (
            <Card key={product.id} className="group hover-elevate transition-all" data-testid={`card-landing-product-${product.id}`}>
              <CardContent className="p-0">
                {product.imageUrl ? (
                  <div className="aspect-[4/3] overflow-hidden rounded-t-md">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center rounded-t-md">
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    {product.price && (
                      <Badge variant="secondary" className="shrink-0">{product.price}</Badge>
                    )}
                  </div>
                  {product.category && (
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  )}
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{product.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const { data: reviews } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });
  const activeReviews = reviews?.filter(r => r.isActive) || [];

  if (!activeReviews.length) return null;

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-reviews-section">Отзывы клиентов</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Нам доверяют компании по всей России
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeReviews.map((review) => (
            <Card key={review.id} className="hover-elevate transition-all" data-testid={`card-landing-review-${review.id}`}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5">{review.text}</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {review.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.authorName}</p>
                    {review.company && (
                      <p className="text-xs text-muted-foreground">{review.company}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  const { data: partners } = useQuery<Partner[]>({ queryKey: ["/api/partners"] });
  const activePartners = partners?.filter(p => p.isActive) || [];

  if (!activePartners.length) return null;

  return (
    <section className="py-16 sm:py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-partners-section">Нам доверяют</h2>
          <p className="text-muted-foreground">Наши партнёры и клиенты</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {activePartners.map((partner) => (
            <div key={partner.id} className="flex items-center gap-3 text-muted-foreground" data-testid={`partner-logo-${partner.id}`}>
              {partner.logoUrl ? (
                <img src={partner.logoUrl} alt={partner.name} className="h-10 w-auto object-contain opacity-70" />
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted/50">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">{partner.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  const { data: newsList } = useQuery<News[]>({ queryKey: ["/api/news"] });
  const published = newsList?.filter(n => n.isPublished) || [];

  if (!published.length) return null;

  const catLabels: Record<string, string> = { news: "Новость", promo: "Акция", offer: "Спецпредложение" };

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Новости и акции</h2>
          <p className="text-muted-foreground text-lg">Последние обновления от ВУДИНИ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {published.slice(0, 3).map((item) => (
            <Card key={item.id} className="hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{catLabels[item.category || "news"] || item.category}</Badge>
                  {item.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const { toast } = useToast();
  const { data: settings } = useQuery<SiteSetting[]>({
    queryKey: ["/api/settings/public"],
    queryFn: async () => {
      const res = await fetch("/api/settings/public");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", message: "" });

  const settingsMap: Record<string, string> = {};
  settings?.forEach(s => { settingsMap[s.key] = s.value; });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/inquiries", form),
    onSuccess: () => {
      toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время" });
      setForm({ name: "", phone: "", email: "", company: "", message: "" });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось отправить заявку", variant: "destructive" });
    },
  });

  return (
    <section id="contact" className="py-20 sm:py-28 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-contact-section">Свяжитесь с нами</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Оставьте заявку и мы подготовим индивидуальное предложение для вашего бизнеса
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <form
                  onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Ваше имя *</label>
                      <Input
                        data-testid="input-contact-name"
                        placeholder="Иван Иванов"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Телефон</label>
                      <Input
                        data-testid="input-contact-phone"
                        placeholder="+7 (XXX) XXX-XX-XX"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Email</label>
                      <Input
                        data-testid="input-contact-email"
                        type="email"
                        placeholder="email@company.ru"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Компания</label>
                      <Input
                        data-testid="input-contact-company"
                        placeholder="ООО «Компания»"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Сообщение</label>
                    <Textarea
                      data-testid="input-contact-message"
                      placeholder="Опишите ваш запрос: какие изделия, объём, сроки..."
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <Button
                    data-testid="button-submit-inquiry"
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto px-8"
                    disabled={submitMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitMutation.isPending ? "Отправка..." : "Отправить заявку"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {settingsMap.phone && (
              <a href={`tel:${settingsMap.phone.replace(/\D/g, '')}`} className="block">
                <Card className="hover-elevate transition-all">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Телефон</p>
                      <p className="font-semibold">{settingsMap.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )}
            {settingsMap.email && (
              <a href={`mailto:${settingsMap.email}`} className="block">
                <Card className="hover-elevate transition-all">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <p className="font-semibold">{settingsMap.email}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            )}
            {settingsMap.address && (
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Адрес</p>
                    <p className="font-medium text-sm">{settingsMap.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {settingsMap.work_hours && (
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Часы работы</p>
                    <p className="font-medium text-sm">{settingsMap.work_hours}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-3 pt-2">
              {settingsMap.whatsapp && (
                <a href={settingsMap.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" data-testid="link-whatsapp">
                    <SiWhatsapp className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {settingsMap.telegram && (
                <a href={settingsMap.telegram} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon" data-testid="link-telegram">
                    <SiTelegram className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Trees className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">ВУДИНИ</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-products">Продукция</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-contact">Контакты</a>
            <a href="/admin/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-admin">Админ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <a href="#contact">
              <Button data-testid="button-header-cta">
                Оставить заявку
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-nav">
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-3">
            <a href="#products" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Продукция</a>
            <a href="#contact" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Контакты</a>
            <a href="/admin/login" className="block py-2 text-sm font-medium text-muted-foreground">Админ</a>
            <a href="#contact">
              <Button className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}>Оставить заявку</Button>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-card border-t py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Trees className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ВУДИНИ</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} ВУДИНИ. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}

function StatsBar() {
  const stats = [
    { value: "10+", label: "лет на рынке" },
    { value: "500+", label: "B2B клиентов" },
    { value: "2M+", label: "изделий в год" },
    { value: "24ч", label: "ответ на заявку" },
  ];

  return (
    <section className="py-12 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-1">{s.value}</p>
              <p className="text-sm text-primary-foreground/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <AdvantagesSection />
        <ProductsSection />
        <ReviewsSection />
        <PartnersSection />
        <NewsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
