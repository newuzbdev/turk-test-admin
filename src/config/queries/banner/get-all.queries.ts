import { useQuery } from "@tanstack/react-query";
import { bannerEndpoints } from "../../endpoint";
import axiosPrivate from "../../api";

export const useGetAllBanners = () => {
  return useQuery({
    queryKey: [bannerEndpoints.all],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get(bannerEndpoints.all);
        console.log("Raw API response:", response);
        console.log("Response data:", response.data);
        return response.data;
      } catch (error) {
        console.error("API Error:", error);
        throw error;
      }
    },
  });
};
