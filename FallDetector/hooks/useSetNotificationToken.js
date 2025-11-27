import { useApi } from "./useApi";
import { useState, useCallback } from "react";

/**
 * Hook to fetch user profile data
 * @typedef {Object} UseSetNotificationTokenReturn
 * @property {boolean} loading
 * @property {(token: string) => Promise<void>} setNotificationToken
 * @returns {UseSetNotificationTokenReturn}
 */
export function useSetNotificationToken() {
  const api = useApi();

  const [loading, setLoading] = useState(false);

  const setNotificationToken = useCallback(
    async (token) => {
      try {
        setLoading(true);

        await api.post("notification-token", { token });
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  return { loading, setNotificationToken };
}
