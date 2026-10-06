import { useEffect, useState } from "react";
import { Alert, Button, Tooltip, Upload } from "antd";
import { Image as ImageIcon, Trash2, Upload as UploadIcon } from "lucide-react";

import {
  createFileAccessUrl,
  useSpeakingV2FileUpload,
} from "../speaking-v2-file.queries";

type FixedImageSlotsProps<N extends 1 | 2> = {
  images: N extends 1 ? [string] : [string, string];
  limit: N;
  disabled: boolean;
  onUploadStart: (
    start: (isCurrent: () => boolean) => Promise<void>,
  ) => void;
  onChange: (
    updater: (
      current: N extends 1 ? [string] : [string, string],
    ) => N extends 1 ? [string] : [string, string],
    source?: "upload",
  ) => void;
};

export function FixedImageSlots<const N extends 1 | 2>({
  images,
  limit,
  disabled,
  onUploadStart,
  onChange,
}: FixedImageSlotsProps<N>) {
  const upload = useSpeakingV2FileUpload();
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    const references = images.filter(Boolean);
    if (!references.length) {
      setPreviewUrls({});
      return undefined;
    }

    void Promise.all(
      references.map(async (reference) => {
        try {
          const accessUrl = await createFileAccessUrl(reference);
          return [reference, accessUrl] as const;
        } catch {
          return [reference, ""] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setPreviewUrls(
          Object.fromEntries(entries.filter(([, previewUrl]) => previewUrl)),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

  const replace = (
    index: number,
    reference: string,
    source?: "upload",
  ) => {
    onChange(
      (current) => {
        const next = [...current];
        next[index] = reference;
        return next as N extends 1 ? [string] : [string, string];
      },
      source,
    );
  };

  const uploadSlot = async (
    index: number,
    file: File,
    isCurrent: () => boolean,
  ) => {
    if (!isCurrent()) return;
    setUploadErrors((current) => ({ ...current, [index]: "" }));
    try {
      const response = await upload.mutateAsync(file);
      if (!isCurrent()) return;
      const durableReference = String(
        response.data?.reference || response.path || "",
      ).trim();
      if (!durableReference) {
        throw new Error("Kalıcı görsel referansı alınamadı.");
      }
      replace(index, durableReference, "upload");
    } catch {
      if (!isCurrent()) return;
      setUploadErrors((current) => ({
        ...current,
        [index]: "Görsel yüklenemedi. Dosyayı yeniden seçin.",
      }));
    }
  };

  return (
    <div className={`fixed-image-grid fixed-image-grid-${limit}`}>
      {Array.from({ length: limit }, (_, index) => {
        const reference = images[index] ?? "";
        const previewUrl = reference ? previewUrls[reference] : "";

        return (
          <div className="fixed-image-slot" key={index}>
            {previewUrl ? (
              <img src={previewUrl} alt={`Görsel ${index + 1}`} />
            ) : (
              <span className="fixed-image-placeholder">
                <ImageIcon size={24} />
                Görsel {index + 1}
              </span>
            )}
            <div className="fixed-image-actions">
              <Upload
                accept="image/*"
                showUploadList={false}
                disabled={disabled || upload.isPending}
                beforeUpload={(file) => {
                  onUploadStart((isCurrent) =>
                    uploadSlot(index, file as File, isCurrent),
                  );
                  return false;
                }}
              >
                <Button
                  disabled={disabled}
                  loading={upload.isPending}
                  icon={<UploadIcon size={16} />}
                >
                  {reference ? "Değiştir" : "Yükle"}
                </Button>
              </Upload>
              {reference && (
                <Tooltip title={`Görsel ${index + 1} kaldır`}>
                  <Button
                    aria-label={`Görsel ${index + 1} kaldır`}
                    disabled={disabled}
                    icon={<Trash2 size={16} />}
                    onClick={() => replace(index, "")}
                  />
                </Tooltip>
              )}
            </div>
            {uploadErrors[index] && (
              <Alert type="error" showIcon message={uploadErrors[index]} />
            )}
          </div>
        );
      })}
    </div>
  );
}
