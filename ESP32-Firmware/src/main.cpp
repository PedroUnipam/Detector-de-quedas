/* ESP32 - Fall Detector + HTTP endpoints
   Endpoints:
     GET  /connect      -> { status: "connected", deviceId: ... }
     GET  /status       -> plain text status
     GET  /latest_fall  -> {"hasFall": true/false, "timestamp": 12345, "deviceId": ...}
     POST /ack          -> acknowledge and clear fall (optional)
*/

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"
#include <WebServer.h>

// ========== CONFIG ==========
const char* ssid = "FISIOS R";
const char* password = "13032981";
const char* serverUrl = "http://192.168.0.10:3000/api/falls/register"; // sua API externa (se usar)
int deviceId = 1;

// I2C pins
#define SDA_PIN 21
#define SCL_PIN 22
MPU6050 mpu(Wire);

// HTTP server
WebServer server(80);

// detection thresholds and control
const float THRESHOLD_MIN = 0.5;
const float THRESHOLD_MAX = 2.5;
const unsigned long INTERVAL_ENVIO = 5000;
unsigned long ultimoEnvio = 0;
volatile bool quedaDetectada = false;

// last fall info (shared via HTTP)
volatile unsigned long lastFallTimestamp = 0; // millis() when fall detected
volatile bool hasNewFall = false;

// LED status
#define LED_STATUS 2
unsigned long ultimoPisca = 0;

void IRAM_ATTR handleFall() {
  // not used as interrupt here, but kept for future
  quedaDetectada = true;
}

// quick LED blink
void piscarLED(int vezes, int intervalo) {
  for (int i = 0; i < vezes; i++) {
    digitalWrite(LED_STATUS, HIGH);
    delay(intervalo);
    digitalWrite(LED_STATUS, LOW);
    delay(intervalo);
  }
}

// simple validation
bool validarConfiguracao() {
  bool valido = true;
  if (String(ssid) == "SEU_WIFI_SSID") valido = false;
  if (String(password) == "SUA_SENHA_WIFI") valido = false;
  if (deviceId <= 0) valido = false;
  return valido;
}

// ENVIAR DADOS PARA SUA API (opcional)
void enviarQuedaParaServidor(float accX, float accY, float accZ, float accMag) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["accel_x"] = accX;
  doc["accel_y"] = accY;
  doc["accel_z"] = accZ;
  doc["timestamp"] = millis();
  doc["wifi_signal"] = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  Serial.printf("Envio servidor, code=%d\n", code);
  http.end();
}

// HTTP handlers
void handleConnect() {
  StaticJsonDocument<128> doc;
  doc["status"] = "connected";
  doc["deviceId"] = deviceId;
  doc["wifi_signal"] = WiFi.RSSI();

  String s;
  serializeJson(doc, s);
  server.send(200, "application/json", s);
}

void handleStatus() {
  String msg = "ESP32 OK — IP: " + WiFi.localIP().toString();
  server.send(200, "text/plain", msg);
}

void handleLatestFall() {
  StaticJsonDocument<128> doc;
  doc["deviceId"] = deviceId;
  doc["hasFall"] = hasNewFall ? true : false;
  doc["timestamp"] = lastFallTimestamp;
  String s;
  serializeJson(doc, s);
  server.send(200, "application/json", s);
}

void handleAck() {
  // client acknowledges fall; clear flag
  hasNewFall = false;
  lastFallTimestamp = 0;
  server.send(200, "application/json", "{\"ok\":true}");
}

void setup() {
  Serial.begin(115200);
  delay(500);
  pinMode(LED_STATUS, OUTPUT);
  digitalWrite(LED_STATUS, LOW);

  Serial.println("\n🚨 Fall Detector iniciando...");

  if (!validarConfiguracao()) {
    Serial.println("Configuração inválida. Editar ssid/password/deviceId no código.");
    while (1) {
      piscarLED(3, 200);
      delay(1000);
    }
  }

  // connect Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("📶 WiFi conectado! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("❌ Falha ao conectar WiFi");
  }

  // start I2C and MPU
  Wire.begin(SDA_PIN, SCL_PIN);
  if (mpu.begin() != 0) {
    Serial.println("❌ Erro MPU6050!");
    while (1) {}
  }
  mpu.calcOffsets();
  Serial.println("⚙️ MPU calibrado.");

  // HTTP endpoints
  server.on("/connect", HTTP_GET, handleConnect);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/latest_fall", HTTP_GET, handleLatestFall);
  server.on("/ack", HTTP_POST, handleAck);
  server.begin();
  Serial.println("🌐 Servidor HTTP iniciado!");
}

void loop() {
  server.handleClient();

  mpu.update();
  float accX = mpu.getAccX();
  float accY = mpu.getAccY();
  float accZ = mpu.getAccZ();
  float accMag = sqrt(accX*accX + accY*accY + accZ*accZ);

  // detect fall by magnitude outside thresholds and interval
  if ((accMag < THRESHOLD_MIN || accMag > THRESHOLD_MAX) && (millis() - ultimoEnvio > INTERVAL_ENVIO)) {
    Serial.println("\n🚨 QUEDA DETECTADA!");
    Serial.printf("accMag=%.3f x=%.3f y=%.3f z=%.3f\n", accMag, accX, accY, accZ);

    // set shared flag & timestamp for app to read
    lastFallTimestamp = millis();
    hasNewFall = true;

    // optional: blink LED and try send to external server
    piscarLED(3, 100);
    enviarQuedaParaServidor(accX, accY, accZ, accMag);

    ultimoEnvio = millis();
  }

  // tiny alive blink
  if (millis() - ultimoPisca > 5000) {
    digitalWrite(LED_STATUS, HIGH);
    delay(40);
    digitalWrite(LED_STATUS, LOW);
    ultimoPisca = millis();
  }

  delay(100);
}
