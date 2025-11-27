import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} useRemoveDevice
 * @property {boolean} loading
 * @property {Error} error
 * @property {(device: string) => Promise<void>} removeDevice
 * @returns {useRemoveDevice}
 */
export function useRemoveDevice() {
  const api = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const removeDevice = useCallback(async () => {
    try {
      setLoading(true);

      await api.delete("/device");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return { loading, error, removeDevice };
}
