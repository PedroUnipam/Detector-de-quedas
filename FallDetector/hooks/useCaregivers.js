import { useApi } from "./useApi";
import { useState, useEffect, useCallback } from "react";

/**
 * @typedef {Object} Profile
 * @property {string} email - Email address
 * @property {string} password - Password (min length: 6)
 * @property {string} cpf - CPF number
 * @property {string} name - Full name
 * @property {string} cellphone - Cellphone number
 */

/**
 * Hook to fetch user profile data
 * @typedef {Object} useCaregiverReturn
 * @property {Profile[]} caregivers
 * @property {boolean} loading
 * @property {Error} error
 * @property {() => Promise<void>} refetchCaregivers
 * @returns {useCaregiverReturn}
 */
export function useCaregivers() {
  const api = useApi();

  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const refetchCaregivers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("patient-caregivers");
      setCaregivers(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetchCaregivers();
  }, []);

  return { caregivers, loading, error, refetchCaregivers };
}
