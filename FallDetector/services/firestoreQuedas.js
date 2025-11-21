// services/firestoreQuedas.js

import { db } from "../services/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export const getQuedasFromFirestore = async () => {
  try {
    const quedasRef = collection(db, "quedas");

    // ⚠ Firestore ordena strings ISO normalmente
    const q = query(quedasRef, orderBy("timestamp", "desc"));

    const snapshot = await getDocs(q);

    const quedas = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        accMag: data.accMag,
        accX: data.accX,
        accY: data.accY,
        accZ: data.accZ,
        wifiSignal: data.wifiSignal,
        deviceId: data.deviceId,

        // converter string → Date
        date: new Date(data.timestamp)
      };
    });

    return quedas;

  } catch (error) {
    console.error("Erro ao buscar quedas:", error);
    return [];
  }
};
