import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import type {
  ApiResponse,
  WritingTest,
} from "../../../utils/types/types";
import { writingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

interface UpdateWritingTestData {
  id: string;
  title: string;
  ieltsId: string;
}

export const useUpdateWritingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateWritingTestData) => {
      return (
        await axiosPrivate.patch<ApiResponse<WritingTest>>(
          writingTestEndpoints.one(id),
          data
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [writingTestEndpoints.all] });
      notification.success({
        message: "Writing test muvaffaqiyatli yangilandi",
        placement: "bottomRight",
      });
    },
    onError: () => {
      notification.error({
        message: "Writing test yangilashda xatolik yuz berdi",
        placement: "bottomRight",
      });
    },
  });
};
