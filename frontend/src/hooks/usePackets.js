import axios from "axios";
import { useEffect, useState } from "react";

const api = axios.create({
  baseURL: "https://aroma-stitch-willow.ngrok-free.dev/api"
});

export function usePackets(initialFilters = {}, initialLimit = 50) {
  const [packets, setPackets] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const fetchPage = async (targetPage = 1, nextFilters = filters, append = false) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: targetPage,
        limit: initialLimit
      };

      if (nextFilters.protocol) {
        params.protocol = nextFilters.protocol;
      }
      if (nextFilters.search) {
        params.search = nextFilters.search;
      }
      if (nextFilters.srcIp) {
        params.src_ip = nextFilters.srcIp;
      }
      if (nextFilters.startDate) {
        params.startDate = nextFilters.startDate;
      }
      if (nextFilters.endDate) {
        params.endDate = nextFilters.endDate;
      }

      const { data } = await api.get("/packets", { params });
      const nextPackets = Array.isArray(data.data) ? data.data : [];

      setPackets((current) => (append ? [...current, ...nextPackets] : nextPackets));
      setPage(targetPage);
      setHasMore(targetPage < (data.pagination?.totalPages || 1));
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || fetchError.message || "Failed to fetch packets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, filters, false);
  }, [filters]);

  const fetchMore = () => {
    if (loading || !hasMore) {
      return Promise.resolve();
    }

    return fetchPage(page + 1, filters, true);
  };

  const refetch = (nextFilters = filters) => {
    setFilters(nextFilters);
    return fetchPage(1, nextFilters, false);
  };

  return { packets, loading, error, fetchMore, hasMore, refetch };
}
