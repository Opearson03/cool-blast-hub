import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Loader2,
  Trash2,
  Star,
  StarOff,
  Pencil,
  Check,
  X,
  ImageOff,
  Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Pour = Tables<"job_pours">;
type DiaryPhoto = Tables<"documents"> & {
  pour_id: string | null;
  diary_stage: "before" | "during" | "after" | null;
  caption: string | null;
  taken_at: string | null;
  is_cover: boolean;
};

const STAGES = [
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
] as const;

type Stage = (typeof STAGES)[number]["value"];

interface SiteDiarySectionProps {
  jobId: string;
  businessId: string;
}

export function SiteDiarySection({ jobId, businessId }: SiteDiarySectionProps) {
  const queryClient = useQueryClient();
  const [activePhoto, setActivePhoto] = useState<DiaryPhoto | null>(null);
  const [editCaption, setEditCaption] = useState<string>("");
  const [editingCaption, setEditingCaption] = useState(false);

  const { data: pours = [], isLoading: poursLoading } = useQuery({
    queryKey: ["job-pours-for-diary", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_pours")
        .select("*")
        .eq("job_id", jobId)
        .order("pour_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Pour[];
    },
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["job-diary-photos", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("reference_id", jobId)
        .eq("category", "job")
        .not("diary_stage", "is", null)
        .order("taken_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as DiaryPhoto[];
    },
  });

  const photosByPour = useMemo(() => {
    const map = new Map<string, DiaryPhoto[]>();
    for (const p of photos) {
      const key = p.pour_id ?? "__unassigned__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [photos]);

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      pourId,
      stage,
    }: {
      file: File;
      pourId: string;
      stage: Stage;
    }) => {
      const path = `${jobId}/diary/${pourId}/${stage}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("documents").insert({
        business_id: businessId,
        file_name: file.name,
        file_type: file.type,
        file_url: urlData.publicUrl,
        category: "job",
        reference_id: jobId,
        subfolder: "site_diary",
        pour_id: pourId,
        diary_stage: stage,
        taken_at: new Date(file.lastModified || Date.now()).toISOString(),
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-diary-photos", jobId] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error(e?.message || "Failed to upload photo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (photo: DiaryPhoto) => {
      const pathMatch = photo.file_url.match(/documents\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("documents").remove([pathMatch[1]]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-diary-photos", jobId] });
      setActivePhoto(null);
      toast.success("Photo deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string;
      changes: Partial<Pick<DiaryPhoto, "caption" | "diary_stage" | "is_cover">>;
    }) => {
      const { error } = await supabase
        .from("documents")
        .update(changes)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-diary-photos", jobId] });
    },
    onError: () => toast.error("Update failed"),
  });

  const setCoverMutation = useMutation({
    mutationFn: async (photo: DiaryPhoto) => {
      // Clear existing cover for this pour, then set this one
      if (photo.pour_id) {
        const { error: clearErr } = await supabase
          .from("documents")
          .update({ is_cover: false })
          .eq("reference_id", jobId)
          .eq("pour_id", photo.pour_id)
          .eq("is_cover", true);
        if (clearErr) throw clearErr;
      }
      const { error } = await supabase
        .from("documents")
        .update({ is_cover: !photo.is_cover })
        .eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-diary-photos", jobId] });
      toast.success("Cover updated");
    },
    onError: () => toast.error("Failed to set cover"),
  });

  if (poursLoading || photosLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading site diary...
      </div>
    );
  }

  if (pours.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No pours scheduled yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Add pours to this job's Project Plan to start capturing
            before / during / after photos for each one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Site Diary —</strong> capture
        before / during / after photos for each pour. Builds a defensible
        record for warranty, disputes, and the final job pack.
      </div>

      {pours.map((pour) => {
        const pourPhotos = photosByPour.get(pour.id) || [];
        return (
          <PourDiaryCard
            key={pour.id}
            pour={pour}
            photos={pourPhotos}
            uploading={uploadMutation.isPending}
            onUpload={(file, stage) =>
              uploadMutation.mutate({ file, pourId: pour.id, stage })
            }
            onPhotoClick={(photo) => {
              setActivePhoto(photo);
              setEditCaption(photo.caption || "");
              setEditingCaption(false);
            }}
          />
        );
      })}

      {/* Lightbox */}
      <Dialog
        open={!!activePhoto}
        onOpenChange={(open) => {
          if (!open) {
            setActivePhoto(null);
            setEditingCaption(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="truncate pr-8">
              {activePhoto?.file_name}
            </DialogTitle>
          </DialogHeader>

          {activePhoto && (
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              <div className="bg-black flex-1 flex items-center justify-center min-h-[300px]">
                {activePhoto.file_type?.startsWith("image/") ? (
                  <img
                    src={activePhoto.file_url}
                    alt={activePhoto.caption || activePhoto.file_name}
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground flex items-center gap-2 p-8">
                    <ImageOff className="w-5 h-5" /> Preview unavailable
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 space-y-4 border-t bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stage
                    </label>
                    <Select
                      value={activePhoto.diary_stage ?? undefined}
                      onValueChange={(v) =>
                        updateMutation.mutate({
                          id: activePhoto.id,
                          changes: { diary_stage: v as Stage },
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    {activePhoto.taken_at && (
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(activePhoto.taken_at), "d MMM yyyy 'at' h:mma")}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Caption
                  </label>
                  {editingCaption ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Add a note..."
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          updateMutation.mutate({
                            id: activePhoto.id,
                            changes: { caption: editCaption || null },
                          });
                          setEditingCaption(false);
                        }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingCaption(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center mt-1">
                      <p className="text-sm flex-1">
                        {activePhoto.caption || (
                          <span className="text-muted-foreground italic">
                            No caption
                          </span>
                        )}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCaption(true)}
                      >
                        <Pencil className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCoverMutation.mutate(activePhoto)}
                    disabled={setCoverMutation.isPending}
                  >
                    {activePhoto.is_cover ? (
                      <>
                        <StarOff className="w-4 h-4 mr-1.5" />
                        Unpin cover
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-1.5" />
                        Set as cover
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(activePhoto.file_url, "_blank")}
                  >
                    Open original
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(activePhoto)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PourDiaryCardProps {
  pour: Pour;
  photos: DiaryPhoto[];
  uploading: boolean;
  onUpload: (file: File, stage: Stage) => void;
  onPhotoClick: (photo: DiaryPhoto) => void;
}

function PourDiaryCard({
  pour,
  photos,
  uploading,
  onUpload,
  onPhotoClick,
}: PourDiaryCardProps) {
  const cover = photos.find((p) => p.is_cover);

  const dateLabel = pour.pour_date
    ? format(parseISO(pour.pour_date), "d MMM yyyy")
    : "Unscheduled";

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          {cover ? (
            <img
              src={cover.file_url}
              alt=""
              className="w-14 h-14 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border">
              <Camera className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">{pour.pour_name}</h4>
              {pour.status && (
                <Badge variant="outline" className="text-xs capitalize">
                  {pour.status.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dateLabel}
              {pour.estimated_m3 ? ` · ${pour.estimated_m3} m³` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STAGES.map((stage) => {
            const stagePhotos = photos.filter(
              (p) => p.diary_stage === stage.value
            );
            return (
              <DiaryStageColumn
                key={stage.value}
                stage={stage.value}
                label={stage.label}
                photos={stagePhotos}
                uploading={uploading}
                onUpload={(file) => onUpload(file, stage.value)}
                onPhotoClick={onPhotoClick}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface DiaryStageColumnProps {
  stage: Stage;
  label: string;
  photos: DiaryPhoto[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onPhotoClick: (photo: DiaryPhoto) => void;
}

function DiaryStageColumn({
  label,
  photos,
  uploading,
  onUpload,
  onPhotoClick,
}: DiaryStageColumnProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }
      onUpload(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}{" "}
          <span className="text-foreground/60">({photos.length})</span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 min-h-[88px] rounded-md border border-dashed border-border/70 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-xs gap-1"
        >
          <Camera className="w-4 h-4" />
          Add photo
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPhotoClick(p)}
              className="relative aspect-square rounded-md overflow-hidden border border-border/60 hover:border-primary transition-colors group"
            >
              {p.file_type?.startsWith("image/") ? (
                <img
                  src={p.file_url}
                  alt={p.caption || ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ImageOff className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              {p.is_cover && (
                <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground rounded p-0.5">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
