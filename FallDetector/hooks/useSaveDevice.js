import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} useSaveDevice
 * @property {boolean} loading
 * @property {Error} error
 * @property {(device: string) => Promise<void>} saveDevice
 * @returns {useSaveDevice}
 */
export function useSaveDevice() {
  const api = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const saveDevice = useCallback(
    async (device) => {
      try {
        setLoading(true);

        await api.post("/device", { device });
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { loading, error, saveDevice };
}
