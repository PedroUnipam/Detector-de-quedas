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
 * @typedef {Object} usePatientReturn
 * @property {Profile[]} patients
 * @property {boolean} loading
 * @property {Error} error
 * @property {() => Promise<void>} refetchPatients
 * @returns {usePatientReturn}
 */
export function usePatients() {
  const api = useApi();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const refetchPatients = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/patient-caregivers/caregiver");
      setPatients(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refetchPatients();
  }, []);

  return { patients, loading, error, refetchPatients };
}
