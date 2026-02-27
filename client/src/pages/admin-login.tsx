import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, KeyRound } from "lucide-react";
const logoPath = "/woodiny-icon.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.mustChangePassword) {
        setShowChangePassword(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/admin");
      }
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Неверный логин или пароль", variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: password,
        newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Пароль установлен", description: "Добро пожаловать в панель управления" });
      setLocation("/admin");
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось сменить пароль", variant: "destructive" });
    },
  });

  if (showChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-md bg-orange-600 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold" data-testid="text-change-password-title">Смена пароля</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Установите новый пароль для входа в панель управления</p>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 6) {
                  toast({ title: "Ошибка", description: "Пароль должен быть не менее 6 символов", variant: "destructive" });
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
                  return;
                }
                changePasswordMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-1.5 block">Новый пароль</label>
                <Input
                  data-testid="input-new-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Подтвердите пароль</label>
                <Input
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                data-testid="button-set-password"
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {changePasswordMutation.isPending ? "Сохранение..." : "Установить пароль"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-md flex items-center justify-center">
            <img src={logoPath} alt="WOODINY" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold" data-testid="text-login-title">ВУДИНИ</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Панель управления сайтом</p>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block">Логин</label>
              <Input
                data-testid="input-username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Пароль</label>
              <Input
                data-testid="input-password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              data-testid="button-login"
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loginMutation.isPending ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
