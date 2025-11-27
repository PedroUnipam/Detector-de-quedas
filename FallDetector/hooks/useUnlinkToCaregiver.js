import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} UseUnlinkToCaregiverReturn
 * @property {boolean} loading
 * @property {(caregiverId: string) => Promise<void>} unlinkToCaregiver
 * @returns {UseUnlinkToCaregiverReturn}
 */
export function useUnlinkToCaregiver() {
  const api = useApi();

  const [loading, setLoading] = useState(false);

  const unlinkToCaregiver = useCallback(
    async (caregiverId) => {
      try {
        setLoading(true);

        await api.delete("patient-caregivers", {
          data: {
            caregiverId,
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { loading, unlinkToCaregiver };
}
