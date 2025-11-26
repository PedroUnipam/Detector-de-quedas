// app/(auth)/cadastro.js

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { registerUser } from "../../services/authController.js";

// Máscaras
const maskCPF = (v) => {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskTelefone = (v) => {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const maskData = (v) => {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d{4})$/, "$1/$2");
};

const maskCEP = (v) => {
  return v
    .replace(/\D/g, "")               
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export default function Cadastro() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // PASSO 1 – Informações pessoais
  const [nome, setNome] = useState("");
  const [cpf, setCPF] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  // PASSO 2 – Endereço
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCEP] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>
        {step === 1 ? "Criar Conta" : "Endereço"}
      </Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={cpf}
            onChangeText={(t) => setCPF(maskCPF(t))}
            maxLength={14}
            keyboardType="numeric"
            placeholder="000.000.000-00"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={telefone}
            maxLength={15}
            onChangeText={(t) => setTelefone(maskTelefone(t))}
            keyboardType="numeric"
            placeholder="(00) 00000-0000"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seu@email.com"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />

          <Text style={styles.label}>Data de nascimento</Text>
          <TextInput
            style={styles.input}
            value={dataNascimento}
            onChangeText={(t) => setDataNascimento(maskData(t))}
            keyboardType="numeric"
            placeholder="dd/mm/aaaa"
            maxLength={10}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!nome || !cpf || !telefone || !email || !senha || !dataNascimento) {
                setError("Preencha todos os campos antes de continuar.");
                return;
              }
              setError("");
              setStep(2);
            }}
          >
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.linkText}>Já tem conta? Fazer login</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ================= PASSO 2 ================= */}
      {step === 2 && (
        <>
          <Text style={styles.label}>Rua</Text>
          <TextInput
            style={styles.input}
            value={rua}
            onChangeText={setRua}
            placeholder="Ex: Rua das Flores 123"
          />

          <Text style={styles.label}>Bairro</Text>
          <TextInput
            style={styles.input}
            value={bairro}
            onChangeText={setBairro}
            placeholder="Centro"
          />

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={cidade}
            onChangeText={setCidade}
            placeholder="São Paulo"
          />

          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={cep}
            onChangeText={(t) => setCEP(maskCEP(t))}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* BOTÃO FINALIZAR */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!rua || !bairro || !cidade || !cep) {
                setError("Preencha todos os campos do endereço.");
                return;
              }
              setError("");
              alert("Cadastro concluído (somente front).");
              router.replace("/(auth)/login");
            }}
          >
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.linkText}>Voltar</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContainer: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: "bold", color: "#007AFF", marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6, marginTop: 12, color: "#343a40" },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  hint: { fontSize: 13, color: "#6c757d", marginTop: 6, fontStyle: "italic" },
  tipoContainer: { flexDirection: "row", gap: 8, marginTop: 8 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tipoBtnActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  tipoText: { fontSize: 16, color: "#343a40" },
  tipoTextActive: { color: "#fff", fontWeight: "600" },
  suggestionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  suggestionsTitle: { fontSize: 13, fontWeight: "600", color: "#495057", marginBottom: 8 },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  suggestionChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  suggestionText: { fontSize: 12, color: "#007AFF", fontWeight: "500" },
  button: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  error: { color: "#dc3545", marginTop: 10, fontSize: 14, fontWeight: "500" },
  linkText: { marginTop: 16, textAlign: "center", color: "#007AFF", fontWeight: "500" },
});
