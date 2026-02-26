import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Package, Handshake, Star, Users, Newspaper, Eye, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: inquiries, isLoading: l1 } = useQuery({ queryKey: ["/api/inquiries"] });
  const { data: products, isLoading: l2 } = useQuery({ queryKey: ["/api/products"] });
  const { data: partners, isLoading: l3 } = useQuery({ queryKey: ["/api/partners"] });
  const { data: reviews, isLoading: l4 } = useQuery({ queryKey: ["/api/reviews"] });
  const { data: staffList, isLoading: l5 } = useQuery({ queryKey: ["/api/staff"] });
  const { data: newsList, isLoading: l6 } = useQuery({ queryKey: ["/api/news"] });
  const { data: visitStats, isLoading: l7 } = useQuery({ queryKey: ["/api/stats/visits"] });

  const newInquiriesCount = (inquiries as any[])?.filter((i: any) => i.status === "new").length ?? 0;

  const cards = [
    { title: "Все заявки", value: (inquiries as any[])?.length ?? 0, icon: MessageSquare, color: "text-blue-500 dark:text-blue-400", link: "/admin/inquiries", loading: l1 },
    { title: "Новые заявки", value: newInquiriesCount, icon: AlertCircle, color: "text-red-500 dark:text-red-400", link: "/admin/inquiries", loading: l1 },
    { title: "Товары", value: (products as any[])?.length ?? 0, icon: Package, color: "text-emerald-500 dark:text-emerald-400", link: "/admin/products", loading: l2 },
    { title: "Партнёры", value: (partners as any[])?.length ?? 0, icon: Handshake, color: "text-amber-500 dark:text-amber-400", link: "/admin/partners", loading: l3 },
    { title: "Отзывы", value: (reviews as any[])?.length ?? 0, icon: Star, color: "text-yellow-500 dark:text-yellow-400", link: "/admin/reviews", loading: l4 },
    { title: "Сотрудники", value: (staffList as any[])?.length ?? 0, icon: Users, color: "text-violet-500 dark:text-violet-400", link: "/admin/staff", loading: l5 },
    { title: "Новости", value: (newsList as any[])?.length ?? 0, icon: Newspaper, color: "text-indigo-500 dark:text-indigo-400", link: "/admin/news", loading: l6 },
    { title: "Посещения сегодня", value: (visitStats as any)?.today ?? 0, icon: Eye, color: "text-teal-500 dark:text-teal-400", link: "/admin/stats", loading: l7 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Панель управления</h1>
        <p className="text-sm text-muted-foreground mt-1">Обзор основных показателей</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.link}>
            <Card className="cursor-pointer hover-elevate transition-all">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground" data-testid={`text-card-${card.title}`}>
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color} shrink-0`} />
              </CardHeader>
              <CardContent>
                {card.loading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold" data-testid={`text-value-${card.title}`}>{card.value}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
