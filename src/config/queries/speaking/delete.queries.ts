import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { speakingTestEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useDeleteSpeakingTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const endpoint = speakingTestEndpoints.one(id);
      console.log("=== DELETE REQUEST DEBUG ===");
      console.log("ID:", id);
      console.log("Endpoint:", endpoint);
      console.log("Full URL:", `${window.location.origin}${endpoint}`);

      try {
        console.log("Making DELETE request...");
        const response = await axiosPrivate.delete(endpoint);
        console.log("Delete response status:", response.status);
        console.log("Delete response data:", response.data);
        console.log("=== DELETE SUCCESS ===");
        return response;
      } catch (error: any) {
        console.error("=== DELETE ERROR ===");
        console.error("Error message:", error.message);
        console.error("Error response:", error.response);
        console.error("Error status:", error.response?.status);
        console.error("Error data:", error.response?.data);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Delete mutation successful for ID:", variables);
      console.log("Response data:", data);

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.all] });
      queryClient.invalidateQueries({ queryKey: [speakingTestEndpoints.only] });

      toast.success("Speaking test muvaffaqiyatli o'chirildi");
    },
    onError: (error: any, variables) => {
      console.error("=== MUTATION ERROR ===");
      console.error("Delete mutation failed for ID:", variables);
      console.error("Error:", error);
      console.error("Error response:", error.response);

      let errorMessage = "Speaking test o'chirishda xatolik yuz berdi";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
  });
};
