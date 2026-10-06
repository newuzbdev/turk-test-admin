import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import axiosPrivate from "@/config/api";

const speakingV2FileEndpoints = {
  upload: "/api/speaking-test/v2/media/upload",
  accessUrl: "/api/speaking-test/v2/media/access-url",
} as const;

export type SpeakingV2FileUploadResponse = {
  path?: string;
  success: boolean;
  message: string;
  data?: {
    filename?: string;
    mimetype?: string;
    size?: number;
    url?: string;
    reference?: string;
  };
};

export const createFileAccessUrl = async (reference: string) => {
  const response = await axiosPrivate.post<{ url?: string | null }>(
    speakingV2FileEndpoints.accessUrl,
    { reference },
  );
  return String(response.data.url || "").trim();
};

export const createBrowserMediaPreviewUrl = async (
  accessUrl: string,
  signal?: AbortSignal,
) => {
  const response = await fetch(accessUrl, {
    credentials: "omit",
    signal,
  });
  if (!response.ok) throw new Error("Dosya önizlemesi alınamadı.");
  return URL.createObjectURL(await response.blob());
};

export const useSpeakingV2FileUpload = () =>
  useMutation<SpeakingV2FileUploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosPrivate.post<SpeakingV2FileUploadResponse>(
        speakingV2FileEndpoints.upload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    },
    onSuccess: () => toast.success("Dosya yüklendi"),
    onError: () => toast.error("Dosya yüklenemedi"),
  });
