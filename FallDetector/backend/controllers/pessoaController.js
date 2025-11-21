// controllers/pessoaController.js
const db = require("../services/firebase");
const { collection, addDoc } = require("firebase/firestore");

async function criarPessoa(data) {
  const ref = await addDoc(collection(db, "pessoas"), {
    nome: data.nome,
    cpf: data.cpf,
    email: data.email,
    telefone: data.telefone,
    status_ativo: true,
    data_cadastro: new Date(),
    ultimo_acesso: null
  });

  return ref.id;
}

module.exports = {
  criarPessoa
};
