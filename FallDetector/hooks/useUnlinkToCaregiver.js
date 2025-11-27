import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} UseUnlinkToCaregiverReturn
 * @property {boolean} loading
 * @property {Error} error
 * @property {(caregiverId: string) => Promise<void>} linkToCaregiver
 * @returns {UseUnlinkToCaregiverReturn}
 */
export function useUnlinkToCaregiver() {
  const api = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const linkToCaregiver = useCallback(
    async (caregiverId) => {
      try {
        setLoading(true);

        await api.delete("patient-caregivers", {
          caregiverId,
        });
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
