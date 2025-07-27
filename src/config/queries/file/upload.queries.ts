import axiosPrivate from "@/config/api";
import { useMutation } from "@tanstack/react-query";
import { fileEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse } from "@/utils/types/types";

interface FileUploadResponse {
  id: string;
  filename: string;
  url: string;
}

export const useFileUpload = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return (
        await axiosPrivate.post<ApiResponse<FileUploadResponse>>(
          fileEndpoints.upload,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        )
      ).data;
    },
    onSuccess: () => {
      toast.success("Fayl muvaffaqiyatli yuklandi");
    },
    onError: () => {
      toast.error("Fayl yuklashda xatolik yuz berdi");
    },
  });
};
