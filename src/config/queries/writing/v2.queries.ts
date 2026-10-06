import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

import axiosPrivate from "@/config/api";
import { writingTestEndpoints } from "@/config/endpoint";
import type {
  WritingTestV2,
  WritingTestV2Payload,
} from "@/pages/writing-v2/types";

type ApiErrorDetails = {
  code?: string;
  message?: string;
  error?: string | ApiErrorDetails;
  fields?: string[];
  response?: ApiErrorDetails;
};

type ApiErrorPayload = ApiErrorDetails & {
  success?: boolean;
  data?: unknown;
};

const PUBLISHED_TEST_IN_USE_CODE = "WRITING_PUBLISHED_TEST_IN_USE";
const PUBLISHED_TEST_IN_USE_MESSAGE =
  "Öğrenci cevabı bulunan yayımlanmış test değiştirilemez. Testi arşivleyip yeni bir test oluşturun.";
const PUBLISHED_TEST_IMMUTABLE_MESSAGE =
  "Yayımlanmış test değiştirilemez. Değişiklikler için yeni sürüm oluşturun.";

type UpdateWritingTestV2Variables = {
  id: string;
  data: WritingTestV2Payload;
  onPublishedTestInUse?: () => void;
};

const findErrorCode = (
  value: string | ApiErrorDetails | undefined,
  depth = 0,
): string | null => {
  if (!value || typeof value === "string" || depth > 4) return null;
  return (
    value.code ||
    findErrorCode(value.response, depth + 1) ||
    findErrorCode(value.error, depth + 1)
  );
};

const findErrorMessage = (
  value: string | ApiErrorDetails | undefined,
  depth = 0,
): string | null => {
  if (!value || depth > 4) return null;
  if (typeof value === "string") return value;
  return (
    value.message ||
    findErrorMessage(value.response, depth + 1) ||
    findErrorMessage(value.error, depth + 1)
  );
};

export const getWritingV2ErrorCode = (error: unknown) => {
  const response = (error as AxiosError<ApiErrorPayload>)?.response;
  const payload = response?.data;
  const code =
    findErrorCode(payload) ||
    findErrorCode(payload?.response) ||
    findErrorCode(payload?.error);

  if (code) return code;

  const message =
    findErrorMessage(payload?.response) ||
    findErrorMessage(payload?.error) ||
    findErrorMessage(payload);

  // The legacy global error filter flattens structured backend errors into
  // `error: "<message>"`. Keep this fallback until every client uses codes.
  if (
    response?.status === 409 &&
    (message === PUBLISHED_TEST_IN_USE_MESSAGE ||
      message === PUBLISHED_TEST_IMMUTABLE_MESSAGE)
  ) {
    return PUBLISHED_TEST_IN_USE_CODE;
  }

  return null;
};

export const isWritingPublishedTestInUseError = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === PUBLISHED_TEST_IN_USE_CODE
  ) {
    return true;
  }

  return getWritingV2ErrorCode(error) === PUBLISHED_TEST_IN_USE_CODE;
};

const errorMessage = (error: unknown, fallback: string) => {
  const payload = (error as AxiosError<ApiErrorPayload>)?.response?.data;
  return (
    findErrorMessage(payload?.response) ||
    findErrorMessage(payload?.error) ||
    findErrorMessage(payload) ||
    fallback
  );
};

export const writingV2QueryKey = (id: string) => ["writing-v2", id] as const;

export const useCreateWritingTestV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Pick<WritingTestV2Payload, "ieltsId" | "title">,
    ) => {
      const response = await axiosPrivate.post<WritingTestV2>(
        writingTestEndpoints.v2,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Yeni yazma taslağı oluşturuldu.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Taslak oluşturulamadı."));
    },
  });
};

export const useGetWritingTestV2 = (id: string) =>
  useQuery({
    queryKey: writingV2QueryKey(id),
    queryFn: async () => {
      const response = await axiosPrivate.get<WritingTestV2>(
        writingTestEndpoints.one(id),
      );
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 0,
  });

export const useUpdateWritingTestV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateWritingTestV2Variables) => {
      const response = await axiosPrivate.patch<WritingTestV2>(
        writingTestEndpoints.updateV2(id),
        data,
      );
      return response.data;
    },
    onSuccess: (test) => {
      queryClient.setQueryData(writingV2QueryKey(test.id), test);
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Taslak kaydedildi.");
    },
    onError: (error, variables) => {
      if (isWritingPublishedTestInUseError(error)) {
        variables.onPublishedTestInUse?.();
        return;
      }
      toast.error(errorMessage(error, "Taslak kaydedilemedi."));
    },
  });
};

export const useReviseWritingTestV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: WritingTestV2Payload;
    }) => {
      const response = await axiosPrivate.post<WritingTestV2>(
        writingTestEndpoints.reviseV2(id),
        data,
      );
      return response.data;
    },
    onSuccess: (test) => {
      queryClient.setQueryData(writingV2QueryKey(test.id), test);
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success(
        "Değişiklikler yeni taslağa aktarıldı. Eski test ve sonuçlar arşivde korundu.",
        { duration: 5000 },
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Yeni taslak sürümü oluşturulamadı."));
    },
  });
};

export const usePublishWritingTestV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosPrivate.post<WritingTestV2>(
        writingTestEndpoints.publishV2(id),
      );
      return response.data;
    },
    onSuccess: (test) => {
      queryClient.setQueryData(writingV2QueryKey(test.id), test);
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Yazma testi yayınlandı.");
    },
    onError: (error) => {
      const payload = (error as AxiosError<ApiErrorPayload>)?.response?.data;
      const fields =
        payload?.response?.fields || payload?.fields || [];
      toast.error(
        fields.length > 0
          ? `Eksik alanlar: ${fields.join(", ")}`
          : errorMessage(error, "Test yayınlanamadı."),
        { duration: 6000 },
      );
    },
  });
};

export const useArchiveWritingTestV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosPrivate.post<WritingTestV2>(
        writingTestEndpoints.archiveV2(id),
      );
      return response.data;
    },
    onSuccess: (test) => {
      queryClient.setQueryData(writingV2QueryKey(test.id), test);
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      toast.success("Yazma testi arşivlendi.");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Test arşivlenemedi."));
    },
  });
};
