import { useApi } from "./useApi";
import { useState, useEffect, useCallback } from "react";

/**
 * @typedef {Object} Patient
 * @property {string} street
 * @property {string} city
 * @property {string} state
 * @property {string} zipCode
 * @property {string} dateOfBirth - Date in ISO format (YYYY-MM-DD)
 */

/**
 * @typedef {Object} Profile
 * @property {string} email - Email address
 * @property {string} password - Password (min length: 6)
 * @property {string} cpf - CPF number
 * @property {string} name - Full name
 * @property {string} cellphone - Cellphone number
 * @property {Patient} [patient] - Optional patient information
 */

/**
 * Hook to fetch user profile data
 * @typedef {Object} useProfileReturn
 * @property {Profile} profile
 * @property {boolean} loading
 * @property {Error} error
 * @property {() => Promise<void>} refetchProfile
 * @return {useProfileReturn}
 */
export function useProfile() {
  const api = useApi();

  const [profile, setProfile] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const refetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("profile");
      setProfile(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetchProfile();
  }, []);

  return { profile, loading, error, refetchProfile };
}
