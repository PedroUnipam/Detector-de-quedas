import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

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
 * @returns {import("@tanstack/react-query").UseQueryResult<Profile, Error>} Query result containing profile data
 */
export function useProfile() {
  const api = useApi();

  return useQuery({
    queryKey: ["profile"],
    queryFn: api.get("profile"),
  });
}
