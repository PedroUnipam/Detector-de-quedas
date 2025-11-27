import { useMutation } from "@tanstack/react-query";
import { useApi } from "./useApi";

export function useRegister() {
  const api = useApi();

  return useMutation({
    /**
     * @param {{
     *   email: string,
     *   password: string,
     *   cpf: string,
     *   name: string,
     *   cellphone: string,
     *   patient?: {
     *     street: string,
     *     city: string,
     *     state: string,
     *     zipCode: string,
     *     dateOfBirth: string
     *   }
     * }} body
     */
    mutationFn: (body) => api.post("/register", body),
  });
}
