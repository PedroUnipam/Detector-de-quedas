-- Banco de Dados Atualizado - Sistema Detector de Quedas

CREATE DATABASE IF NOT EXISTS `sistema_detector_quedas`
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sistema_detector_quedas`;

-- Tabela UF (Estados)
CREATE TABLE `uf` (
  `id_estado` BIGINT NOT NULL AUTO_INCREMENT,
  `sigla` VARCHAR(2) NOT NULL,
  `descricao` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `uk_sigla` (`sigla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Endereço
CREATE TABLE `endereco` (
  `id_endereco` INT NOT NULL AUTO_INCREMENT,
  `cep` VARCHAR(9) NOT NULL,
  `logradouro` VARCHAR(255) NOT NULL,
  `numero` VARCHAR(10) NOT NULL,
  `bairro` VARCHAR(100) NOT NULL,
  `cidade` VARCHAR(100) NOT NULL,
  `complemento` VARCHAR(100) DEFAULT NULL,
  `id_estado` BIGINT NOT NULL,
  PRIMARY KEY (`id_endereco`),
  KEY `fk_endereco_uf` (`id_estado`),
  CONSTRAINT `fk_endereco_uf` FOREIGN KEY (`id_estado`) REFERENCES `uf` (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Pessoa (base para usuários e cuidadores)
CREATE TABLE `pessoa` (
  `id_pessoa` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(200) NOT NULL,
  `cpf` VARCHAR(14) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `telefone` VARCHAR(20) DEFAULT NULL,
  `senha_hash` VARCHAR(255) NOT NULL,
  `data_cadastro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acesso` DATETIME DEFAULT NULL,
  `status_ativo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_pessoa`),
  UNIQUE KEY `uk_cpf` (`cpf`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Usuário (idosos/monitorados)
CREATE TABLE `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `id_pessoa` INT NOT NULL,
  `id_endereco` INT NOT NULL,
  `data_nascimento` DATE DEFAULT NULL,
  `consentimento_lgpd` TINYINT(1) NOT NULL DEFAULT 0,
  `foto_perfil` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uk_pessoa` (`id_pessoa`),
  KEY `fk_usuario_endereco` (`id_endereco`),
  CONSTRAINT `fk_usuario_pessoa` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_endereco` FOREIGN KEY (`id_endereco`) REFERENCES `endereco` (`id_endereco`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Tipo Cuidador
CREATE TABLE `tipocuidador` (
  `id_tipocuidador` SMALLINT NOT NULL AUTO_INCREMENT,
  `descricao` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_tipocuidador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Cuidador
CREATE TABLE `cuidador` (
  `id_cuidador` INT NOT NULL AUTO_INCREMENT,
  `id_pessoa` INT NOT NULL,
  `id_tipocuidador` SMALLINT NOT NULL,
  PRIMARY KEY (`id_cuidador`),
  UNIQUE KEY `uk_pessoa` (`id_pessoa`),
  KEY `fk_cuidador_tipo` (`id_tipocuidador`),
  CONSTRAINT `fk_cuidador_pessoa` FOREIGN KEY (`id_pessoa`) REFERENCES `pessoa` (`id_pessoa`) ON DELETE CASCADE,
  CONSTRAINT `fk_cuidador_tipo` FOREIGN KEY (`id_tipocuidador`) REFERENCES `tipocuidador` (`id_tipocuidador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Relacionamento Usuário-Cuidador
CREATE TABLE `usuario_cuidador` (
  `id_vinculo` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_cuidador` INT NOT NULL,
  `data_vinculo` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_vinculo`),
  UNIQUE KEY `uk_usuario_cuidador` (`id_usuario`, `id_cuidador`),
  KEY `fk_vinculo_cuidador` (`id_cuidador`),
  CONSTRAINT `fk_vinculo_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `fk_vinculo_cuidador` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Dispositivo
CREATE TABLE `dispositivo` (
  `id_dispositivo` INT NOT NULL AUTO_INCREMENT,
  `fk_dispositivo_usuario` INT NOT NULL,
  `numero_serie` VARCHAR(100) NOT NULL,
  `data_vinculacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_sincronismo` DATETIME DEFAULT NULL,
  `nivel_bateria` INT DEFAULT 100,
  `status_conectividade` VARCHAR(50) NOT NULL DEFAULT 'desconectado',
  `tipo_conexao` ENUM('bluetooth', 'wifi') DEFAULT 'bluetooth',
  PRIMARY KEY (`id_dispositivo`),
  UNIQUE KEY `uk_numero_serie` (`numero_serie`),
  KEY `fk_dispositivo_usuario` (`fk_dispositivo_usuario`),
  CONSTRAINT `fk_dispositivo_usuario` FOREIGN KEY (`fk_dispositivo_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Queda
CREATE TABLE `queda` (
  `id_queda` INT NOT NULL AUTO_INCREMENT,
  `fk_queda_dispositivo` INT NOT NULL,
  `data_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `intensidade` DECIMAL(5,2) DEFAULT NULL,
  `confirmada` TINYINT(1) NOT NULL DEFAULT 0,
  `cancelada_manualmente` TINYINT(1) NOT NULL DEFAULT 0,
  `tempo_resposta` INT DEFAULT NULL COMMENT 'Tempo em segundos',
  `localizacao` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_queda`),
  KEY `fk_queda_dispositivo` (`fk_queda_dispositivo`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_queda_dispositivo` FOREIGN KEY (`fk_queda_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Notificação
CREATE TABLE `notificacao` (
  `id_notificacao` INT NOT NULL AUTO_INCREMENT,
  `fk_notificacao_queda` INT NOT NULL,
  `tipo_notificacao` VARCHAR(50) NOT NULL,
  `data_hora_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status_entrega` VARCHAR(50) NOT NULL DEFAULT 'pendente',
  `mensagem` VARCHAR(1000) DEFAULT NULL,
  PRIMARY KEY (`id_notificacao`),
  KEY `fk_notificacao_queda` (`fk_notificacao_queda`),
  CONSTRAINT `fk_notificacao_queda` FOREIGN KEY (`fk_notificacao_queda`) REFERENCES `queda` (`id_queda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Cuidador Notificação
CREATE TABLE `cuidadornotificacao` (
  `id_cuidadornotificacao` INT NOT NULL AUTO_INCREMENT,
  `id_cuidador` INT NOT NULL,
  `id_notificacao` INT NOT NULL,
  `data_leitura` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_cuidadornotificacao`),
  KEY `fk_cuidnot_cuidador` (`id_cuidador`),
  KEY `fk_cuidnot_notificacao` (`id_notificacao`),
  CONSTRAINT `fk_cuidnot_cuidador` FOREIGN KEY (`id_cuidador`) REFERENCES `cuidador` (`id_cuidador`) ON DELETE CASCADE,
  CONSTRAINT `fk_cuidnot_notificacao` FOREIGN KEY (`id_notificacao`) REFERENCES `notificacao` (`id_notificacao`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Evento Sistema
CREATE TABLE `evento_sistema` (
  `id_evento` INT NOT NULL AUTO_INCREMENT,
  `fk_evento_dispositivo` INT NOT NULL,
  `tipo_evento` VARCHAR(100) NOT NULL,
  `data_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descricao` VARCHAR(1000) DEFAULT NULL,
  `nivel_bateria` INT DEFAULT NULL,
  `status_conectividade` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `fk_evento_dispositivo` (`fk_evento_dispositivo`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_evento_dispositivo` FOREIGN KEY (`fk_evento_dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela Log de Acesso
CREATE TABLE `log_acesso` (
  `id_log` INT NOT NULL AUTO_INCREMENT,
  `fk_log_usuario` INT NOT NULL,
  `data_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acao_realizada` VARCHAR(255) NOT NULL,
  `ip_acesso` VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `fk_log_usuario` (`fk_log_usuario`),
  KEY `idx_data_hora` (`data_hora`),
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`fk_log_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir dados iniciais
INSERT INTO `tipocuidador` VALUES
(1,'Familiar'),
(2,'Enfermeiro'),
(3,'Cuidador Profissional'),
(4,'Médico'),
(5,'Fisioterapeuta');

INSERT INTO `uf` VALUES
(1,'AC','Acre'),
(2,'AL','Alagoas'),
(3,'AP','Amapá'),
(4,'AM','Amazonas'),
(5,'BA','Bahia'),
(6,'CE','Ceará'),
(7,'DF','Distrito Federal'),
(8,'ES','Espírito Santo'),
(9,'GO','Goiás'),
(10,'MA','Maranhão'),
(11,'MT','Mato Grosso'),
(12,'MS','Mato Grosso do Sul'),
(13,'MG','Minas Gerais'),
(14,'PA','Pará'),
(15,'PB','Paraíba'),
(16,'PR','Paraná'),
(17,'PE','Pernambuco'),
(18,'PI','Piauí'),
(19,'RJ','Rio de Janeiro'),
(20,'RN','Rio Grande do Norte'),
(21,'RS','Rio Grande do Sul'),
(22,'RO','Rondônia'),
(23,'RR','Roraima'),
(24,'SC','Santa Catarina'),
(25,'SP','São Paulo'),
(26,'SE','Sergipe'),
(27,'TO','Tocantins');