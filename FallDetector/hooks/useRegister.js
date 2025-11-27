import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
  baseURL: "https://fall-detector-api.vercel.app",
});

export function useRegister() {
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
