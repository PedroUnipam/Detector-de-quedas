#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"
#include <Wire.h>
#include <time.h>
#include <Preferences.h>

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
// WIFI / CONFIG
// ===========================
WebServer server(80);
Preferences prefs;

const char* AP_SSID     = "FallDetector-Setup";
const char* AP_PASSWORD = "12345678";

bool modoConfig = false; // true = AP de configuração, false = STA normal

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

  fields["deviceId"]["stringValue"]   = deviceId;
  fields["accX"]["doubleValue"]       = ax;
  fields["accY"]["doubleValue"]       = ay;
  fields["accZ"]["doubleValue"]       = az;
  fields["accMag"]["doubleValue"]     = mag;
  fields["wifiSignal"]["integerValue"]= WiFi.RSSI();
  fields["fallLevel"]["integerValue"] = fallLevel;
  fields["timestamp"]["stringValue"]  = getTimestampBrazil();

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
//
void handleCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleRoot() {
  handleCors();
  String msg;
  if (modoConfig) {
    msg = "ESP32 em modo CONFIG. Envie POST /config_wifi com {ssid,password}.";
  } else {
    msg = "ESP32 Online. Use /status ou /reset_wifi.";
  }
  server.send(200, "text/plain", msg);
}

void handleStatus() {
  handleCors();
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
  handleCors();
  // Apaga dados salvos e reinicia em modo AP
  prefs.begin("wifi", false);
  prefs.clear();
  prefs.end();

  server.send(200, "text/plain", "WiFi resetado. Reiniciando em modo AP...");
  delay(1000);
  ESP.restart();
}

// RECEBE JSON { "ssid": "...", "password": "..." }
void handleConfigWifi() {
  handleCors();
  // if (!server.hasArg("plain")) {
  //   server.send(400, "text/plain", "JSON obrigatório");
  //   return;
  // }

  // String body = server.arg("plain");
  // StaticJsonDocument<256> doc;
  // DeserializationError err = deserializeJson(doc, body);

  // if (err) {
  //   server.send(400, "text/plain", "JSON inválido");
  //   return;
  // }

  // String newSsid = doc["ssid"].as<String>();
  // String newPass = doc["password"].as<String>();

  // Serial.println("📡 Recebido novo WiFi:");
  // Serial.println("SSID: " + newSsid);
  // Serial.println("PASS: " + newPass);

  // Salva nas Preferences
  prefs.begin("wifi", false);
  prefs.putString("ssid", "Pedro");
  prefs.putString("password", "teste123");
  prefs.end();

  server.send(200, "application/json", "{\"success\":true}");

  Serial.println("Reiniciando para conectar na nova rede...");
  delay(1000);
  ESP.restart();
}

// ===========================
// WIFI: CONECTAR OU MODO AP
// ===========================
void iniciarWifi() {
  prefs.begin("wifi", false);
  String savedSsid = prefs.getString("ssid", "");
  String savedPass = prefs.getString("password", "");
  prefs.end();

  if (savedSsid.length() == 0) {
    Serial.println("⚠ Nenhum WiFi salvo. Iniciando modo AP de configuração.");
    modoConfig = true;
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print("AP SSID: ");
    Serial.println(AP_SSID);
    Serial.print("IP AP: ");
    Serial.println(WiFi.softAPIP());
    return;
  }

  Serial.print("Conectando a WiFi salva: ");
  Serial.println(savedSsid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSsid.c_str(), savedPass.c_str());

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 20) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    modoConfig = false;
    Serial.println("\n✔ WiFi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Falha ao conectar. Entrando em modo AP de configuração.");
    modoConfig = true;
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.print("AP SSID: ");
    Serial.println(AP_SSID);
    Serial.print("IP AP: ");
    Serial.println(WiFi.softAPIP());
  }
}

// ===========================
// SETUP
// ===========================
void setup() {
  Serial.begin(115200);

  iniciarWifi();

  // NTP
  configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");

  if (!modoConfig) {
    // Firebase só faz sentido se estiver conectado
    loginFirebase();

    // MPU
    Wire.begin(SDA_PIN, SCL_PIN);
    mpu.begin();
    mpu.calcOffsets();
    Serial.println("MPU calibrado.");
  }

  // HTTP
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/reset_wifi", HTTP_POST, handleResetWifi);
  server.on("/config_wifi", HTTP_GET, handleConfigWifi);
  server.begin();
  Serial.println("🌐 HTTP server iniciado");
}

// ===========================
// LOOP
// ===========================
void loop() {
  server.handleClient();

  if (modoConfig) {
    // Só portal de configuração
    delay(100);
    return;
  }

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
