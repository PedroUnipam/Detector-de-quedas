#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"
#include <Wire.h>
#include <time.h>

// ===========================
// CONFIG WiFi
// ===========================
const char *ssid = "FISIOS R";
const char *password = "13032981";

// ===========================
// CONFIG Firebase
// ===========================
#define API_KEY "AIzaSyCk7yZZXAyAnLgWqjYWmfJXJgp84LMa4tk"
#define USER_EMAIL "esp32-device-1@system.com"
#define USER_PASSWORD "esp32_firmware@2025"
#define PROJECT_ID "falldetector-3efce"

// Firestore URL
String firestoreUrl = "https://firestore.googleapis.com/v1/projects/" PROJECT_ID "/databases/(default)/documents/quedas";

// ===========================
// CONFIG DISPOSITIVO
// ===========================
String deviceId = "esp32-1";

#define SDA_PIN 21
#define SCL_PIN 22
MPU6050 mpu(Wire);

float THRESHOLD_MIN = 0.5;
float THRESHOLD_MAX = 2.5;

unsigned long ultimoEnvio = 0;
unsigned long intervalo = 5000;

// ======================================================
// AUTH: Obter token JWT do Firebase Auth via REST
// ======================================================
String idToken = "";

bool loginFirebase()
{
  HTTPClient http;
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(API_KEY);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["email"] = USER_EMAIL;
  doc["password"] = USER_PASSWORD;
  doc["returnSecureToken"] = true;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);

  if (code == 200)
  {
    String response = http.getString();
    StaticJsonDocument<512> resJson;
    deserializeJson(resJson, response);
    idToken = resJson["idToken"].as<String>();

    Serial.println("✔ Login Firebase OK");
    Serial.println("Token:");
    Serial.println(idToken);

    http.end();
    return true;
  }

  Serial.print("✖ Erro login Firebase: ");
  Serial.println(code);
  Serial.println(http.getString());

  http.end();
  return false;
}

// ======================================================
// OBTER TIMESTAMP EM RFC3339 (DATA REAL)
// ======================================================
String getTimestampRFC3339()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo))
  {
    return "1970-01-01T00:00:00Z";
  }

  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ======================================================
// FUNÇÃO PARA ENVIAR DADOS DE QUEDA AO FIREBASE
// ======================================================
void enviarQuedaFirestore(float ax, float ay, float az, float mag)
{
  if (idToken == "")
  {
    Serial.println("❌ Sem token! Tentando logar...");
    loginFirebase();
    if (idToken == "")
      return;
  }

  HTTPClient http;
  http.begin(firestoreUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + idToken);

  StaticJsonDocument<512> doc;

  JsonObject fields = doc.createNestedObject("fields");

  fields["deviceId"]["stringValue"] = deviceId;
  fields["accX"]["doubleValue"] = ax;
  fields["accY"]["doubleValue"] = ay;
  fields["accZ"]["doubleValue"] = az;
  fields["accMag"]["doubleValue"] = mag;
  fields["wifiSignal"]["integerValue"] = WiFi.RSSI();

  // AGORA SALVA DATA REAL !!!
  fields["timestamp"]["stringValue"] = getTimestampRFC3339();

  String json;
  serializeJson(doc, json);

  Serial.println("\n📤 Enviando para Firestore:");
  Serial.println(json);

  int code = http.POST(json);

  Serial.printf("Código HTTP Firestore: %d\n", code);
  Serial.println(http.getString());

  http.end();
}

// ======================================================
// SETUP
// ======================================================
void setup()
{
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");

  // CONFIGURAÇÃO DO NTP (data real)
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");

  Serial.println("Sincronizando horário...");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo))
  {
    Serial.println("Aguardando NTP...");
    delay(500);
  }
  Serial.println("Horário sincronizado!");

  // Login Firebase
  loginFirebase();

  // MPU
  Wire.begin(SDA_PIN, SCL_PIN);
  mpu.begin();
  mpu.calcOffsets();
  Serial.println("MPU calibrado.");
}

// ======================================================
// LOOP PRINCIPAL
// ======================================================
void loop()
{
  mpu.update();

  float ax = mpu.getAccX();
  float ay = mpu.getAccY();
  float az = mpu.getAccZ();

  float mag = sqrt(ax * ax + ay * ay + az * az);

  // CONTINUA USANDO O MILLIS PARA INTERVALO (OK!)
  if ((mag < THRESHOLD_MIN || mag > THRESHOLD_MAX) &&
      (millis() - ultimoEnvio > intervalo))
  {

    Serial.println("\n🚨 QUEDA DETECTADA!");
    Serial.printf("Mag=%.2f X=%.2f Y=%.2f Z=%.2f\n", mag, ax, ay, az);

    enviarQuedaFirestore(ax, ay, az, mag);

    ultimoEnvio = millis();
  }

  delay(100);
}
