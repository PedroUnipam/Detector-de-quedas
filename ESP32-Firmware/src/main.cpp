#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"
#include <Wire.h>
#include <time.h>

// ===========================
// CONFIG WiFi - DESENVOLVIMENTO
// ===========================
const char* ssid     = "Loja Setta";      // <<< SUA REDE NORMAL
const char* password = "seTs@2022";       // <<< SENHA DA REDE

// ===========================
// FIREBASE
// ===========================
#define API_KEY "AIzaSyCk7yZZXAyAnLgWqjYWmfJXJgp84LMa4tk"
#define USER_EMAIL "esp32-device-1@system.com"
#define USER_PASSWORD "esp32_firmware@2025"
#define PROJECT_ID "falldetector-3efce"

String firestoreUrl =
  "https://firestore.googleapis.com/v1/projects/" PROJECT_ID "/databases/(default)/documents/quedas";
String idToken = "";

// ===========================
// MPU6050
// ===========================
#define SDA_PIN 21
#define SCL_PIN 22
MPU6050 mpu(Wire);

float THRESHOLD_MOVIMENTO = 1.6;
float THRESHOLD_IMPACTO  = 2.2;
float THRESHOLD_QUEDA    = 2.8;

unsigned long ultimoEnvio = 0;
unsigned long intervalo   = 3500;
String deviceId = "esp32-1";

// ===========================
// HTTP SERVER
// ===========================
WebServer server(80);

// ===========================
// LOGIN FIREBASE
// ===========================
bool loginFirebase() {
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

  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<512> resJson;
    deserializeJson(resJson, response);
    idToken = resJson["idToken"].as<String>();

    Serial.println("✔ Login Firebase OK");
    http.end();
    return true;
  }

  Serial.print("✖ Erro login Firebase: ");
  Serial.println(code);
  http.end();
  return false;
}

// ===========================
// TIMESTAMP
// ===========================
String getTimestampBrazil() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00-03:00";

  char buf[40];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S-03:00", &timeinfo);
  return String(buf);
}

// ===========================
// ENVIO FIRESTORE
// ===========================
void enviarQuedaFirestore(float ax, float ay, float az, float mag, int fallLevel) {
  if (idToken == "") loginFirebase();

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
  fields["fallLevel"]["integerValue"] = fallLevel;
  fields["timestamp"]["stringValue"] = getTimestampBrazil();

  String json;
  serializeJson(doc, json);

  Serial.println("\n📤 Enviando Firestore:");
  Serial.println(json);

  int code = http.POST(json);
  Serial.printf("HTTP Firestore: %d\n", code);

  http.end();
}

// ===========================
// HTTP HANDLERS
// ===========================
void handleRoot() {
  server.send(200, "text/plain", "ESP32 Online - use /status ou /reset_wifi");
}

void handleStatus() {
  String msg = "OK";
  if (WiFi.status() == WL_CONNECTED) {
    msg += " | IP: " + WiFi.localIP().toString();
    msg += " | RSSI: " + String(WiFi.RSSI());
  } else {
    msg += " | WiFi desconectado";
  }
  server.send(200, "text/plain", msg);
}

void handleResetWifi() {
  server.send(200, "text/plain", "Reset solicitado (placeholder)");
  Serial.println("Reset WiFi chamado - aqui você poderia apagar prefs no futuro");
}

// ===========================
// SETUP
// ===========================
void setup() {
  Serial.begin(115200);

  // WiFi STA na rede normal
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✔ WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // NTP
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");

  // Firebase
  loginFirebase();

  // MPU
  Wire.begin(SDA_PIN, SCL_PIN);
  mpu.begin();
  mpu.calcOffsets();
  Serial.println("MPU calibrado.");

  // HTTP
  server.on("/", handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/reset_wifi", HTTP_POST, handleResetWifi);
  server.begin();
  Serial.println("🌐 HTTP server iniciado");
}

// ===========================
// LOOP
// ===========================
void loop() {
  server.handleClient();

  mpu.update();

  float ax = mpu.getAccX();
  float ay = mpu.getAccY();
  float az = mpu.getAccZ();
  float mag = sqrt(ax * ax + ay * ay + az * az);

  int fallLevel = 0;
  if (mag > THRESHOLD_MOVIMENTO) fallLevel = 1;
  if (mag > THRESHOLD_IMPACTO)  fallLevel = 2;
  if (mag > THRESHOLD_QUEDA)    fallLevel = 3;

  bool quedaReal = fallLevel >= 2;

  if (quedaReal && (millis() - ultimoEnvio > intervalo)) {
    Serial.println("\n🚨 QUEDA DETECTADA!");
    Serial.printf("Mag=%.2f  Nível=%d\n", mag, fallLevel);

    enviarQuedaFirestore(ax, ay, az, mag, fallLevel);
    ultimoEnvio = millis();
  }

  delay(100);
}
