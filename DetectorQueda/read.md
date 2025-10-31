# Instruções de Conexão e Teste: ESP32 + MPU6050

Este guia ensina passo a passo como conectar o **ESP32** e o **MPU6050** em uma protoboard, configurar a porta no VS Code com PlatformIO e testar a detecção de queda via Serial/Bluetooth.

---

## 1. Configuração do projeto no VS Code

1. **Adicionar biblioteca MPU6050_light**:  
   - PlatformIO Home → Libraries → Busque `MPU6050_light` → Install no projeto existente.

2. **Configure a porta correta do ESP32**:  
   - Conecte o ESP32 ao PC  ú
   - No VS Code → PlatformIO → Devices → veja qual COM o ESP32 está usando  
   - No `platformio.ini`, se quiser, adicione:
     ```
     upload_port = COM3  ; ajuste conforme seu PC
     monitor_port = COM3
     monitor_speed = 115200
     ```

3. **Abra o arquivo `src/main.cpp`** e cole o código de teste abaixo.

4. **Compile e envie o código**:  
   - PlatformIO → Build  
   - PlatformIO → Upload  
   - Abra o Monitor Serial para ver a saída.

---

## 2. Conexões do MPU6050

| Pino MPU6050 | Conecta no ESP32 / protoboard | Observações |
|--------------|-------------------------------|------------|
| VCC          | Barra vermelha → 3.3 V        | Alimentação |
| GND          | Barra azul → GND              | Alimentação |
| SDA          | Pino digital livre D21        | I2C |
| SCL          | Pino digital livre D22        | I2C |
| AD0          | Barra azul → GND              | Define endereço I2C 0x68 |
| INT          | Pino digital livre D5 (opcional) | Usar para interrupção |

> Use jumpers curtos (<10 cm) para melhor estabilidade I2C.  
> Sempre desligue o ESP32 da energia antes de conectar jumpers.

---

## 3. Código de teste

```cpp
#include <Wire.h>
#include "MPU6050_light.h"
#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

#define SDA_PIN 21
#define SCL_PIN 22
#define FALL_THRESHOLD 2.0  // limite para detectar queda

MPU6050 mpu(Wire);

void setup() {
  Serial.begin(115200);
  SerialBT.begin("ESP32_FallSensor");
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);

  byte status = mpu.begin();
  if (status == 0) {
    Serial.println("MPU6050 inicializado com sucesso!");
    SerialBT.println("MPU6050 inicializado com sucesso!");
  } else {
    Serial.print("Erro ao inicializar MPU6050: ");
    Serial.println(status);
    SerialBT.println("Erro ao inicializar MPU6050!");
  }

  mpu.calcOffsets(); // calibração inicial
}

void loop() {
  mpu.update();

  float accMag = sqrt(
    mpu.getAccX()*mpu.getAccX() +
    mpu.getAccY()*mpu.getAccY() +
    mpu.getAccZ()*mpu.getAccZ()
  );

  Serial.print("Aceleração: ");
  Serial.println(accMag);
  SerialBT.print("Aceleração: ");
  SerialBT.println(accMag);

  if (accMag < FALL_THRESHOLD) {
    handleFall();
  }

  delay(200);
}

void handleFall() {
  Serial.println("ALERTA: Queda detectada!");
  SerialBT.println("ALERTA: Queda detectada!");
}

