import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSubPartEndpoints, writingSectionEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingSubPart } from "@/utils/types/types";

// General writing subpart update
export const useUpdateWritingSubPart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<WritingSubPart>) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing subpart yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing subpart title
interface UpdateWritingSubPartTitleDto {
  id: string;
  title: string;
}

export const useUpdateWritingSubPartTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: UpdateWritingSubPartTitleDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.updateTitle(id),
          { title }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart title muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing subpart title yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing subpart description
interface UpdateWritingSubPartDescriptionDto {
  id: string;
  description: string;
}

export const useUpdateWritingSubPartDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, description }: UpdateWritingSubPartDescriptionDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.updateDescription(id),
          { description }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart description muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing subpart description yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing subpart content
interface UpdateWritingSubPartContentDto {
  id: string;
  content: string;
}

export const useUpdateWritingSubPartContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: UpdateWritingSubPartContentDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.updateContent(id),
          { content }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart content muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing subpart content yangilashda xatolik yuz berdi");
    },
  });
};

// Update writing subpart order
interface UpdateWritingSubPartOrderDto {
  id: string;
  order: number;
}

export const useUpdateWritingSubPartOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, order }: UpdateWritingSubPartOrderDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSubPart>>(
          writingSubPartEndpoints.updateOrder(id),
          { order }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSubPartEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      toast.success("Writing subpart order muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing subpart order yangilashda xatolik yuz berdi");
    },
  });
};
