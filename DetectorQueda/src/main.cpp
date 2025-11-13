#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "MPU6050_light.h"

// ==================== CONFIGURAÇÕES WiFi ====================
// IMPORTANTE: Configure estes valores através do app mobile
// ou manualmente aqui antes de gravar no ESP32

const char* ssid = "SEU_WIFI_SSID";           // Configure no app
const char* password = "SUA_SENHA_WIFI";       // Configure no app

// ==================== CONFIGURAÇÕES API ====================
const char* serverUrl = "http://192.168.0.10:3000/api/falls/register"; 
const int deviceId = 1; // ID gerado automaticamente pelo sistema

// ==================== PINOS I2C ====================
#define SDA_PIN 21
#define SCL_PIN 22
#define MPU_INT 5

MPU6050 mpu(Wire);

// ==================== VARIÁVEIS DE CONTROLE ====================
volatile bool quedaDetectada = false;
unsigned long ultimoEnvio = 0;
const unsigned long INTERVALO_ENVIO = 5000; // 5 segundos entre envios
bool wifiConectado = false;

// ==================== THRESHOLDS DE DETECÇÃO ====================
const float THRESHOLD_MIN = 0.5;   // Queda livre (< 0.5g)
const float THRESHOLD_MAX = 2.5;   // Impacto forte (> 2.5g)

// ==================== LED DE STATUS ====================
#define LED_STATUS 2  // LED interno do ESP32
unsigned long ultimoPisca = 0;
bool ledState = false;

// ==================== INTERRUPÇÃO ====================
void IRAM_ATTR handleFall() {
  quedaDetectada = true;
}

// ==================== FUNÇÃO PARA PISCAR LED ====================
void piscarLED(int vezes, int intervalo) {
  for (int i = 0; i < vezes; i++) {
    digitalWrite(LED_STATUS, HIGH);
    delay(intervalo);
    digitalWrite(LED_STATUS, LOW);
    delay(intervalo);
  }
}

// ==================== VALIDAR CONFIGURAÇÕES ====================
bool validarConfiguracao() {
  bool valido = true;
  
  Serial.println("\n🔍 Validando configurações...");
  
  if (String(ssid) == "SEU_WIFI_SSID") {
    Serial.println("❌ ERRO: SSID não configurado!");
    Serial.println("   Configure o WiFi no app ou manualmente no código.");
    valido = false;
  }
  
  if (String(password) == "SUA_SENHA_WIFI") {
    Serial.println("❌ ERRO: Senha WiFi não configurada!");
    valido = false;
  }
  
  if (String(serverUrl).indexOf("192.168.0.10") > -1) {
    Serial.println("⚠️  AVISO: URL do servidor ainda é o padrão.");
    Serial.println("   Verifique se o IP está correto.");
  }
  
  if (deviceId <= 0) {
    Serial.println("❌ ERRO: Device ID inválido!");
    valido = false;
  }
  
  if (valido) {
    Serial.println("✅ Configurações válidas!");
    Serial.println("   SSID: " + String(ssid));
    Serial.println("   Device ID: " + String(deviceId));
    Serial.println("   Server: " + String(serverUrl));
  }
  
  return valido;
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Configurar LED
  pinMode(LED_STATUS, OUTPUT);
  digitalWrite(LED_STATUS, LOW);
  
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🚨 Fall Detector - Sistema Iniciando");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Validar configuração
  if (!validarConfiguracao()) {
    Serial.println("\n❌ CONFIGURAÇÃO INVÁLIDA!");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("📱 Configure o dispositivo através do app:");
    Serial.println("   1. Abra o app Fall Detector");
    Serial.println("   2. Vá em 'Dispositivos'");
    Serial.println("   3. Adicione um novo dispositivo WiFi");
    Serial.println("   4. Copie as configurações geradas");
    Serial.println("   5. Cole no início deste arquivo");
    Serial.println("   6. Grave novamente no ESP32");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Piscar LED rapidamente indicando erro
    while(1) {
      piscarLED(3, 100);
      delay(1000);
    }
  }

  // ==================== INICIALIZAR WiFi ====================
  Serial.print("\n📡 Conectando ao WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED && tentativas < 30) {
    delay(500);
    Serial.print(".");
    piscarLED(1, 100);
    tentativas++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConectado = true;
    Serial.println("\n✅ WiFi conectado!");
    Serial.print("📍 IP Local: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Sinal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    // LED aceso indicando WiFi conectado
    digitalWrite(LED_STATUS, HIGH);
    delay(2000);
    digitalWrite(LED_STATUS, LOW);
  } else {
    wifiConectado = false;
    Serial.println("\n❌ Falha ao conectar WiFi!");
    Serial.println("⚠️ Sistema continuará em modo offline...");
    Serial.println("⚠️ Dados de queda serão exibidos apenas no Serial Monitor.");
    
    // Piscar LED 5 vezes indicando falha WiFi
    piscarLED(5, 200);
  }

  // ==================== INICIALIZAR I2C ====================
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // ==================== INICIALIZAR MPU6050 ====================
  Serial.println("\n📦 Inicializando MPU6050...");
  byte status = mpu.begin();
  
  if (status == 0) {
    Serial.println("✅ MPU6050 inicializado com sucesso!");
  } else {
    Serial.print("❌ Erro ao inicializar MPU6050. Status: ");
    Serial.println(status);
    Serial.println("\n🔧 Possíveis soluções:");
    Serial.println("   - Verifique conexões I2C (SDA e SCL)");
    Serial.println("   - Verifique alimentação do sensor");
    Serial.println("   - Tente outro endereço I2C (0x68 ou 0x69)");
    
    while(1) {
      piscarLED(2, 300);
      delay(1000);
    }
  }

  // ==================== CALIBRAÇÃO ====================
  Serial.println("\n🔧 Calibrando sensor...");
  Serial.println("⚠️ Mantenha o dispositivo PARADO e HORIZONTAL!");
  
  // Feedback visual durante calibração
  for(int i = 3; i > 0; i--) {
    Serial.print(i);
    Serial.println("...");
    piscarLED(1, 500);
    delay(1000);
  }
  
  mpu.calcOffsets();
  
  Serial.println("✅ Calibração concluída!");
  
  // ==================== TESTE DE CONECTIVIDADE ====================
  if (wifiConectado) {
    Serial.println("\n🔌 Testando conexão com servidor...");
    HTTPClient http;
    http.begin("http://" + String(serverUrl).substring(7).substring(0, String(serverUrl).indexOf(":", 7) - 7) + ":3000/api/health");
    http.setTimeout(5000);
    
    int httpCode = http.GET();
    if (httpCode > 0) {
      Serial.println("✅ Servidor respondendo!");
      piscarLED(3, 100);
    } else {
      Serial.println("⚠️ Servidor não responde. Verifique se está rodando.");
    }
    http.end();
  }
  
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("✅ Sistema pronto para detectar quedas!");
  Serial.println("📊 Monitoramento iniciado...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Configurar interrupção (opcional)
  // pinMode(MPU_INT, INPUT);
  // attachInterrupt(digitalPinToInterrupt(MPU_INT), handleFall, RISING);
}

// ==================== FUNÇÃO PARA ENVIAR DADOS ====================
void enviarQueda(float accX, float accY, float accZ, float accMag) {
  // Verificar reconexão WiFi se desconectado
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi desconectado. Tentando reconectar...");
    WiFi.reconnect();
    delay(3000);
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("❌ Não foi possível reconectar. Queda registrada apenas localmente.");
      wifiConectado = false;
      return;
    } else {
      Serial.println("✅ WiFi reconectado!");
      wifiConectado = true;
    }
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 segundos timeout

  // Criar JSON com os dados
  StaticJsonDocument<512> doc;
  doc["device_id"] = deviceId;
  doc["fall_latitude"] = -18.9186;  // TODO: Integrar GPS real
  doc["fall_longitude"] = -48.2772; // TODO: Integrar GPS real
  doc["accel_x"] = accX;
  doc["accel_y"] = accY;
  doc["accel_z"] = accZ;
  doc["timestamp"] = millis();
  doc["wifi_signal"] = WiFi.RSSI();

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println("\n📤 Enviando dados de queda para API...");
  Serial.println("📦 JSON: " + jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✅ Resposta do servidor (");
    Serial.print(httpResponseCode);
    Serial.println("):");
    Serial.println(response);
    
    // Feedback visual: LED pisca 3 vezes rapidamente
    piscarLED(3, 100);
    
    // Parse da resposta para verificar sucesso
    StaticJsonDocument<256> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      bool success = responseDoc["success"];
      if (success) {
        Serial.println("✅ Queda registrada no sistema!");
        Serial.println("📱 Notificações enviadas aos cuidadores.");
      }
    }
  } else {
    Serial.print("❌ Erro ao enviar dados. Código HTTP: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == -1) {
      Serial.println("⚠️ Timeout na requisição. Servidor demorou muito para responder.");
    } else if (httpResponseCode == -11) {
      Serial.println("⚠️ Erro de conexão. Verifique se o servidor está rodando.");
    }
    
    // Feedback visual: LED pisca lentamente 2 vezes
    piscarLED(2, 500);
  }

  http.end();
}

// ==================== LOOP PRINCIPAL ====================
void loop() {
  mpu.update();

  // Calcular magnitude da aceleração total
  float accX = mpu.getAccX();
  float accY = mpu.getAccY();
  float accZ = mpu.getAccZ();
  float accMag = sqrt(accX * accX + accY * accY + accZ * accZ);

  // Exibir dados no Serial Monitor (a cada 500ms)
  static unsigned long ultimaLeitura = 0;
  if (millis() - ultimaLeitura > 500) {
    Serial.print("📊 Acc: ");
    Serial.print(accMag, 2);
    Serial.print("g | X:");
    Serial.print(accX, 2);
    Serial.print(" Y:");
    Serial.print(accY, 2);
    Serial.print(" Z:");
    Serial.print(accZ, 2);
    
    if (wifiConectado) {
      Serial.print(" | WiFi: ");
      Serial.print(WiFi.RSSI());
      Serial.print("dBm");
    } else {
      Serial.print(" | [OFFLINE]");
    }
    Serial.println();
    
    ultimaLeitura = millis();
  }

  // ==================== DETECÇÃO DE QUEDA ====================
  unsigned long agora = millis();
  
  if ((accMag < THRESHOLD_MIN || accMag > THRESHOLD_MAX) && 
      (agora - ultimoEnvio > INTERVALO_ENVIO)) {
    
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("🚨 ALERTA: QUEDA DETECTADA!");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("⚠️ Aceleração anormal: ");
    Serial.print(accMag, 2);
    Serial.println("g");
    Serial.print("📍 Dispositivo ID: ");
    Serial.println(deviceId);
    Serial.print("🕐 Timestamp: ");
    Serial.println(agora);
    
    // LED aceso durante envio
    digitalWrite(LED_STATUS, HIGH);
    
    // Enviar dados para a API (se conectado)
    if (wifiConectado) {
      enviarQueda(accX, accY, accZ, accMag);
    } else {
      Serial.println("⚠️ Sistema offline - dados não enviados ao servidor.");
    }
    
    digitalWrite(LED_STATUS, LOW);
    ultimoEnvio = agora;
    
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  // Piscar LED periodicamente para indicar que está vivo
  if (millis() - ultimoPisca > 5000) {
    piscarLED(1, 50);
    ultimoPisca = millis();
  }

  delay(100); // Reduzido para 100ms para melhor responsividade
}