const admin = require('firebase-admin');
const db = admin.firestore();

const PESSOAS = 'pessoas';
const USUARIOS = 'usuarios';
const ENDERECOS = 'enderecos';
const UFS = 'ufs';
const CUIDADORES = 'cuidadores';

exports.getProfile = async (req, res) => {
  try {
    const usuarioSnap = await db.collection(USUARIOS).doc(req.user.id).get();

    if (!usuarioSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.'
      });
    }

    const usuario = usuarioSnap.data();
    const [pessoaSnap, enderecoSnap] = await Promise.all([
      db.collection(PESSOAS).doc(usuario.pessoaId).get(),
      usuario.enderecoId
        ? db.collection(ENDERECOS).doc(usuario.enderecoId).get()
        : null
    ]);

    if (!pessoaSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Pessoa não encontrada.'
      });
    }

    const pessoa = pessoaSnap.data();
    let endereco = null;
    let ufSigla = null;

    if (enderecoSnap && enderecoSnap.exists) {
      endereco = enderecoSnap.data();
      if (endereco.estadoId) {
        const ufSnap = await db.collection(UFS).doc(endereco.estadoId).get();
        if (ufSnap.exists) ufSigla = ufSnap.data().sigla;
      }
    }

    res.json({
      success: true,
      user: {
        id: usuarioSnap.id,
        id_pessoa: usuario.pessoaId,
        nome: pessoa.nome,
        email: pessoa.email,
        cpf: pessoa.cpf,
        telefone: pessoa.telefone,
        data_nascimento: usuario.data_nascimento,
        foto_perfil: usuario.foto_perfil,
        cep: endereco?.cep || null,
        logradouro: endereco?.logradouro || null,
        numero: endereco?.numero || null,
        bairro: endereco?.bairro || null,
        cidade: endereco?.cidade || null,
        complemento: endereco?.complemento || null,
        uf: ufSigla,
        data_cadastro: pessoa.data_cadastro,
        ultimo_acesso: pessoa.ultimo_acesso
      }
    });
  } catch (err) {
    console.error('Erro ao obter perfil (Firestore):', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter perfil.',
      error: err.message
    });
  }
};

exports.getCuidadores = async (req, res) => {
  try {
    const vinculosSnap = await db
      .collection(USUARIOS)
      .doc(req.user.id)
      .collection('cuidadores')
      .where('ativo', '==', true)
      .orderBy('data_vinculo', 'desc')
      .get();

    const cuidadores = [];

    for (const vinculoDoc of vinculosSnap.docs) {
      const v = vinculoDoc.data();
      const cuidadorSnap = await db.collection(CUIDADORES).doc(v.cuidadorId).get();
      if (!cuidadorSnap.exists) continue;

      const cuidador = cuidadorSnap.data();
      const pessoaSnap = await db.collection(PESSOAS).doc(cuidador.pessoaId).get();
      if (!pessoaSnap.exists) continue;

      const pessoa = pessoaSnap.data();
      // se tiver tipos em tiposCuidador, pode buscar aqui
      cuidadores.push({
        id: cuidadorSnap.id,
        nome: pessoa.nome,
        email: pessoa.email,
        telefone: pessoa.telefone,
        parentesco: cuidador.tipoCuidadorId, // ou descrição, se buscar em tiposCuidador
        data_vinculo: v.data_vinculo,
        ativo: v.ativo
      });
    }

    res.json({ success: true, cuidadores });
  } catch (err) {
    console.error('Erro ao listar cuidadores (Firestore):', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar cuidadores.',
      error: err.message
    });
  }
};
