// controllers/usuarioController.js
const db = require("../services/firebase");
const { collection, addDoc } = require("firebase/firestore");

async function criarUsuario(data) {
  const ref = await addDoc(collection(db, "usuarios"), {
    pessoaId: data.pessoaId,
    data_nascimento: data.data_nascimento,
    consentimento_lgpd: true,
    foto_perfil: null
  });

  return ref.id;
}

module.exports = {
  criarUsuario
};
