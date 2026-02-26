import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp, FileText, BarChart } from "lucide-react";

interface VisitStats {
  total: number;
  today: number;
  pages: { page: string; count: number }[];
}

export default function AdminStats() {
  const { data: stats, isLoading } = useQuery<VisitStats>({ queryKey: ["/api/stats/visits"] });

  if (isLoading) return <Skeleton className="h-60 w-full rounded-md" />;

  const maxCount = Math.max(...(stats?.pages?.map(p => p.count) || [1]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-stats-title">Статистика посещений</h1>
        <p className="text-sm text-muted-foreground mt-1">Обзор посещаемости сайта</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего посещений</CardTitle>
            <Eye className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-visits">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Сегодня</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-today-visits">{stats?.today ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart className="h-5 w-5" />
            Популярные страницы
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.pages?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Данных пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.pages.map((p, i) => (
                <div key={p.page} className="space-y-1.5" data-testid={`row-page-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">{p.page}</span>
                    <span className="text-sm text-muted-foreground ml-4 shrink-0">{p.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(p.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
