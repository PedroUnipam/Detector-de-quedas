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
import { getTiposCuidador, registerUser } from "../../services/authController.js";

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

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCPF] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [tipoPessoa, setTipoPessoa] = useState("usuario"); 
  const [dataNascimento, setDataNascimento] = useState("");
  const [tipoCuidadorDescricao, setTipoCuidadorDescricao] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    setError("");

    if (!nome || !cpf || !telefone || !email || !senha) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (tipoPessoa === "usuario" && !dataNascimento) {
      setError("Informe a data de nascimento.");
      return;
    }

    if (tipoPessoa === "cuidador" && !tipoCuidadorDescricao.trim()) {
      setError("Informe o tipo de cuidador (ex: Enfermeiro, Familiar, etc).");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        nome,
        cpf,
        telefone,
        email,
        senha,
        tipoPessoa,
        dataNascimento,
        tipoCuidadorDescricao: tipoCuidadorDescricao.trim(),
      });

      router.replace("/(auth)/login");
    } catch (err) {
      console.error("❌ Erro no cadastro:", err);
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

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
        keyboardType="numeric"
        placeholder="000.000.000-00"
      />

      <Text style={styles.label}>Telefone</Text>
      <TextInput
        style={styles.input}
        value={telefone}
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

      <Text style={styles.label}>Tipo de conta</Text>
      <View style={styles.tipoContainer}>
        <TouchableOpacity
          style={[styles.tipoBtn, tipoPessoa === "usuario" && styles.tipoBtnActive]}
          onPress={() => setTipoPessoa("usuario")}
        >
          <Text style={[styles.tipoText, tipoPessoa === "usuario" && styles.tipoTextActive]}>
            Usuário
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tipoBtn, tipoPessoa === "cuidador" && styles.tipoBtnActive]}
          onPress={() => setTipoPessoa("cuidador")}
        >
          <Text style={[styles.tipoText, tipoPessoa === "cuidador" && styles.tipoTextActive]}>
            Cuidador
          </Text>
        </TouchableOpacity>
      </View>

      {tipoPessoa === "usuario" && (
        <>
          <Text style={styles.label}>Data de nascimento</Text>
          <TextInput
            style={styles.input}
            value={dataNascimento}
            onChangeText={(t) => setDataNascimento(maskData(t))}
            keyboardType="numeric"
            placeholder="dd/mm/aaaa"
          />
        </>
      )}

      {tipoPessoa === "cuidador" && (
        <>
          <Text style={styles.label}>Tipo de cuidador</Text>
          <TextInput
            style={styles.input}
            value={tipoCuidadorDescricao}
            onChangeText={setTipoCuidadorDescricao}
            placeholder="Ex: Enfermeiro, Familiar, Médico..."
            autoCapitalize="words"
          />

          <Text style={styles.hint}>
            💡 Informe sua especialidade ou relação com o paciente
          </Text>

          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugestões:</Text>

            <View style={styles.suggestionsRow}>
              {["Enfermeiro(a)", "Familiar", "Médico(a)", "Fisioterapeuta"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => setTipoCuidadorDescricao(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.suggestionsRow}>
              {["Cuidador Profissional", "Técnico Enfermagem"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => setTipoCuidadorDescricao(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleCadastro}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.linkText}>Já tem conta? Fazer login</Text>
      </TouchableOpacity>
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
