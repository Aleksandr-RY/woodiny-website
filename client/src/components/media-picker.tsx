import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Images, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFile {
  url: string;
  name: string;
  size: number;
  modified: string;
}

interface MediaPickerProps {
  value?: string;
  onChange: (url: string) => void;
  trigger?: React.ReactNode;
}

export function MediaPicker({ value, onChange, trigger }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(value || "");

  const { data: files = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
    enabled: open,
  });

  const handleConfirm = () => {
    if (selected) {
      onChange(selected);
    }
    setOpen(false);
  };

  const handleOpen = (o: boolean) => {
    if (o) setSelected(value || "");
    setOpen(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <Images className="h-3.5 w-3.5 mr-1.5" />
            Выбрать из библиотеки
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Медиабиблиотека</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Images className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">Нет загруженных файлов</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Загрузите изображения через форму добавления
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {files.map((file) => (
                <button
                  key={file.url}
                  type="button"
                  onClick={() => setSelected(file.url)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none",
                    selected === file.url
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  {selected === file.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1 opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{file.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selected ? (
              <span className="font-medium text-foreground truncate max-w-xs block">
                {selected.split("/").pop()}
              </span>
            ) : (
              "Выберите изображение"
            )}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={!selected} onClick={handleConfirm}>
              Выбрать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
