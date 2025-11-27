import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} useProfileReturn
 * @property {boolean} loading
 * @property {Error} error
 * @property {(caregiverId: string) => Promise<void>} linkToCaregiver
 */
export function useLinkToCaregiver() {
  const api = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const linkToCaregiver = useCallback(
    async (caregiverId) => {
      try {
        setLoading(true);

        const response = await api.post("patient-caregivers", { caregiverId });
        setUser(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { loading, error, linkToCaregiver };
}
