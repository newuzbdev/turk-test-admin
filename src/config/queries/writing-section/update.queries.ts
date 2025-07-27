import axiosPrivate from "@/config/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { writingSectionEndpoints, writingTestEndpoints } from "@/config/endpoint";
import toast from "react-hot-toast";
import type { ApiResponse, WritingSection } from "@/utils/types/types";

// General writing section update
export const useUpdateWritingSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<WritingSection>) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.one(id),
          data
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing section yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing section title
interface UpdateWritingSectionTitleDto {
  id: string;
  title: string;
}

export const useUpdateWritingSectionTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: UpdateWritingSectionTitleDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.updateTitle(id),
          { title }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section title muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing section title yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing section description
interface UpdateWritingSectionDescriptionDto {
  id: string;
  description: string;
}

export const useUpdateWritingSectionDescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, description }: UpdateWritingSectionDescriptionDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.updateDescription(id),
          { description }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section description muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing section description yangilashda xatolik yuz berdi");
    },
  });
};

// Update only writing section content
interface UpdateWritingSectionContentDto {
  id: string;
  content: string;
}

export const useUpdateWritingSectionContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: UpdateWritingSectionContentDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.updateContent(id),
          { content }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section content muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing section content yangilashda xatolik yuz berdi");
    },
  });
};

// Update writing section order
interface UpdateWritingSectionOrderDto {
  id: string;
  order: number;
}

export const useUpdateWritingSectionOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, order }: UpdateWritingSectionOrderDto) =>
      (
        await axiosPrivate.patch<ApiResponse<WritingSection>>(
          writingSectionEndpoints.updateOrder(id),
          { order }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingSectionEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Writing section order muvaffaqiyatli yangilandi");
    },
    onError: () => {
      toast.error("Writing section order yangilashda xatolik yuz berdi");
    },
  });
};
