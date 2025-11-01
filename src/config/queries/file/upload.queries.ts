import axiosPrivate from "@/config/api";
import { fileEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

interface FileUploadResponse {
  path: string;
  success: boolean;
  message: string;
  data: {
    filename: string;
    mimetype: string;
    size: number;
    url: string;
  };
}

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
        }
      );

      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Fayl muvaffaqiyatli yuklandi");
      console.log("Uploaded URL:", data.data.url);
    },
    onError: () => {
      toast.error("Fayl yuklashda xatolik yuz berdi");
    },
  });
};
