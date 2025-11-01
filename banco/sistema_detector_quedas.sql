CREATE DATABASE  IF NOT EXISTS `sistema_detector_quedas` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_detector_quedas`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: sistema_detector_quedas
-- ------------------------------------------------------
-- Server version	8.0.42

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
  KEY `tipocuidador_cuidador_fk` (`id_tipocuidador`),
  KEY `pessoa_cuidador_fk` (`id_pessoa`),
  CONSTRAINT `pessoa_cuidador_fk` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`),
  CONSTRAINT `tipocuidador_cuidador_fk` FOREIGN KEY (`id_tipocuidador`) REFERENCES `tipocuidador` (`id_tipocuidador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  PRIMARY KEY (`id_cuidadornotificacao`),
  KEY `cuidador_cuidadornotificacao_fk` (`id_cuidador`),
  KEY `notificacao_cuidadornotificacao_fk` (`id_notificacao`),
  CONSTRAINT `cuidador_cuidadornotificacao_fk` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`),
  CONSTRAINT `notificacao_cuidadornotificacao_fk` FOREIGN KEY (`id_notificacao`) REFERENCES `notificacao` (`id_notificacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  `data_vinculacao` datetime NOT NULL,
  `ultimo_sincronismo` datetime DEFAULT NULL,
  `nivel_bateria` int DEFAULT NULL,
  `status_conectividade` varchar(50) NOT NULL,
  PRIMARY KEY (`id_dispositivo`),
  KEY `usuario_dispositivo_fk` (`fk_dispositivo_usuario`),
  CONSTRAINT `usuario_dispositivo_fk` FOREIGN KEY (`fk_dispositivo_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  `Cidade` varchar(100) NOT NULL,
  `complemento` varchar(100) NOT NULL,
  `id_estado` bigint NOT NULL,
  PRIMARY KEY (`id_endereco`),
  KEY `uf_endereco_fk` (`id_estado`),
  CONSTRAINT `uf_endereco_fk` FOREIGN KEY (`id_estado`) REFERENCES `uf` (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `endereco`
--

LOCK TABLES `endereco` WRITE;
/*!40000 ALTER TABLE `endereco` DISABLE KEYS */;
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
  `tipo_evento` varchar(100) NOT NULL,
  `data_hora` datetime NOT NULL,
  `descricao` varchar(1000) DEFAULT NULL,
  `nivel_bateria` int DEFAULT NULL,
  `status_conectividade` varchar(50) NOT NULL,
  `fk_evento_dispositivo` int NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `dispositivo_evento_sistema_fk` (`fk_evento_dispositivo`),
  CONSTRAINT `dispositivo_evento_sistema_fk` FOREIGN KEY (`fk_evento_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  `data_hora` datetime NOT NULL,
  `acao_realizada` varchar(255) NOT NULL,
  `ip_acesso` varchar(45) DEFAULT NULL,
  `fk_log_usuario` int NOT NULL,
  PRIMARY KEY (`id_log`),
  KEY `usuario_log_acesso_fk` (`fk_log_usuario`),
  CONSTRAINT `usuario_log_acesso_fk` FOREIGN KEY (`fk_log_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  `tipo_notificacao` varchar(50) NOT NULL,
  `data_hora_envio` datetime NOT NULL,
  `status_entrega` varchar(50) NOT NULL,
  `mensagem` varchar(1000) DEFAULT NULL,
  `fk_notificacao_queda` int NOT NULL,
  PRIMARY KEY (`id_notificacao`),
  KEY `queda_notificacao_fk` (`fk_notificacao_queda`),
  CONSTRAINT `queda_notificacao_fk` FOREIGN KEY (`fk_notificacao_queda`) REFERENCES `queda` (`id_queda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
  `cpf` varchar(14) NOT NULL,
  `email` varchar(200) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_cadastro` datetime NOT NULL,
  `status_ativo` tinyint(1) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `nome` varchar(200) NOT NULL,
  `ultimo_acesso` datetime NOT NULL,
  PRIMARY KEY (`id_pessoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pessoa`
--

LOCK TABLES `pessoa` WRITE;
/*!40000 ALTER TABLE `pessoa` DISABLE KEYS */;
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
  `data_hora` datetime NOT NULL,
  `intensidade` decimal(5,2) DEFAULT NULL,
  `confirmada` tinyint(1) NOT NULL,
  `cancelada_manualmente` tinyint(1) NOT NULL,
  `tempo_resposta` int DEFAULT NULL,
  `fk_queda_dispositivo` int NOT NULL,
  PRIMARY KEY (`id_queda`),
  KEY `dispositivo_queda_fk` (`fk_queda_dispositivo`),
  CONSTRAINT `dispositivo_queda_fk` FOREIGN KEY (`fk_queda_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
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
  `descricao` varchar(100) NOT NULL,
  PRIMARY KEY (`id_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uf`
--

LOCK TABLES `uf` WRITE;
/*!40000 ALTER TABLE `uf` DISABLE KEYS */;
INSERT INTO `uf` VALUES (1,'Acre'),(2,'Alagoas'),(3,'Amapá'),(4,'Amazonas'),(5,'Bahia'),(6,'Ceará'),(7,'Distrito Federal'),(8,'Espírito Santo'),(9,'Goiás'),(10,'Maranhão'),(11,'Mato Grosso'),(12,'Mato Grosso do Sul'),(13,'Minas Gerais'),(14,'Pará'),(15,'Paraíba'),(16,'Paraná'),(17,'Pernambuco'),(18,'Piauí'),(19,'Rio de Janeiro'),(20,'Rio Grande do Norte'),(21,'Rio Grande do Sul'),(22,'Rondônia'),(23,'Roraima'),(24,'Santa Catarina'),(25,'São Paulo'),(26,'Sergipe'),(27,'Tocantins');
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
  `data_nascimento` date DEFAULT NULL,
  `endereco` varchar(1000) DEFAULT NULL,
  `consentimento_lgpd` tinyint(1) NOT NULL,
  `id_pessoa` int NOT NULL,
  `id_endereco` int NOT NULL,
  PRIMARY KEY (`id_usuario`),
  KEY `endereco_usuario_fk` (`id_endereco`),
  KEY `pessoa_usuario_fk` (`id_pessoa`),
  CONSTRAINT `endereco_usuario_fk` FOREIGN KEY (`id_endereco`) REFERENCES `endereco` (`id_endereco`),
  CONSTRAINT `pessoa_usuario_fk` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
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
  PRIMARY KEY (`id_vinculo`),
  KEY `cuidador_usuario_cuidador_fk` (`id_cuidador`),
  KEY `usuario_usuario_cuidador_fk` (`id_usuario`),
  CONSTRAINT `cuidador_usuario_cuidador_fk` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`),
  CONSTRAINT `usuario_usuario_cuidador_fk` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
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

-- Dump completed on 2025-11-01 11:35:58
