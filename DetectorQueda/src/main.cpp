#include <Wire.h>
#include "MPU6050_light.h"

// Pinos I2C
#define SDA_PIN 21
#define SCL_PIN 22
#define MPU_INT 5    // Pino de interrupção (opcional)

MPU6050 mpu(Wire);

// Variável para detectar quedas
volatile bool quedaDetectada = false;

void IRAM_ATTR handleFall() {
  quedaDetectada = true;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Inicializa I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  // Inicializa MPU6050
  byte status = mpu.begin();
  if (status == 0) {
    Serial.println("MPU6050 inicializado com sucesso!");
  } else {
    Serial.print("Erro ao inicializar MPU6050: ");
    Serial.println(status);
    while(1); // Trava se não conseguir inicializar
  }

  // Calibra o sensor (mantenha o MPU parado durante ~3 segundos)
  Serial.println("Calibrando... Mantenha o sensor parado!");
  mpu.calcOffsets();
  Serial.println("Calibração concluída!");

  // Configura interrupção (descomente se usar o pino INT)
  // pinMode(MPU_INT, INPUT);
  // attachInterrupt(digitalPinToInterrupt(MPU_INT), handleFall, RISING);
}

void loop() {
  mpu.update();

  // Verifica se houve interrupção
  if (quedaDetectada) {
    Serial.println("⚠️ ALERTA: Movimento brusco detectado!");
    quedaDetectada = false;
  }

  // Calcula magnitude da aceleração total
  float accMag = sqrt(mpu.getAccX() * mpu.getAccX() +
                      mpu.getAccY() * mpu.getAccY() +
                      mpu.getAccZ() * mpu.getAccZ());

  // Exibe dados
  Serial.print("Aceleração total: ");
  Serial.print(accMag);
  Serial.print(" g | X: ");
  Serial.print(mpu.getAccX());
  Serial.print(" | Y: ");
  Serial.print(mpu.getAccY());
  Serial.print(" | Z: ");
  Serial.println(mpu.getAccZ());

  // Detecção de queda por software (sem usar interrupção de hardware)
  if (accMag < 0.5 || accMag > 2.0) {
    Serial.println("⚠️ Possível queda detectada! (aceleração anormal)");
  }

  delay(500);
}