// controllers/cuidadorController.js
const db = require("../services/firebase");
const { collection, addDoc } = require("firebase/firestore");

async function criarCuidador(data) {
  const ref = await addDoc(collection(db, "cuidadores"), {
    pessoaId: data.pessoaId,
    tipoCuidadorId: data.tipoCuidadorId
  });

  return ref.id;
}

module.exports = {
  criarCuidador
};
