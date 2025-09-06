import axiosPrivate from "@/config/api";
import { fileEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

interface FileUploadResponse {
  filename: string;
  originalname: string;
  path: string;
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
      console.log("Uploaded path:", data.path);
    },
    onError: () => {
      toast.error("Fayl yuklashda xatolik yuz berdi");
    },
  });
};
