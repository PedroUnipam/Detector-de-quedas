import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} UseCreateEventReturn
 * @property {boolean} loading
 * @property {(type: "need_help" | "ok") => Promise<void>} createEvent
 * @returns {UseCreateEventReturn}
 */
export function useCreateEvent() {
  const api = useApi();

  const [loading, setLoading] = useState(false);

  const createEvent = useCallback(
    async (type) => {
      try {
        setLoading(true);

        await api.post("events", { type });
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { loading, createEvent };
}
