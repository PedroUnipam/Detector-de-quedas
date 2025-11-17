-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: sistema_detector_quedas
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cuidador`
--

DROP TABLE IF EXISTS `cuidador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuidador` (
  `id_cuidador` int NOT NULL AUTO_INCREMENT,
  `id_pessoa` int NOT NULL,
  `id_tipocuidador` smallint NOT NULL,
  PRIMARY KEY (`id_cuidador`),
  UNIQUE KEY `uk_pessoa` (`id_pessoa`),
  KEY `fk_cuidador_tipo` (`id_tipocuidador`),
  CONSTRAINT `fk_cuidador_pessoa` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`) ON DELETE CASCADE,
  CONSTRAINT `fk_cuidador_tipo` FOREIGN KEY (`id_tipocuidador`) REFERENCES `tipocuidador` (`id_tipocuidador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuidador`
--

LOCK TABLES `cuidador` WRITE;
/*!40000 ALTER TABLE `cuidador` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuidador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuidadornotificacao`
--

DROP TABLE IF EXISTS `cuidadornotificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuidadornotificacao` (
  `id_cuidadornotificacao` int NOT NULL AUTO_INCREMENT,
  `id_cuidador` int NOT NULL,
  `id_notificacao` int NOT NULL,
  `data_leitura` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cuidadornotificacao`),
  KEY `fk_cuidnot_cuidador` (`id_cuidador`),
  KEY `fk_cuidnot_notificacao` (`id_notificacao`),
  CONSTRAINT `fk_cuidnot_cuidador` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`) ON DELETE CASCADE,
  CONSTRAINT `fk_cuidnot_notificacao` FOREIGN KEY (`id_notificacao`) REFERENCES `notificacao` (`id_notificacao`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuidadornotificacao`
--

LOCK TABLES `cuidadornotificacao` WRITE;
/*!40000 ALTER TABLE `cuidadornotificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuidadornotificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositivo`
--

DROP TABLE IF EXISTS `dispositivo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivo` (
  `id_dispositivo` int NOT NULL AUTO_INCREMENT,
  `fk_dispositivo_usuario` int NOT NULL,
  `numero_serie` varchar(100) NOT NULL,
  `data_vinculacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_sincronismo` datetime DEFAULT NULL,
  `nivel_bateria` int DEFAULT '100',
  `status_conectividade` varchar(50) NOT NULL DEFAULT 'desconectado',
  `tipo_conexao` enum('bluetooth','wifi') DEFAULT 'bluetooth',
  `config` json DEFAULT NULL,
  PRIMARY KEY (`id_dispositivo`),
  UNIQUE KEY `uk_numero_serie` (`numero_serie`),
  KEY `fk_dispositivo_usuario` (`fk_dispositivo_usuario`),
  KEY `idx_tipo_conexao` (`tipo_conexao`),
  CONSTRAINT `fk_dispositivo_usuario` FOREIGN KEY (`fk_dispositivo_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositivo`
--

LOCK TABLES `dispositivo` WRITE;
/*!40000 ALTER TABLE `dispositivo` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispositivo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `endereco`
--

DROP TABLE IF EXISTS `endereco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `endereco` (
  `id_endereco` int NOT NULL AUTO_INCREMENT,
  `cep` varchar(9) NOT NULL,
  `logradouro` varchar(255) NOT NULL,
  `numero` varchar(10) NOT NULL,
  `bairro` varchar(100) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `id_estado` bigint NOT NULL,
  PRIMARY KEY (`id_endereco`),
  KEY `fk_endereco_uf` (`id_estado`),
  CONSTRAINT `fk_endereco_uf` FOREIGN KEY (`id_estado`) REFERENCES `uf` (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `endereco`
--

LOCK TABLES `endereco` WRITE;
/*!40000 ALTER TABLE `endereco` DISABLE KEYS */;
INSERT INTO `endereco` VALUES (1,'00000-000','Não informado','S/N','Não informado','Não informado',NULL,1);
/*!40000 ALTER TABLE `endereco` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento_sistema`
--

DROP TABLE IF EXISTS `evento_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_sistema` (
  `id_evento` int NOT NULL AUTO_INCREMENT,
  `fk_evento_dispositivo` int NOT NULL,
  `tipo_evento` varchar(100) NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descricao` varchar(1000) DEFAULT NULL,
  `nivel_bateria` int DEFAULT NULL,
  `status_conectividade` varchar(50) NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `fk_evento_dispositivo` (`fk_evento_dispositivo`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_evento_dispositivo` FOREIGN KEY (`fk_evento_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_sistema`
--

LOCK TABLES `evento_sistema` WRITE;
/*!40000 ALTER TABLE `evento_sistema` DISABLE KEYS */;
/*!40000 ALTER TABLE `evento_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_acesso`
--

DROP TABLE IF EXISTS `log_acesso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_acesso` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `fk_log_usuario` int NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acao_realizada` varchar(255) NOT NULL,
  `ip_acesso` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `fk_log_usuario` (`fk_log_usuario`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`fk_log_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_acesso`
--

LOCK TABLES `log_acesso` WRITE;
/*!40000 ALTER TABLE `log_acesso` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_acesso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao`
--

DROP TABLE IF EXISTS `notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacao` (
  `id_notificacao` int NOT NULL AUTO_INCREMENT,
  `fk_notificacao_queda` int NOT NULL,
  `tipo_notificacao` varchar(50) NOT NULL,
  `data_hora_envio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status_entrega` varchar(50) NOT NULL DEFAULT 'pendente',
  `mensagem` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id_notificacao`),
  KEY `fk_notificacao_queda` (`fk_notificacao_queda`),
  CONSTRAINT `fk_notificacao_queda` FOREIGN KEY (`fk_notificacao_queda`) REFERENCES `queda` (`id_queda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao`
--

LOCK TABLES `notificacao` WRITE;
/*!40000 ALTER TABLE `notificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pessoa`
--

DROP TABLE IF EXISTS `pessoa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pessoa` (
  `id_pessoa` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `email` varchar(200) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `data_cadastro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acesso` datetime DEFAULT NULL,
  `status_ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_pessoa`),
  UNIQUE KEY `uk_cpf` (`cpf`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pessoa`
--

LOCK TABLES `pessoa` WRITE;
/*!40000 ALTER TABLE `pessoa` DISABLE KEYS */;
INSERT INTO `pessoa` VALUES (1,'lucas','16356764578','lucas@gmail.com','3497288709','$2a$10$HBYy6TDYhpYqiuL5kvi3PulSGoZPW6nI265U8B.kh0YLgfLx9amAK','2025-11-13 13:19:14','2025-11-13 13:25:04',1);
/*!40000 ALTER TABLE `pessoa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queda`
--

DROP TABLE IF EXISTS `queda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queda` (
  `id_queda` int NOT NULL AUTO_INCREMENT,
  `fk_queda_dispositivo` int NOT NULL,
  `data_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `intensidade` decimal(5,2) DEFAULT NULL,
  `confirmada` tinyint(1) NOT NULL DEFAULT '0',
  `cancelada_manualmente` tinyint(1) NOT NULL DEFAULT '0',
  `tempo_resposta` int DEFAULT NULL COMMENT 'Tempo em segundos',
  `localizacao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_queda`),
  KEY `fk_queda_dispositivo` (`fk_queda_dispositivo`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_queda_dispositivo` FOREIGN KEY (`fk_queda_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queda`
--

LOCK TABLES `queda` WRITE;
/*!40000 ALTER TABLE `queda` DISABLE KEYS */;
/*!40000 ALTER TABLE `queda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipocuidador`
--

DROP TABLE IF EXISTS `tipocuidador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipocuidador` (
  `id_tipocuidador` smallint NOT NULL AUTO_INCREMENT,
  `descricao` varchar(100) NOT NULL,
  PRIMARY KEY (`id_tipocuidador`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipocuidador`
--

LOCK TABLES `tipocuidador` WRITE;
/*!40000 ALTER TABLE `tipocuidador` DISABLE KEYS */;
INSERT INTO `tipocuidador` VALUES (1,'Familiar'),(2,'Enfermeiro'),(3,'Cuidador Profissional'),(4,'Médico'),(5,'Fisioterapeuta');
/*!40000 ALTER TABLE `tipocuidador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uf`
--

DROP TABLE IF EXISTS `uf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uf` (
  `id_estado` bigint NOT NULL AUTO_INCREMENT,
  `sigla` varchar(2) NOT NULL,
  `descricao` varchar(100) NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `uk_sigla` (`sigla`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uf`
--

LOCK TABLES `uf` WRITE;
/*!40000 ALTER TABLE `uf` DISABLE KEYS */;
INSERT INTO `uf` VALUES (1,'AC','Acre'),(2,'AL','Alagoas'),(3,'AP','Amapá'),(4,'AM','Amazonas'),(5,'BA','Bahia'),(6,'CE','Ceará'),(7,'DF','Distrito Federal'),(8,'ES','Espírito Santo'),(9,'GO','Goiás'),(10,'MA','Maranhão'),(11,'MT','Mato Grosso'),(12,'MS','Mato Grosso do Sul'),(13,'MG','Minas Gerais'),(14,'PA','Pará'),(15,'PB','Paraíba'),(16,'PR','Paraná'),(17,'PE','Pernambuco'),(18,'PI','Piauí'),(19,'RJ','Rio de Janeiro'),(20,'RN','Rio Grande do Norte'),(21,'RS','Rio Grande do Sul'),(22,'RO','Rondônia'),(23,'RR','Roraima'),(24,'SC','Santa Catarina'),(25,'SP','São Paulo'),(26,'SE','Sergipe'),(27,'TO','Tocantins');
/*!40000 ALTER TABLE `uf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_pessoa` int NOT NULL,
  `id_endereco` int NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `consentimento_lgpd` tinyint(1) NOT NULL DEFAULT '0',
  `foto_perfil` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_pessoa` (`id_pessoa`),
  KEY `fk_usuario_endereco` (`id_endereco`),
  CONSTRAINT `fk_usuario_endereco` FOREIGN KEY (`id_endereco`) REFERENCES `endereco` (`id_endereco`),
  CONSTRAINT `fk_usuario_pessoa` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,1,1,NULL,1,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_cuidador`
--

DROP TABLE IF EXISTS `usuario_cuidador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_cuidador` (
  `id_vinculo` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_cuidador` int NOT NULL,
  `data_vinculo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_vinculo`),
  UNIQUE KEY `uk_usuario_cuidador` (`id_usuario`,`id_cuidador`),
  KEY `fk_vinculo_cuidador` (`id_cuidador`),
  CONSTRAINT `fk_vinculo_cuidador` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`) ON DELETE CASCADE,
  CONSTRAINT `fk_vinculo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_cuidador`
--

LOCK TABLES `usuario_cuidador` WRITE;
/*!40000 ALTER TABLE `usuario_cuidador` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_cuidador` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-16 17:46:03
