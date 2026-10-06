import axiosPrivate from "@/config/api";
import { fileEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

interface FileUploadResponse {
  path?: string;
  success: boolean;
  message: string;
  data: {
    filename: string;
    mimetype: string;
    size: number;
    url?: string;
    reference?: string;
    path?: string;
  };
}

export const createFileAccessUrl = async (reference: string) => {
  const response = await axiosPrivate.post<{ url?: string | null }>(
    fileEndpoints.accessUrl,
    { reference },
  );
  return String(response.data.url || "").trim();
};

export const createFileDownloadUrl = async (reference: string) => {
  const response = await axiosPrivate.post<{ url?: string | null }>(
    fileEndpoints.downloadUrl,
    { reference },
  );
  return String(response.data.url || "").trim();
};

export const useFileUpload = () => {
  return useMutation<FileUploadResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axiosPrivate.post<FileUploadResponse>(
        fileEndpoints.upload,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      return res.data;
    },
    onSuccess: () => {
      toast.success("Dosya yüklendi");
    },
    onError: () => {
      toast.error("Dosya yüklenemedi");
    },
  });
};
