// services/firestorePessoas.js
const FIREBASE_REST_BASE =
  "https://firestore.googleapis.com/v1/projects/falldetector-3efce/databases/(default)/documents";

// ============================================
// BUSCAR PESSOA PELO EMAIL NA COLEÇÃO "pessoas"
// ============================================
export async function findPessoaByEmail(email) {
  try {
    const body = {
      structuredQuery: {
        from: [{ collectionId: "pessoas" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "email" },
            op: "EQUAL",
            value: { stringValue: email },
          },
        },
        limit: 1,
      },
    };

    const response = await fetch(`${FIREBASE_REST_BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0 || !data[0].document) {
      return { success: false, message: "E-mail não encontrado." };
    }

    const doc = data[0].document;

    const pessoa = {
      id: doc.name.split("/").pop(),
      nome: doc.fields.nome?.stringValue || "Sem nome",
      email: doc.fields.email?.stringValue || "",
    };

    return { success: true, pessoa };
  } catch (err) {
    console.error("❌ Erro ao buscar pessoa:", err);
    return { success: false, message: "Erro interno ao consultar Firestore." };
  }
}
