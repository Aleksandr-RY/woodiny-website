import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard, MessageSquare, Package, Handshake,
  Star, Users, Newspaper, Phone, Search, BarChart3,
  LogOut, Menu, X, PenTool
} from "lucide-react";
import { useState } from "react";
const logoPath = "/woodiny-icon.png";

const navItems = [
  { path: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { path: "/admin/inquiries", label: "Заявки", icon: MessageSquare },
  { path: "/admin/products", label: "Каталог", icon: Package },
  { path: "/admin/partners", label: "Партнёры", icon: Handshake },
  { path: "/admin/reviews", label: "Отзывы", icon: Star },
  { path: "/admin/staff", label: "Сотрудники", icon: Users },
  { path: "/admin/news", label: "Новости", icon: Newspaper },
  { path: "/admin/settings", label: "Контакты", icon: Phone },
  { path: "/admin/seo", label: "SEO", icon: Search },
  { path: "/admin/stats", label: "Статистика", icon: BarChart3 },
  { path: "/admin/editor", label: "Редактор сайта", icon: PenTool },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/admin/login";
    },
  });

  if (!isLoading && user?.mustChangePassword) {
    window.location.href = "/admin/login";
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center animate-pulse">
            <img src={logoPath} alt="WOODINY" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/admin/login";
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-200 lg:relative lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center gap-3 h-14 px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0">
            <img src={logoPath} alt="WOODINY" className="h-7 w-7 object-contain" />
          </div>
          <Link href="/admin" className="font-bold text-lg text-sidebar-foreground" data-testid="link-admin-home">
            ВУДИНИ
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/admin" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}>
                <div
                  data-testid={`link-nav-${item.path.split("/").pop()}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                    ${isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {(user as any)?.username?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{(user as any)?.username}</p>
              <p className="text-xs text-muted-foreground">Администратор</p>
            </div>
          </div>
          <Button
            data-testid="button-logout"
            variant="ghost"
            className="w-full justify-start text-sm text-muted-foreground"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Выйти
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-mobile-menu">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium text-muted-foreground hidden lg:block">
            {navItems.find(n => n.path === location || (n.path !== "/admin" && location.startsWith(n.path)))?.label || "Панель управления"}
          </h2>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground" data-testid="text-admin-user">
            {(user as any)?.username}
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
