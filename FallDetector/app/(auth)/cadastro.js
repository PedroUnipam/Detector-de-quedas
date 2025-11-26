// app/(auth)/cadastro.js

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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

  const [tipoPessoa, setTipoPessoa] = useState("usuario"); // "usuario" ou "cuidador"
  const [dataNascimento, setDataNascimento] = useState("");

  const [tiposCuidador, setTiposCuidador] = useState([]);
  const [tipoCuidadorId, setTipoCuidadorId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Carregar tipos de cuidador do Firestore
  useEffect(() => {
    (async () => {
      try {
        const lista = await getTiposCuidador();
        setTiposCuidador(lista);
      } catch (err) {
        console.log(err);
        setError("Erro ao carregar tipos de cuidador.");
      }
    })();
  }, []);

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

    if (tipoPessoa === "cuidador" && !tipoCuidadorId) {
      setError("Selecione o tipo de cuidador.");
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
        tipoCuidadorId,
      });

      // após cadastro, joga para tela de login ou tabs
      router.replace("/(auth)/login");
    } catch (err) {
      console.log(err);
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
          style={[
            styles.tipoBtn,
            tipoPessoa === "usuario" && styles.tipoBtnActive,
          ]}
          onPress={() => setTipoPessoa("usuario")}
        >
          <Text
            style={[
              styles.tipoText,
              tipoPessoa === "usuario" && styles.tipoTextActive,
            ]}
          >
            Usuário
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tipoBtn,
            tipoPessoa === "cuidador" && styles.tipoBtnActive,
          ]}
          onPress={() => setTipoPessoa("cuidador")}
        >
          <Text
            style={[
              styles.tipoText,
              tipoPessoa === "cuidador" && styles.tipoTextActive,
            ]}
          >
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
          {tiposCuidador.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tipoOpcao,
                tipoCuidadorId === t.id && styles.tipoOpcaoActive,
              ]}
              onPress={() => setTipoCuidadorId(t.id)}
            >
              <Text
                style={[
                  styles.tipoOpcaoText,
                  tipoCuidadorId === t.id && styles.tipoOpcaoTextActive,
                ]}
              >
                {t.descricao || "Sem descrição"}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleCadastro}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Criando conta..." : "Criar conta"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.linkText}>Já tem conta? Fazer login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
    color: "#343a40",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  tipoContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tipoBtnActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tipoText: {
    fontSize: 16,
    color: "#343a40",
  },
  tipoTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  tipoOpcao: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    marginTop: 6,
    backgroundColor: "#fff",
  },
  tipoOpcaoActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tipoOpcaoText: {
    color: "#343a40",
  },
  tipoOpcaoTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
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
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  linkText: {
    marginTop: 16,
    textAlign: "center",
    color: "#007AFF",
    fontWeight: "500",
  },
});
