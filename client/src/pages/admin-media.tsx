import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, Copy, ImageIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / 1024 / 1024).toFixed(1) + " МБ";
}

export default function AdminMedia() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(`/api/media/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка удаления");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Файл удалён" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Ошибка удаления", variant: "destructive" }),
  });

  const upload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validFiles = fileArr.filter(f => {
      if (!allowed.includes(f.type)) {
        toast({ title: `${f.name}: неверный формат`, description: "JPG, PNG, WEBP", variant: "destructive" });
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast({ title: `${f.name}: слишком большой`, description: "Максимум 5 МБ", variant: "destructive" });
        return false;
      }
      return true;
    });
    if (!validFiles.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Ошибка");
        }
        uploaded++;
      } catch (e: any) {
        toast({ title: `Ошибка: ${file.name}`, description: e.message, variant: "destructive" });
      }
    }
    if (uploaded > 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: `Загружено: ${uploaded} файл(ов)` });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  }, [upload]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {
      const el = document.createElement("textarea");
      el.value = window.location.origin + url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopiedUrl(url);
    toast({ title: "URL скопирован" });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-media-title">Медиатека</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {files?.length || 0} файлов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={e => e.target.files && upload(e.target.files)}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            data-testid="button-upload-media"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Загрузка..." : "Загрузить"}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
        )}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Загрузка файлов...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-base font-medium">Перетащите изображения сюда</p>
            <p className="text-sm text-muted-foreground">JPG, PNG, WEBP · до 5 МБ · несколько файлов</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : !files?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Медиатека пуста</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Загрузите первое изображение</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map(file => (
            <div
              key={file.filename}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
              data-testid={`media-item-${file.filename}`}
            >
              <img
                src={file.url}
                alt={file.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <button
                    className="h-7 w-7 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    onClick={() => copyUrl(file.url)}
                    title="Копировать URL"
                  >
                    {copiedUrl === file.url
                      ? <Check className="h-3.5 w-3.5 text-white" />
                      : <Copy className="h-3.5 w-3.5 text-white" />
                    }
                  </button>
                  <button
                    className="h-7 w-7 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                    onClick={() => setDeleteTarget(file)}
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-white text-xs font-medium truncate">{file.filename}</p>
                  <p className="text-white/70 text-xs">{formatBytes(file.size)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить файл?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.filename}» будет удалён безвозвратно. Если изображение используется на сайте, там появится пустое место.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.filename)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
