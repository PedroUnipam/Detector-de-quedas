#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"
#include <Wire.h>
#include <time.h>

// =====================================================
// PREFERENCES (SALVAR WIFI)
// =====================================================
Preferences prefs;

// =====================================================
// HTTP SERVER & MODO CONFIG (SoftAP)
// =====================================================
WebServer server(80);
bool setupMode = false;
bool serverStarted = false;

// =====================================================
// FIREBASE
// =====================================================
#define API_KEY "AIzaSyCk7yZZXAyAnLgWqjYWmfJXJgp84LMa4tk"
#define USER_EMAIL "esp32-device-1@system.com"
#define USER_PASSWORD "esp32_firmware@2025"
#define PROJECT_ID "falldetector-3efce"

String firestoreUrl = "https://firestore.googleapis.com/v1/projects/" PROJECT_ID "/databases/(default)/documents/quedas";
String idToken = "";

// =====================================================
// MPU6050
// =====================================================
#define SDA_PIN 21
#define SCL_PIN 22
MPU6050 mpu(Wire);

float THRESHOLD_MOVIMENTO = 1.6;
float THRESHOLD_IMPACTO = 2.2;
float THRESHOLD_QUEDA = 2.8;

unsigned long ultimoEnvio = 0;
unsigned long intervalo = 3500;
String deviceId = "esp32-1";

// =====================================================
// LOGIN FIREBASE
// =====================================================
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

// =====================================================
// TIMESTAMP
// =====================================================
String getTimestampBrazil() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00-03:00";

  char buf[40];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S-03:00", &timeinfo);
  return String(buf);
}

// =====================================================
// ENVIO FIRESTORE
// =====================================================
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

// =====================================================
// HTTP HANDLERS
// =====================================================
void handleRoot() {
  if (setupMode) {
    server.send(200, "text/plain", "ESP32 Config Mode - use POST /config");
  } else {
    server.send(200, "text/plain", "ESP32 Online - use /status ou /reset_wifi");
  }
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
  // Limpa credenciais salvas e reinicia
  prefs.clear();
  server.send(200, "text/plain", "WiFi resetado. Reiniciando em modo configuracao...");
  Serial.println("🧹 WiFi resetado via /reset_wifi. Reiniciando...");
  delay(1000);
  ESP.restart();
}

void handleConfig() {
  if (!setupMode) {
    server.send(400, "text/plain", "Nao estou em modo configuracao");
    return;
  }

  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Body ausente");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, server.arg("plain"));

  if (err) {
    server.send(400, "text/plain", "JSON invalido");
    return;
  }

  String ssid = doc["ssid"].as<String>();
  String pass = doc["password"].as<String>();

  if (ssid == "" || pass == "") {
    server.send(400, "text/plain", "SSID/Senha invalidos");
    return;
  }

  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);

  server.send(200, "text/plain", "OK — Reiniciando...");

  Serial.println("📡 SSID recebido: " + ssid);
  Serial.println("🔑 Senha salva.");

  delay(1000);
  ESP.restart();
}

// =====================================================
// CONFIGURAR ROTAS HTTP
// =====================================================
void setupHttpServer() {
  if (serverStarted) return;

  server.on("/", handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/reset_wifi", HTTP_ANY, handleResetWifi);
  server.on("/config", HTTP_POST, handleConfig);

  server.begin();
  serverStarted = true;
  Serial.println("🌐 HTTP server iniciado");
}

// =====================================================
// WIFI SALVO
// =====================================================
bool connectSavedWiFi() {
  String ssid = prefs.getString("ssid", "");
  String pass = prefs.getString("pass", "");

  if (ssid == "") {
    Serial.println("⚠ Nenhuma rede salva");
    return false;
  }

  Serial.println("Conectando à rede salva:");
  Serial.println("SSID: " + ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✔ Wi-Fi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("\n⛔ Falha ao conectar no Wi-Fi salvo");
  return false;
}

// =====================================================
// SOFTAP CONFIG
// =====================================================
void startSoftAP() {
  setupMode = true;

  WiFi.mode(WIFI_AP);
  WiFi.softAP("ESP-Setup", "12345678");

  IPAddress ip = WiFi.softAPIP();
  Serial.println("\n⚙ SOFTAP ATIVO!");
  Serial.print("Rede: ESP-Setup  Senha: 12345678  IP: ");
  Serial.println(ip);

  setupHttpServer();
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  prefs.begin("wifi", false);

  // Tenta conectar ao Wi-Fi salvo
  if (!connectSavedWiFi()) {
    Serial.println("Entrando em modo configuracao (SoftAP)...");
    startSoftAP();
  } else {
    // Modo normal
    setupMode = false;
    setupHttpServer(); // server acessível em modo STA também

    // NTP
    configTime(-3 * 3600, 0, "pool.ntp.org", "time.google.com");

    loginFirebase();

    Wire.begin(SDA_PIN, SCL_PIN);
    mpu.begin();
    mpu.calcOffsets();
    Serial.println("MPU calibrado.");
  }
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  // Sempre atender HTTP (tanto em STA quanto em AP)
  if (serverStarted) {
    server.handleClient();
  }

  // Se estiver em modo configuração, não faz lógica de queda
  if (setupMode) {
    delay(10);
    return;
  }

  // Modo normal: detecção de queda
  mpu.update();

  float ax = mpu.getAccX();
  float ay = mpu.getAccY();
  float az = mpu.getAccZ();
  float mag = sqrt(ax * ax + ay * ay + az * az);

  int fallLevel = 0;
  if (mag > THRESHOLD_MOVIMENTO) fallLevel = 1;
  if (mag > THRESHOLD_IMPACTO) fallLevel = 2;
  if (mag > THRESHOLD_QUEDA) fallLevel = 3;

  bool quedaReal = fallLevel >= 2;

  if (quedaReal && (millis() - ultimoEnvio > intervalo)) {
    Serial.println("\n🚨 QUEDA DETECTADA!");
    Serial.printf("Mag=%.2f  Nível=%d\n", mag, fallLevel);

    enviarQuedaFirestore(ax, ay, az, mag, fallLevel);
    ultimoEnvio = millis();
  }

  delay(100);
}
