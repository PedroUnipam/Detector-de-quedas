// services/deviceService.js
import { auth, db } from './firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

// Envia SSID/Senha para o ESP32 em modo AP (IP do AP é 192.168.4.1)
export async function configurarWifiAP(ssid, password) {
  try {
    const r = await fetch('http://192.168.4.1/config_wifi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password }),
    });

    if (!r.ok) {
      console.log('Erro HTTP ao enviar WiFi:', r.status);
      return false;
    }

    const json = await r.json();
    return !!json.success;
  } catch (e) {
    console.log('Erro ao configurar WiFi no ESP:', e);
    return false;
  }
}

// Registra o dispositivo no Firestore em usuarios/{uid}/dispositivos/{deviceId}
export async function registrarDispositivo({ deviceId, nome, wifiSsid }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const uid = user.uid;

  const ref = doc(db, 'usuarios', uid, 'dispositivos', deviceId);
  await setDoc(ref, {
    deviceId,
    nome,
    wifiSsid,
    ownerUid: uid,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}
