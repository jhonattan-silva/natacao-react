-- MySQL Workbench Forward Engineering

-- Forçar codificação na conexão
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_general_ci';
SET time_zone = 'America/Sao_Paulo';  -- Configurar fuso horário para São Paulo

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema liga_natacao
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `liga_natacao` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `liga_natacao` ;

-- -----------------------------------------------------
-- Table `liga_natacao`.`usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cpf` VARCHAR(11) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `celular` VARCHAR(20) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`equipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`equipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `cidade` VARCHAR(255),
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`categorias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  `idade_min` INT NOT NULL,
  `idade_max` INT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`nadadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`nadadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(120) NOT NULL,
  `cpf` VARCHAR(11) NOT NULL,
  `data_nasc` DATE NOT NULL,
  `celular` VARCHAR(20) NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  `equipes_id` INT NULL,
  `categorias_id` INT NULL,
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `fk_Nadadores_Equipes1_idx` (`equipes_id` ASC) VISIBLE,
  INDEX `fk_Nadadores_Categorias1_idx` (`categorias_id` ASC) VISIBLE,
  CONSTRAINT `fk_Nadadores_Equipes1`
    FOREIGN KEY (`equipes_id`)
    REFERENCES `liga_natacao`.`equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Nadadores_Categorias1`
    FOREIGN KEY (`categorias_id`)
    REFERENCES `liga_natacao`.`categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`rankingNadadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`rankingNadadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pontos` INT NULL,
  `temporada` YEAR NULL,
  `nadadores_id` INT NOT NULL,
  `categorias_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_RankingNadadores_Nadadores1_idx` (`nadadores_id` ASC) VISIBLE,
  INDEX `fk_RankingNadadores_Categorias1_idx` (`categorias_id` ASC) VISIBLE,
  CONSTRAINT `fk_RankingNadadores_Nadadores1`
    FOREIGN KEY (`nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_RankingNadadores_Categorias1`
    FOREIGN KEY (`categorias_id`)
    REFERENCES `liga_natacao`.`categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`torneios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`torneios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `data_inicio` DATE NOT NULL,
  `data_fim` DATE NOT NULL,
  `aberto` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`eventos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`eventos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `data` DATETIME NOT NULL,
  `cidade` VARCHAR(45) NOT NULL,
  `sede` VARCHAR(45) NULL,
  `endereco` VARCHAR(255) NULL,
  `torneios_id` INT NOT NULL,
  `inscricao_aberta` TINYINT NOT NULL DEFAULT 0,
  `observacoes` VARCHAR(150) NULL,
  `quantidade_raias` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Eventos_Torneios1_idx` (`torneios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Eventos_Torneios1`
    FOREIGN KEY (`torneios_id`)
    REFERENCES `liga_natacao`.`torneios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`noticias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`noticias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `texto` TEXT NOT NULL,
  `titulo` VARCHAR(45) NOT NULL,
  `data` DATE NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Noticias_Usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Noticias_Usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `liga_natacao`.`usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`provas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`provas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estilo` VARCHAR(45) NOT NULL,
  `distancia` INT NOT NULL,
  `tipo` ENUM('individual', 'revezamento') NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`resultados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`resultados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tempo` TIME NULL,
  `pontos` INT NULL,
  `nadadores_id` INT NOT NULL,
  `provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Resultados_Nadadores1_idx` (`nadadores_id` ASC) VISIBLE,
  INDEX `fk_Resultados_Provas1_idx` (`provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Resultados_Nadadores1`
    FOREIGN KEY (`nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Resultados_Provas1`
    FOREIGN KEY (`provas_id`)
    REFERENCES `liga_natacao`.`provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`rankingEquipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`rankingEquipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pontos` INT NULL,
  `temporada` YEAR NULL,
  `equipes_id` INT NOT NULL,
  `Categorias_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_RankingEquipes_Equipes1_idx` (`equipes_id` ASC) VISIBLE,
  INDEX `fk_RankingEquipes_Categorias1_idx` (`Categorias_id` ASC) VISIBLE,
  CONSTRAINT `fk_RankingEquipes_Equipes1`
    FOREIGN KEY (`equipes_id`)
    REFERENCES `liga_natacao`.`equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_RankingEquipes_Categorias1`
    FOREIGN KEY (`Categorias_id`)
    REFERENCES `liga_natacao`.`categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`records`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tempo` TIME NULL,
  `Nadadores_id` INT NOT NULL,
  `provas_id` INT NOT NULL,
  `torneios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Records_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_Records_Provas1_idx` (`provas_id` ASC) VISIBLE,
  INDEX `fk_Records_Torneios1_idx` (`torneios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Records_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Records_Provas1`
    FOREIGN KEY (`provas_id`)
    REFERENCES `liga_natacao`.`provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Records_Torneios1`
    FOREIGN KEY (`torneios_id`)
    REFERENCES `liga_natacao`.`torneios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`eventos_resultados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`eventos_resultados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `posicao` INT NULL,
  `pontos` INT NULL,
  `nadadores_id` INT NOT NULL,
  `provas_id` INT NOT NULL,
  `eventos_id` INT NOT NULL,
  PRIMARY KEY (`id`, `eventos_id`),
  INDEX `fk_EventosResultados_Nadadores1_idx` (`nadadores_id` ASC) VISIBLE,
  INDEX `fk_EventosResultados_Provas1_idx` (`provas_id` ASC) VISIBLE,
  INDEX `fk_EventosResultados_Eventos1_idx` (`eventos_id` ASC) VISIBLE,
  CONSTRAINT `fk_EventosResultados_Nadadores1`
    FOREIGN KEY (`nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_EventosResultados_Provas1`
    FOREIGN KEY (`provas_id`)
    REFERENCES `liga_natacao`.`provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_EventosResultados_Eventos1`
    FOREIGN KEY (`eventos_id`)
    REFERENCES `liga_natacao`.`eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`perfis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`perfis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `descricao` VARCHAR(150) NOT NULL,
  `data_criacao` TIMESTAMP NULL,
  `data_atualizacao` TIMESTAMP NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`usuarios_perfis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`usuarios_perfis` (
  `perfis_id` INT NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`perfis_id`, `usuarios_id`),
  INDEX `fk_Perfis_has_Usuarios_Usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  INDEX `fk_Perfis_has_Usuarios_Perfis1_idx` (`perfis_id` ASC) VISIBLE,
  CONSTRAINT `fk_Perfis_has_Usuarios_Perfis1`
    FOREIGN KEY (`perfis_id`)
    REFERENCES `liga_natacao`.`perfis` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Perfis_has_Usuarios_Usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `liga_natacao`.`usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`usuarios_equipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`usuarios_equipes` (
  `usuarios_id` INT NOT NULL,
  `equipes_id` INT NOT NULL,
  PRIMARY KEY (`usuarios_id`, `equipes_id`),
  INDEX `fk_Usuarios_has_Equipes_Equipes1_idx` (`equipes_id` ASC) VISIBLE,
  INDEX `fk_Usuarios_has_Equipes_Usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Usuarios_has_Equipes_Usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `liga_natacao`.`usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Usuarios_has_Equipes_Equipes1`
    FOREIGN KEY (`equipes_id`)
    REFERENCES `liga_natacao`.`equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`permissoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`permissoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `descricao` TEXT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`perfis_permissoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`perfis_permissoes` (
  `perfis_id` INT NOT NULL,
  `permissoes_id` INT NOT NULL,
  PRIMARY KEY (`perfis_id`, `permissoes_id`),
  INDEX `fk_Perfis_has_Permissoes_Permissoes1_idx` (`permissoes_id` ASC) VISIBLE,
  INDEX `fk_Perfis_has_Permissoes_Perfis1_idx` (`perfis_id` ASC) VISIBLE,
  CONSTRAINT `fk_Perfis_has_Permissoes_Perfis1`
    FOREIGN KEY (`perfis_id`)
    REFERENCES `liga_natacao`.`perfis` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Perfis_has_Permissoes_Permissoes1`
    FOREIGN KEY (`permissoes_id`)
    REFERENCES `liga_natacao`.`permissoes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`baterias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`baterias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descricao` VARCHAR(45) NULL,
  `eventos_id` INT NOT NULL,
  `nadadores_id` INT NOT NULL,
  `provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Baterias_Eventos1_idx` (`eventos_id` ASC) VISIBLE,
  INDEX `fk_Baterias_Nadadores1_idx` (`nadadores_id` ASC) VISIBLE,
  INDEX `fk_Baterias_Provas1_idx` (`provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Baterias_Eventos1`
    FOREIGN KEY (`eventos_id`)
    REFERENCES `liga_natacao`.`eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_Nadadores1`
    FOREIGN KEY (`nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_Provas1`
    FOREIGN KEY (`provas_id`)
    REFERENCES `liga_natacao`.`provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`eventos_provas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`eventos_provas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventos_id` INT NOT NULL,
  `provas_id` INT NOT NULL,
  INDEX `fk_Eventos_has_Provas_Provas1_idx` (`provas_id` ASC) VISIBLE,
  INDEX `fk_Eventos_has_Provas_Eventos1_idx` (`eventos_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Eventos_has_Provas_Eventos1`
    FOREIGN KEY (`eventos_id`)
    REFERENCES `liga_natacao`.`eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Eventos_has_Provas_Provas1`
    FOREIGN KEY (`provas_id`)
    REFERENCES `liga_natacao`.`provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`inscricoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`inscricoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nadadores_id` INT NOT NULL,
  `eventos_id` INT NOT NULL,
  `eventos_provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Inscricoes_Nadadores1_idx` (`nadadores_id` ASC) VISIBLE,
  INDEX `fk_Inscricoes_Eventos1_idx` (`eventos_id` ASC) VISIBLE,
  INDEX `fk_Inscricoes_Eventos_Provas1_idx` (`eventos_provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Inscricoes_Nadadores1`
    FOREIGN KEY (`nadadores_id`)
    REFERENCES `liga_natacao`.`nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Inscricoes_Eventos1`
    FOREIGN KEY (`eventos_id`)
    REFERENCES `liga_natacao`.`eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Inscricoes_Eventos_Provas1`
    FOREIGN KEY (`eventos_provas_id`)
    REFERENCES `liga_natacao`.`eventos_provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`baterias_inscricoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`baterias_inscricoes` (
  `baterias_id` INT NOT NULL,
  `inscricoes_id` INT NOT NULL,
  `piscina` VARCHAR(45) NOT NULL,
  `raia` INT NOT NULL,
  PRIMARY KEY (`baterias_id`, `inscricoes_id`),
  INDEX `fk_Baterias_has_Inscricoes_Inscricoes1_idx` (`inscricoes_id` ASC) VISIBLE,
  INDEX `fk_Baterias_has_Inscricoes_Baterias1_idx` (`baterias_id` ASC) VISIBLE,
  CONSTRAINT `fk_Baterias_has_Inscricoes_Baterias1`
    FOREIGN KEY (`baterias_id`)
    REFERENCES `liga_natacao`.`baterias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_has_Inscricoes_Inscricoes1`
    FOREIGN KEY (`inscricoes_id`)
    REFERENCES `liga_natacao`.`inscricoes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



-- Inserir torneios
INSERT INTO torneios (nome, data_inicio, data_fim, aberto) VALUES
('2023', '2023-01-01', '2023-12-31', 0),
('2024', '2024-01-01', '2024-12-31', 0),
('2025', '2025-01-01', '2025-12-31', 1);

-- Inserir eventos 2023
INSERT INTO eventos (nome, data, cidade, endereco, torneios_id, inscricao_aberta, quantidade_raias) VALUES
('Etapa Marília', '2023-02-25 08:00:00', 'Marília', 'Avenida Brig. Eduardo Gomes, 1000', 1, 0, 0),
('Etapa Lins', '2023-03-18 07:30:00', 'Lins', 'Rod. Marechal Rondon, km444', 1, 0, 0),
('Etapa Guaiçara', '2023-04-15 07:30:00', 'Guaiçara', 'R: Dr. Arnaldo de Andrade', 1, 0, 0),
('Etapa Lençois Paulista', '2023-05-13 07:30:00', 'Lençóis Paulista', 'Avenida Brasil, 1039', 1, 0, 0),
('Etapa Assis', '2023-06-17 07:30:00', 'Assis', 'Luis Carlos da Silveira, 10', 1, 0, 0),
('Etapa Marilia II', '2023-08-19 07:30:00', 'Marília', 'Avenida Brigadeiro Eduardo Gomes, 1000', 1, 0, 0),
('Etapa Penápolis', '2023-09-16 07:30:00', 'Penápolis', 'Avenida Luís Osório, 22', 1, 0, 0),
('Etapa Tupã', '2023-10-21 07:30:00', 'Tupã', 'Avenida dos Universitários, 145', 1, 0, 0),
('Etapa Lençóis Paulista', '2023-11-18 07:30:00', 'Lençóis Paulista', 'Avenida Brasil, 1039', 1, 0, 0),
('Etapa Jaú', '2023-12-16 07:30:00', 'Jaú', 'Alameda Dr José R. Carneiro Lyra, 60', 1, 0, 0);


-- Inserir eventos de 2024
INSERT INTO eventos (nome, data, cidade, endereco, torneios_id, inscricao_aberta, quantidade_raias) VALUES 
('Etapa Tupã', '2024-02-24 07:30:00', 'Tupã', 'Avenida dos Universitários, 145', 2, 0, 0), 
('Etapa Lins', '2024-03-16 07:30:00', 'Lins', 'Rod. Marechal Rondon, km444', 2, 0, 0), 
('Etapa Guaiçara', '2024-04-13 07:15:00', 'Guaiçara', 'Rua: Dr. Arnaldo de Andrade, 150', 2, 0, 0), 
('Etapa Lençóis Paulista', '2024-05-11 07:30:00', 'Lençóis Paulista', 'Avenida Brasil, 1039', 2, 0, 0), 
('Etapa Assis', '2024-06-22 07:15:00', 'Assis', 'Rua: Luis Carlos da Silveira, 10', 2, 0, 0), 
('Etapa Assis', '2024-08-17 07:15:00', 'Assis', 'Luis Carlos da Silveira, 10', 2, 0, 0), 
('Etapa Lins', '2024-09-21 07:15:00', 'Lins', 'Rua: Dr. Aureliano R. de Andrade, 51', 2, 0, 0), 
('Etapa Lençóis Paulista', '2024-10-19 07:15:00', 'Lençóis Paulista', 'Avenida Brasil, 1039', 2, 0, 0), 
('Etapa Penápolis', '2024-11-09 07:15:00', 'Penápolis', 'Avenida Luis Osório, 22', 2, 0, 0), 
('Etapa Tupã', '2024-12-07 07:15:00', 'Tupã', 'Avenida dos Universitários, 145', 2, 0, 0);

-- Inserir eventos 2025
INSERT INTO eventos (nome, data, cidade, endereco, torneios_id, inscricao_aberta, quantidade_raias) VALUES 
('ETAPA I - TUPÃ', '2025-02-22 07:30:00', 'TUPÃ', 'Avenida dos Universitários, 145', 3, 0, 6),
('ETAPA II - LINS', '2025-03-15 07:30:00', 'LINS', 'Rod. Marechal Rondon, km444', 3, 0, 6),
('ETAPA III- ASSIS', '2025-04-12 07:30:00', 'ASSIS', 'Rua: Luis Carlos da Silveira, 10', 3, 0, 6),
('ETAPA IV - LENÇÓIS PAULISTA', '2025-05-17 07:30:00', 'LENÇÓIS PAULISTA', 'Avenida Brasil, 1039', 3, 0, 6),
('ETAPA V - PARAGUAÇU PAULISTA', '2025-06-14 07:30:00', 'PARAGUAÇU PAULISTA', 'ENDEREÇO A DEFINIR', 3, 0, 6),
('ETAPA VI - MARILIA', '2025-08-23 07:30:00', 'MARÍLIA', 'Avenida Brigadeiro Eduardo Gomes, 1000', 3, 0, 6),
('ETAPA VII - LINS II', '2025-09-20 07:30:00', 'LINS', 'Rod. Marechal Rondon, km444', 3, 0, 6),
('ETAPA VIII - JAÚ', '2025-10-18 07:30:00', 'JAÚ', 'Alameda Dr José R. Carneiro Lyra, 60', 3, 0, 6),
('ETAPA IX - DUARTINA', '2025-11-08 07:30:00', 'DUARTINA', 'ENDEREÇO A DEFINIR', 3, 0, 6),
('CAMPEONATO PAULISTA LPN', '2025-12-13 07:30:00', 'PENÁPOLIS', 'Avenida Luis Osório, 22', 3, 0, 6);

-- Inserir perfis com suas respectivas permissões
INSERT INTO perfis (nome, descricao, data_criacao, data_atualizacao)
VALUES 
  ('admin', 'Perfil administrativo', NOW(), NOW()),
  ('treinador', 'Perfil de treinador', NOW(), NOW()),
  ('noticias', 'Perfil para gestão de notícias', NOW(), NOW()),
  ('gestor', 'Perfil de gestão geral', NOW(), NOW());
  
-- Inserir Categorias dos nadadores  
  INSERT INTO categorias (nome, sexo, idade_min, idade_max) VALUES 
('Pré-Mirim', 'M', 0, 8),
('Mirim I', 'M', 9, 9),
('Mirim II', 'M', 10, 10),
('Petiz I', 'M', 11, 11),
('Petiz II', 'M', 12, 12),
('Infantil I', 'M', 13, 13),
('Infantil II', 'M', 14, 14),
('Juvenil I', 'M', 15, 15),
('Juvenil II', 'M', 16, 16),
('Junior I', 'M', 17, 17),
('Junior II', 'M', 18, 19),
('Sênior', 'M', 20, 130),
('Iniciantes', 'M', 300, 300),
('Pré-Mirim', 'F', 0, 8),
('Mirim I', 'F', 9, 9),
('Mirim II', 'F', 10, 10),
('Petiz I', 'F', 11, 11),
('Petiz II', 'F', 12, 12),
('Infantil I', 'F', 13, 13),
('Infantil II', 'F', 14, 14),
('Juvenil I', 'F', 15, 15),
('Juvenil II', 'F', 16, 16),
('Junior I', 'F', 17, 17),
('Junior II', 'F', 18, 19),
('Sênior', 'F', 20, 130),
('Iniciantes', 'F', 300, 300);

-- Inserir Provas
INSERT INTO provas (distancia, estilo, tipo, sexo) VALUES
(25, 'LIVRE', 'INDIVIDUAL', 'M'),
(25, 'COSTAS', 'INDIVIDUAL', 'M'),
(25, 'PEITO', 'INDIVIDUAL', 'M'),
(25, 'BORBOLETA', 'INDIVIDUAL', 'M'),
(50, 'LIVRE', 'INDIVIDUAL', 'M'),
(50, 'COSTAS', 'INDIVIDUAL', 'M'),
(50, 'PEITO', 'INDIVIDUAL', 'M'),
(50, 'BORBOLETA', 'INDIVIDUAL', 'M'),
(100, 'MEDLEY', 'INDIVIDUAL', 'M'),
(100, 'LIVRE', 'INDIVIDUAL', 'M'),
(100, 'COSTAS', 'INDIVIDUAL', 'M'),
(100, 'PEITO', 'INDIVIDUAL', 'M'),
(100, 'BORBOLETA', 'INDIVIDUAL', 'M'),
(200, 'LIVRE', 'INDIVIDUAL', 'M'),
(200, 'COSTAS', 'INDIVIDUAL', 'M'),
(200, 'PEITO', 'INDIVIDUAL', 'M'),
(200, 'BORBOLETA', 'INDIVIDUAL', 'M'),
(200, 'MEDLEY', 'INDIVIDUAL', 'M'),
(400, 'LIVRE', 'INDIVIDUAL', 'M'),
(400, 'MEDLEY', 'INDIVIDUAL', 'M'),
(800, 'LIVRE', 'INDIVIDUAL', 'M'),
(1.500, 'LIVRE', 'INDIVIDUAL', 'M'),
(100, 'LIVRE', 'REVEZAMENTO', 'M'),
(100, 'MEDLEY', 'REVEZAMENTO', 'M'),
(200, 'LIVRE', 'REVEZAMENTO', 'M'),
(25, 'LIVRE', 'INDIVIDUAL', 'F'),
(25, 'COSTAS', 'INDIVIDUAL', 'F'),
(25, 'PEITO', 'INDIVIDUAL', 'F'),
(25, 'BORBOLETA', 'INDIVIDUAL', 'F'),
(50, 'LIVRE', 'INDIVIDUAL', 'F'),
(50, 'COSTAS', 'INDIVIDUAL', 'F'),
(50, 'PEITO', 'INDIVIDUAL', 'F'),
(50, 'BORBOLETA', 'INDIVIDUAL', 'F'),
(100, 'MEDLEY', 'INDIVIDUAL', 'F'),
(100, 'LIVRE', 'INDIVIDUAL', 'F'),
(100, 'COSTAS', 'INDIVIDUAL', 'F'),
(100, 'PEITO', 'INDIVIDUAL', 'F'),
(100, 'BORBOLETA', 'INDIVIDUAL', 'F'),
(200, 'LIVRE', 'INDIVIDUAL', 'F'),
(200, 'COSTAS', 'INDIVIDUAL', 'F'),
(200, 'PEITO', 'INDIVIDUAL', 'F'),
(200, 'BORBOLETA', 'INDIVIDUAL', 'F'),
(200, 'MEDLEY', 'INDIVIDUAL', 'F'),
(400, 'LIVRE', 'INDIVIDUAL', 'F'),
(400, 'MEDLEY', 'INDIVIDUAL', 'F'),
(800, 'LIVRE', 'INDIVIDUAL', 'F'),
(1.500, 'LIVRE', 'INDIVIDUAL', 'F'),
(100, 'LIVRE', 'REVEZAMENTO', 'F'),
(100, 'MEDLEY', 'REVEZAMENTO', 'F'),
(200, 'LIVRE', 'REVEZAMENTO', 'F');

-- Lista inicial de equipes
INSERT INTO equipes (nome, cidade, ativo) VALUES
('AAEEVA NATAÇÃO', 'BOTUCATU', 1),
('AITEC SANDALUS/NATAÇÃO TUPÃ', 'TUPÃ', 1),
('ASSIS NATAÇÃO ATC/SEMEA', 'ASSIS', 1),
('ASSOCIAÇÃO ATLÉTICA FERROVIÁRIA DE BOTUCATU', 'BOTUCATU', 1),
('CLUBE ESPORTIVO MARIMBONDO', 'LENÇOIS PAULISTA', 1),
('CLUBE PENAPOLENSE/SME PENAPOLIS','PENAPOLIS', 1),
('DUDU ACQUA CENTER', 'MARÍLIA', 1),
('FITBEM', 'PRESIDENTE PRUDENTE', 1),
('KINESIS IACANGA', 'IACANGA', 1),
('LAGO AZUL PENAPOLIS', 'PENAPOLIS', 1),
('LINS COUNTRY CLUB', 'LINS', 1),
('NATAÇÃO BIRIGUI', 'BIRIGUI', 1),
('NATAÇÃO DUARTINA', 'DUARTINA', 1),
('NATAÇÃO OURINHOS', 'OURINHOS', 1),
('NATAÇÃO UNESP BOTUCATU', 'BOTUCATU', 1),
('PREFEITURA DE GUAIÇARA - TRIUNFO/TRANSBRASILIANA', 'GUAIÇARA', 1),
('SAÚDE E MOVIMENTO', 'AGUDOS', 1),
('SECRETARIA DE ESPORTES E LAZER DE LINS', 'LINS', 1),
('SECRETARIA DE ESPORTES JAÚ', 'JAU', 1),
('SMEL CATANDUVA', 'CATANDUVA', 1),
('STUDIO MOTA', 'PARAGUAÇU PAULISTA', 1),
('TARUMÃ NATAÇÃO - PROJETO RAIA 4', 'TARUMÃ', 1),
('IGARAÇU DO TIETÊ', 'IGARAÇU DO TIETÊ', 0),
('2SHARKS', 'CAFELÂNDIA', 0),
('ACADEMIA ÁGUA VIVA', 'DOIS CORREGOS', 0),
('ACADEMIA ENFORMA', 'PRESIDENTE PRUDENTE', 0),
('APRENDENDO A NADAR', 'LINS', 0),
('BECARA SWIN TEAM', 'BAURU', 0),
('LFC NATAÇÃO', 'BASTOS', 0),
('NADBEM', 'OURINHOS', 0),
('NATAÇÃO PARAGUAÇU', 'PARAGUAÇU PAULISTA', 0);

-- INSERIR USUARIOS
INSERT INTO usuarios (nome, cpf, celular, email, senha, ativo) VALUES
('Ana Maria Didoni', '11111111111', '14997490079', 'luhaquatica@outlook.com', '123', 1),
('Ana Lúcia Castilho', '11111111111', '14998783551', 'mateusandresouzasilva8@gmai.com', '123', 1),
('Ueriton Peres', '11111111111', '14997163278', 'aaeeva.botucatu@gmail.com', '123', 1),
('Aline Vassoler', '11111111111', '14996160141', 'line_daia@hotmail.com', '123', 1),
('SEM TECNICO', '11111111111', '11111111111', 'email@enforma.com', '123', 1),
('Marcelo Mazaro', '11111111111', '11111111111', 'email@tupa.com', '123', 1),
('Igor Gustavo Ramos da Silva', '11111111111', '14996778534', 'igorgustavonatacao@gmail.com', '123', 1),
('SEM TECNICO', '11111111111', '11111111111', 'email@assis.com', '123', 1),
('Renata Spadotto', '11111111111', '14981066936', 'renataspadotto@gmail.com', '123', 1),
('Rafael Lima', '11111111111', '14997331030', 'rafael_limamartins@hotmail.com', '123', 1),
('Andre Barbosa Velosa', '11111111111', '14997754467', 'abvelosa46@gmail.com', '123', 1),
('tencnico', '11111111111', '11111111111', 'email@penapolis.com', '123', 1),
('Eduardo Sumida', '11111111111', '11111111111', 'email@dudu.com', '123', 1),
('Kauan Andrade Francisco de Faria', '11111111111', '18996319025', 'hauan.andrade.faria@hotmail.com', '123', 1),
('Liliane Lira', '11111111111', '14991164449', 'clinicakinesis@hotmail.com', '123', 1),
('SEM TECNICO', '11111111111', '11111111111', 'email@lagoazul.com', '123', 1),
('Luiz Fernando Ribeiro Cardozo da Silva', '11111111111', '14991668973', 'luizfernando_edfisico@outlook.com', '123', 1),
('Juninho', '11111111111', '14997736370', 'juninhosemel@gmail.com', '123', 1),
('Vinícius Carpejani', '11111111111', '14998546789', 'carpejani07@gmail.com', '123', 1),
('Jorge Antônio Barros de Melo', '11111111111', '18988101096', 'jorgebarrossssse@gmail.com', '123', 1),
('SEM TECNICO', '11111111111', '11111111111', 'email@duartina.com', '123', 1),
('Renato Silvestre', '11111111111', '14991286075', 'renatobatatanat@hotmail.com', '123', 1),
('Weltton Guerin', '11111111111', '18997333452', 'welttonguerin@gmail.com', '123', 1),
('Miguel Antunes', '11111111111', '11989068282', 'natacao@aaachsa.com.br', '123', 1),
('SEM TECNICO', '11111111111', '11111111111', 'email@guaicara.com', '123', 1),
('Lucas Eduardo Cardoso', '11111111111', '14988044834', 'academia.saudeemovimento@hotmail.com', '123', 1),
('Francisco Gomes', '11111111111', '14997192747', 'fgchico@gmail.com', '123', 1),
('Rinaldo Bill Luchesi', '11111111111', '14997764467', 'cocabill@hotmail.com', '123', 1),
('Andréa Malfará', '11111111111', '17996049833', 'andreamalfara@gmail.com', '123', 1),
('Jeziel Mendes dos Santos', '11111111111', '18988256410', 'studio2899@hotmail.com', '123', 1),
('Marcos Eugênio Alves', '11111111111', '18997590768', 'fiico.esportes@taruma.sp.gov.br', '123', 1);

-- INSERIR PERFIS DOS USUARIOS
INSERT INTO usuarios_perfis (usuarios_id, perfis_id)
SELECT id, 2
FROM usuarios;

-- INSERIR EQUIPES NOS USUÁRIOS
INSERT INTO usuarios_equipes (usuarios_id, equipes_id) VALUES
(1, 23),
(2, 24),
(3, 1),
(4, 25),
(6, 2),
(7, 27),
(9, 4),
(10, 28),
(11, 5),
(12, 6),
(13, 7),
(14, 8),
(15, 9),
(17, 29),
(18, 11),
(19, 30),
(20, 12),
(22, 14),
(23, 31),
(24, 15),
(26, 17),
(27, 18),
(28, 19),
(29, 20),
(30, 21),
(31, 22);

-- Adiciona Nadadores
INSERT INTO records (nome, cpf, cidade, sexo, equipes_id, data_nasc) VALUES
('HELOISA DA SILVA PELEGRINELI', '57014058851', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('LAURA CECILIA DE ASSIS VITALINO', '54907855869', 'MARÍLIA', 'F', 7, '2009-01-02'),
('MATEUS SANTOS PERES', '44051675831', 'MARÍLIA', 'M', 7, '1999-01-02'),
('JULIANA RIBEIRO NEVES DE VASCONCELLOS', '43122123843', 'MARÍLIA', 'F', 7, '1997-01-02'),
('ANDRÉ GARCIA PEREIRA', '39491630857', 'MARÍLIA', 'M', 7, '1996-01-02'),
('ANA LUIZA GOMES SGARBI', '22849093882', 'MARÍLIA', 'F', 7, '1999-01-02'),
('ANTONELA VITÓRIA FLOR RAMOS', '52806256801', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('GIOVANNA AMARAL ALVES', '13801128695', 'MARÍLIA', 'F', 7, '2000-01-02'),
('TÁBATA MARINA NÓBREGA DE FREITAS', '11111111111', 'MARÍLIA', 'F', 7, '1996-01-02'),
('JÚLIA ESTECA DA SILVA', '50923931850', 'MARÍLIA', 'F', 7, '2000-01-02'),
('GUILHERME GIGLIO MULLER', '46310512803', 'MARÍLIA', 'M', 7, '2002-01-02'),
('FELIPE ALVES DA SILVA', '47236626856', 'MARÍLIA', 'M', 7, '2000-01-02'),
('LUCAS GABRIEL ZOCOLER KAWAKAMI', '12089000996', 'MARÍLIA', 'M', 7, '2000-01-02'),
('BIANCA FRIGO PIRES', '43954985829', 'MARÍLIA', 'F', 7, '2001-01-02'),
('LUANA DEMETRIO RAIA FERRANTI', '45180344816', 'MARÍLIA', 'F', 7, '1999-01-02'),
('FELIPE DE SOUZA PADILHA ', '45343252826', 'PRESIDENTE PRUDENTE', 'M', 8, '2008-02-10'),
('SOFIA RODRIGUES G DE LIMA', '23967496848', 'TUPÃ', 'F', 2, '2006-01-02'),
('HIGOR MALUTA', '41710730811', 'PRESIDENTE PRUDENTE', 'M', 26, '1993-01-02'),
('CLEINER REAME NETTO', '43965419889', 'PRESIDENTE PRUDENTE', 'M', 26, '2000-01-02'),
('JOSÉ EDUARDO LEITE DE LORENZO', '32537984889', 'PRESIDENTE PRUDENTE', 'M', 26, '2000-01-02'),
('EDUARDO PIZZO D’AVILA', '70254872107', 'PRESIDENTE PRUDENTE', 'M', 26, '2001-01-02'),
('BRUNA CAROLINE LEMOS ROCHA', '40232420807', 'PRESIDENTE PRUDENTE', 'F', 26, '1993-01-02'),
('DANIELA TSUNO', '32246039843', 'PRESIDENTE PRUDENTE', 'F', 26, '1997-01-02'),
('BEATRIZ CARDOSO GASPAROTTO', '11111111111', 'PRESIDENTE PRUDENTE', 'F', 26, '2002-01-02'),
('REGIANE COISSI SANCHES', '38419502804', 'PRESIDENTE PRUDENTE', 'F', 26, '1992-01-02'),
('LUCAS EDUARDO CARDOSO', '45476291881', 'AGUDOS', 'M', 17, '1995-01-02'),
('GIOVANA IRIKURA CARDOSO', '41050616820', 'MARÍLIA', 'F', 7, '2001-01-02'),
('PEDRO HENRIQUE SALES GONÇALVES', '48437320879', 'BOTUCATU', 'M', 4, '2008-01-02'),
('KAUÃ HENRIQUE DA SILVA ANDRADE', '49375932850', 'TUPÃ', 'M', 2, '2006-01-02'),
('VINICIUS CARPEJANI', '22022501829', 'OURINHOS', 'M', 30, '1981-01-02'),
('SAMAY VITORIA SERRANO CAMPAGNOLLO', '45710721808', 'PENAPOLIS', 'F', 10, '2009-01-02'),
('LAURA GIAXA MEDEIROS', '50051838842', 'MARÍLIA', 'F', 7, '2011-01-02'),
('PIETRA FANTINATTI', '52026686866', 'ASSIS', 'F', 3, '2016-01-02'),
('ADRIANO VIEIRA MARTELLI', '43444100841', 'MARÍLIA', 'M', 7, '1998-01-02'),
('JULIA DE SOUZA SUSSAI', '47289274822', 'PENAPOLIS', 'F', 10, '2009-01-02'),
('LUIZ FERNANDO ARANTES PERES', '49899016810', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('AUGUSTO CESAR OLIVEIRA ZARATIN', '44936084808', 'LENÇÓIS PAULISTA', 'M', 5, '1994-01-02'),
('RAFAEL COLUCCI MONTORO', '11111111111', 'MARÍLIA', 'M', 7, '2011-01-02'),
('BERNARDO VOLPE VARGAS', '48280300856', 'PENÁPOLIS', 'M', 6, '2014-01-02'),
('HIRAN ANDREOTI SALOMÃO LIBONE', '39924798899', 'PRESIDENTE PRUDENTE', 'M', 26, '2000-01-02'),
('LUÍS FELIPE TAVARES FERREIRA', '70919111483', 'RECIFE - PE', 'M', 15, '2004-01-02'),
('VITORIA SILVA GABIA', '39956154814', 'MARÍLIA', 'F', 7, '1999-01-02'),
('TIAGO MONTANHA BASSO', '47367427806', 'MARILIA', 'M', 7, '2003-01-02'),
('ARTHUR MARTINS', '43327833877', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('LUCAS ALVES FERLIN', '53976300802', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('FERNANDA PARRA SANTOS SILVA', '53196876802', 'IACANGA', 'F', 9, '2017-01-02'),
('JOÃO PEDRO MIESSA WON ANCKEN', '55390740840', 'CATANDUVA', 'M', 20, '2012-01-02'),
('RAFAELA SUMIDA', '45310952861', 'MARÍLIA', 'F', 7, '2006-01-02'),
('VIVIANE APARECIDA LIRA', '21654375802', 'IACANGA', 'F', 9, '1981-01-02'),
('DAVI FERRIZZI ROTTA', '56847324880', 'CATANDUVA', 'M', 20, '2014-01-02'),
('LORENA REDFERN QUAGLIATO VESSONI', '49753664877', 'OURINHOS', 'F', 14, '2015-01-02'),
('VINÍCIUS SAMPAIO COSTA', '46773465850', 'MARÍLIA', 'M', 7, '1999-01-02'),
('GUILHERME VALLADA KITAYAMA', '11111111111', 'MARÍLIA', 'M', 7, '2001-01-02'),
('ISABELLA DE LIMA MIRANDA', '49141006810', 'JAÚ', 'F', 19, '2014-01-02'),
('GUILHERME NASCIMENTO LIM', '46965372850', 'MARÍLIA', 'M', 7, '2001-01-02'),
('CAROLINE DONZELLI CANTAZINI', '50168003830', 'PENAPOLIS', 'F', 10, '2010-01-02'),
('LUCAS AGOSTINI', '32291643851', 'PENAPOLIS', 'M', 6, '1984-01-02'),
('MIGUEL CAVALCA', '43974862803', 'MARÍLIA', 'M', 7, '2011-01-02'),
('GABRIEL FANTINATTI', '52026758875', 'ASSIS', 'M', 3, '2011-01-02'),
('WESLEY PIANTE CHOTOLLI', '34323385897', 'PENAPOLIS', 'M', 6, '1987-01-02'),
('BRUNO MACHADO NOGUEIRA ', '52647217835', 'TUPÃ', 'M', 2, '2003-01-02'),
('HENRIQUE BRANDÃO DO AMARAL FANTIN', '57101359841', 'JAÚ', 'M', 19, '2013-01-02'),
('PEDRO HENRIQUE DE SOUZA GIFFU', '42495859801', 'JAU', 'M', 19, '2009-01-02'),
('MILENA FREITAS MARTINS', '43059312818', 'CATANDUVA', 'F', 20, '2003-01-02'),
('ANA LAURA MASSOLA LISBOA', '44384172877', 'CATANDUVA', 'F', 20, '2011-01-02'),
('ANA MARIA PIMENTEL DOS SANTOS', '50353924814', 'BOTUCATU', 'F', 1, '2014-01-02'),
('RICHERD TADASHI SANTOS KADAME', '46589055823', 'TUPÃ', 'M', 2, '2012-01-02'),
('MATHEUS HERNANDEZ TAVARES', '40484099809', 'JAÚ', 'M', 19, '2006-01-02'),
('LUIZA VASCONCELOS BARBOSA VIEIRA', '46560703860', 'ASSIS ', 'F', 3, '2011-01-02'),
('BARBARA FERNANDES DE OLIVEIRA', '44759173870', 'GUAIÇARA', 'F', 16, '2011-01-02'),
('PEDRO LUCAS DOS SANTOS', '44694044893', 'BOTUCATU', 'M', 1, '2011-01-02'),
('GEOVANNA CRISTINA ABRAHÃO', '48883675827', 'GUAIÇARA', 'F', 16, '2011-01-02'),
('ANA GABRIELA ALVES PEREIRA', '11111111111', 'MARÍLIA - SP', 'F', 15, '2004-01-02'),
('HELENA DORTE CAMPOS RAMPAZZO', '38779677878', 'PENÁPOLIS', 'F', 6, '2018-01-02'),
('PEDRO MARQUETTI MARQUES', '52383230855', 'GUAIÇARA', 'M', 16, '2014-01-02'),
('MAGDA FABIANA DE LIMA DA SILVA', '87312484215', 'DUARTINA', 'F', 13, '1980-01-02'),
('MATHEUS CORTEZ ADOLFO', '57321553841', 'PENÁPOLIS', 'M', 6, '2007-01-02'),
('OLIVIA RAPUSSI MENDES ', '52562487826', 'TUPÃ', 'F', 2, '2014-01-02'),
('GUILHERME CARDOSO SILVA', '45677488836', 'ASSIS', 'M', 3, '1997-01-02'),
('LARA DE OLIVEIRA TOLEDO', '47417580874', 'GUAIÇARA', 'F', 16, '2011-01-02'),
('KAUAN HENRIQUE ANDRADE MATHIAS ', '23934477844', 'TUPÃ', 'M', 2, '2006-01-02'),
('DANIEL MARTINS DE OLIVEIRA', '48159951841', 'ASSIS', 'M', 3, '2005-01-02'),
('LIVIA DEZENISKI OKUIAMA', '56106883882', 'PENÁPOLIS', 'F', 6, '2010-01-02'),
('BEATRIZ SOARES CAMPANARI', '45536606875', 'DUARTINA', 'F', 13, '2010-01-02'),
('RAFAEL RODRIGUES MAGALHÃES', '44956154822', 'ASSIS', 'M', 3, '2014-01-02'),
('MIRELLA CELESTINO MAGALHÃES', '52886228842', 'PENAPOLIS', 'F', 10, '2004-01-02'),
('EDUARDO ABRANTES DO NASCIMENTO', '48437368804', 'BOTUCATU', 'M', 4, '2011-01-02'),
('LILIANE APARECIDA LIRA', '44429579830', 'IACANGA', 'F', 9, '1994-01-02'),
('GABRIEL FACTORE BAZANA', '53639329899', 'CATANDUVA', 'M', 20, '2017-01-02'),
('LÍVIA PELICIA DE SOUZA', '58512539836', 'PENAPOLIS', 'F', 10, '2020-01-02'),
('REBECCA SILVA DINIZ', '52742860894', 'ASSIS', 'F', 3, '2005-01-02'),
('RAFAEL WALDEMARIN DIAS FERREIRA', '28530989821', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('MARTINA REDFEM QUAGLIATO VESSONI', '51228346860', 'OURINHOS', 'F', 14, '2016-01-02'),
('SOFIA VON BORSTEL CASTILHO', '46261154899', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('YASMIM MARTINS BERNARDES', '53228188809', 'TUPÃ', 'F', 2, '2008-01-02'),
('JOÃO GABRIEL PAVANELLO', '54332119835', 'LENÇOIS PAULISTA', 'M', 5, '2010-01-02'),
('ISADORA JOAQUIM PETRUCCI', '47728503847', 'ASSIS', 'F', 3, '2013-01-02'),
('DAVI ROCHA DE ARRUDA', '47374589883', 'GUAIÇARA', 'M', 16, '2011-01-02'),
('ARTHUR FELIPE TOBIAS', '50913869805', 'BOTUCATU', 'M', 1, '2016-01-02'),
('LAURO PEROLIZ BORGO PERRI', '52985184860', 'JAÚ', 'M', 19, '2017-01-02'),
('AMANDA SANTANA LIMA', '49908741888', 'BOTUCATU', 'F', 1, '2014-01-02'),
('LUCAS MONTEIRO DOS SANTOS', '48809229860', 'JAÚ', 'M', 19, '2001-01-02'),
('JOÃO MARCELO ALVES CELESTINO', '53535344840', 'TUPÃ', 'M', 2, '2008-01-02'),
('GUILHERME CASTRO GUZZO', '48791918847', 'CATANDUVA', 'M', 20, '2003-01-02'),
('LARISSA DE PAULA', '59400693800', 'JAU', 'F', 19, '2010-01-02'),
('JOÃO FELYPE PEREIRA MARTINS', '46729039825', 'ASSIS', 'M', 3, '2008-01-02'),
('DANIEL COSTA SANTOS', '35102819852', 'PENAPOLIS', 'M', 6, '1999-01-02'),
('LUANA BATISTA DAMACENO', '45926295823', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('MARIA LUIZA ALMEIDA HENRIQUES DA SILVA', '50202390896', 'PENAPOLIS', 'F', 6, '2008-01-02'),
('IAN COLIN TADDEI RAMOS', '42299717889', 'ASSIS', 'M', 3, '2006-01-02'),
('CAIO LIMA DE OLIVEIRA', '55601100861', 'ASSIS', 'M', 3, '2015-01-02'),
('ARTHUR GARCIA DE FREITAS', '47435697885', 'LINS', 'M', 11, '2013-01-02'),
('JOÃO PEDRO CRACO LORENTZ', '10815927967', 'CURITIBA - PR', 'M', 15, '2004-01-02'),
('REGIANE KUME', '32467835817', 'MARILIA', 'F', 7, '1986-01-02'),
('ARTHUR DIOGO MURO MESQUITA', '44700599863', 'CATANDUVA', 'M', 20, '2011-01-02'),
('LORENA RODRIGUES PEREIRA', '51260707890', 'CATANDUVA', 'F', 20, '2011-01-02'),
('JOÃO RENATO GRAMA MARTINS', '46814497840', 'PENAPOLIS', 'M', 10, '2013-01-02'),
('ALICE CHIARA', '50235959863', 'ASSIS', 'F', 3, '2015-01-02'),
('LORENA REDFERN QUAGLIATO VESSONI', '49753664877', 'LENÇOIS PAULISTA', 'F', 5, '2015-01-02'),
('LUCAS ANTONIO PASCHOIM', '49673043892', 'CATANDUVA', 'M', 20, '1999-01-02'),
('MARIA EDUARDA IZIDORO MATIAS', '47402649865', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('POLYANA GOMES RODRIGUES', '44107534871', 'PENÁPOLIS', 'F', 6, '2002-01-02'),
('LUIZ ANTONIO DE SOUZA GOMES', '52525115864', 'JAÚ', 'M', 19, '2012-01-02'),
('LORENA XAVIER RODRIGUES SCHIAVON', '49591236808', 'PENÁPOLIS', 'F', 10, '2015-01-02'),
('BEATRIZ AGUIAR ALVES LIMA', '47173119812', 'PENÁPOLIS', 'F', 10, '2007-01-02'),
('JOAO PEDRO GOMES PEREIRA', '43242532856', 'PENAPOLIS', 'M', 6, '2009-01-02'),
('RAUL ZANATTO FERNANDES', '35825613803', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('ALEXANDRE FIORELLI', '27597420838', 'LENÇÓIS PAULISTA', 'M', 5, '1975-01-02'),
('BENJAMIM ALEXANDRE PARREIRA', '50033098808', 'BIRIGUI', 'M', 12, '2015-01-02'),
('YASMIN COSTA GONÇALVES', '44868254898', 'PENAPOLIS', 'F', 10, '2009-01-02'),
('CAMILE FERREIRA MARTINS ', '50222437847', 'TUPÃ ', 'F', 2, '2015-01-02'),
('LAURA CARRILLO VOROS', '53727988827', 'LENÇÓIS PAULISTA', 'F', 5, '2008-01-02'),
('RAFAEL DE LIMA MARTINS', '29645734843', 'BAURU', 'M', 28, '1981-01-02'),
('ENZO MELLO PENTEADO', '44034392843', 'PENAPOLIS', 'M', 6, '2009-01-02'),
('CLAYTON OLIVER PONTES', '11111111111', 'LINS', 'M', 18, '2011-01-02'),
('MIGUEL DOS SANTOS CHIRNEV', '11111111111', 'MARÍLIA', 'M', 7, '2012-01-02'),
('LUCAS MARTELO SOARES SILVA', '54950483854', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('GUILHERME LEAL ANDRE', '50265779898', 'MARILIA', 'M', 7, '2003-01-02'),
('VICTORIA GREGO', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('DANIELA FIGUEREDO SILVEIRA', '48473327845', 'ASSIS', 'F', 3, '2009-01-02'),
('CAIO AHMED BARCA', '48411628876', 'LENÇÓIS PAULISTA', 'M', 5, '2006-01-02'),
('VINCENZO BALLONI COUTINHO', '54396594801', 'MARÍLIA', 'M', 7, '2011-01-02'),
('BERNARDO BOGO COSTA', '49774156803', 'PENAPOLIS', 'M', 6, '2015-01-02'),
('LUCAS RODRIGUES RIBEIRO', '56454009840', 'PENÁPOLIS', 'M', 6, '2019-01-02'),
('ISABELLY RAFAELA GOMES', '54713075850', 'PARAGUAÇU PAULISTA', 'F', 21, '2011-01-02'),
('MARIANA ANSELMO ROCHA', '46206047806', 'LINS', 'F', 11, '2012-01-02'),
('RODRIGO BRAGA DOS SANTOS', '56488677861', 'LINS', 'M', 11, '2011-01-02'),
('GABRIEL RODRIGUES SEBASTIÃO', '50567571874', 'CATANDUVA', 'M', 20, '2015-01-02'),
('RAFAEL DA CRUZ BASSETO', '44166191896', 'PENAPOLIS', 'M', 6, '2010-01-02'),
('LEANDRO PEREIRA AVEANEDA ', '52992038881', 'TUPÃ', 'M', 2, '2003-01-02'),
('RAFAEL OLIVEIRA MORALES', '50784011800', 'LENÇOIS PAULISTA', 'M', 5, '2011-01-02'),
('LUCCA BENETTI BERNARDI CORBUCCI', '47426046877', 'PENÁPOLIS', 'M', 6, '2013-01-02'),
('NATHALIA PINHEIRO', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('JOÃO GABRIEL BUENO ', '48373321888', 'DOIS CORREGOS ', 'M', 25, '2014-01-02'),
('MARTINA REDFERN QUAGLIATO VESSONI', '52128346860', 'LENÇOIS PAULISTA', 'F', 5, '2016-01-02'),
('BENEDITA MARIA DACARDOSO', '11062793870', 'LINS', 'F', 18, '1950-01-02'),
('HENRIQUE ANDRADE GALLI', '53095270879', 'IGARAÇU DO TIETÊ ', 'M', 23, '2015-01-02'),
('MANOEL GONÇALVES DE AGUIAR', '72256346820', 'DOIS CORREGOS ', 'M', 25, '1953-01-02'),
('THIAGO HENRIQUE VOLPINI', '29930755861', 'ASSIS ', 'M', 3, '1981-01-02'),
('PEDRO AUGUSTO ULHAO RUIZ', '50066317835', 'TUPÃ', 'M', 2, '2011-01-02'),
('AROLDO JUNIOR', '11111111111', 'MARILIA', 'M', 7, '1999-01-02'),
('FRANCIELLI ALICE NUNES COUTINHO', '49537002870', 'PENÁPOLIS', 'F', 6, '2001-01-02'),
('GABRILLY MACEDO NISTARDA VIANA', '46442060837', 'TUPÃ', 'F', 2, '2007-01-02'),
('GIULIA LOT COSCINA', '11111111111', 'MARILIA', 'F', 7, '2001-01-02'),
('KELL MAZZINI RIBEIRO DE CAMARGO', '40514917814', 'MARILIA', 'M', 7, '1992-01-02'),
('VICTOR TAMURA DOS SANTOS', '52877831833', 'MARILIA', 'M', 7, '2003-01-02'),
('DEBORA DE LUCIO HOSNI', '70496869905', 'MARILIA', 'F', 7, '2004-01-02'),
('LIVIA MARIA OLIVEIRA DOS SANTOS', '14214864662', 'MARILIA', 'F', 7, '2003-01-02'),
('JULIA NATALLI FREIRE', '14187691774', 'MARILIA', 'F', 7, '2001-01-02'),
('GEOVANA KAMILA SANTOS NASCIMENTO', '50727616811', 'IGARAÇU DO TIETÊ ', 'F', 23, '2011-01-02'),
('RONALDO VITAL DOS SANTOS', '57384546850', 'IGARAÇU DO TIETÊ ', 'M', 23, '2011-01-02'),
('ARTHUR DIAS MORAIS ', '43959343825', 'IGARAÇU DO TIETÊ ', 'M', 23, '2015-01-02'),
('RAUL MIABARA BAGIO', '33027410514', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('KAUAN ANDRADE FRANCISCO DE FARIA', '48399877859', 'PRESIDENTE PRUDENTE', 'M', 8, '2001-01-02'),
('MIGUEL RODRIGUES SOUSA', '54938041820', 'BOTUCATU', 'M', 1, '2014-01-02'),
('MANUELLA MELQUIADES ELSNER', '59381599820', 'ASSIS', 'F', 3, '2014-01-02'),
('REBECA CONTI DE LIMA MARTINS', '47966867897', 'BAURU', 'F', 28, '2013-01-02'),
('VICENTE BONI MINATEL ', '58469210866', 'DOIS CORREGOS ', 'M', 25, '2015-01-02'),
('LEONARDO VICENTE ANESIO ', '51274812860', 'DOIS CORREGOS ', 'M', 25, '2015-01-02'),
('MIKHAEL SIMPLICIO DOS SANTOS ', '53359773888', 'TUPÃ', 'M', 2, '2005-01-02'),
('MIRELA TANONE FUJII', '45180841879', 'PENÁPOLIS', 'F', 6, '2009-01-02'),
('ANNA ELISA FRANCO BARRACHI', '53157994840', 'LINS', 'F', 18, '2017-01-02'),
('JOÃO PEDRO MICHELON CAMARGO', '46728054847', 'TUPÃ', 'M', 2, '2008-01-02'),
('LEANDRO DE PAULA XAVIER', '31226993893', 'JAÚ', 'M', 19, '1982-01-02'),
('IAN GREGORIO GOBI', '52830418832', 'MARILIA', 'M', 7, '2003-01-02'),
('CATARINA ROCHA', '52025169833', 'BOTUCATU', 'F', 1, '2015-01-02'),
('EDUARDO VITAL DOS SANTOS', '57382963896', 'IGARAÇU DO TIETÊ ', 'M', 23, '2013-01-02'),
('ESTEVAM JOSÉ DA SILVA', '49926648819', 'JAÚ', 'M', 19, '2010-01-02'),
('RAFAEL MARTELO SOARES SILVA', '56806440886', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('ANA CLARA PEGO MANOEL', '43572299870', 'PENAPOLIS', 'F', 10, '2004-01-02'),
('PEDRO DE AVANCE MONTEIRO', '46412362835', 'TUPÃ', 'M', 2, '2005-01-02'),
('GEORGIA AMORIN VICENTIM', '56458474822', 'CATANDUVA', 'F', 20, '2015-01-02'),
('HENZO PEREIRA COSTA VALVERDE', '43328348875', 'TUPÃ', 'M', 2, '2009-01-02'),
('ALICE SASSI DOMINGUES', '52447574827', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('MILENE SLOMPO BELO', '30428593801', 'DUARTINA', 'F', 13, '1983-01-02'),
('VITOR VACCARI SCHIAVINATTI', '47237006843', 'CATANDUVA', 'M', 20, '2013-01-02'),
('VITOR CAPUA RODRIGUES SANCHES', '44803677808', 'PENÁPOLIS', 'M', 6, '2011-01-02'),
('ISADORA NAKAHODO', '58465116865', 'IGARAÇU DO TIETÊ ', 'F', 23, '2015-01-02'),
('THIAGO HENRIQUE PASCHOARELLI', '50016795830', 'IGARAÇU DO TIETÊ ', 'M', 23, '2005-01-02'),
('ALEXANDRE DE MORAIS PONCE LOPES', '44062495830', 'IGARAÇU DO TIETÊ ', 'M', 23, '2004-01-02'),
('MARIA EDUARDA DE OLIVEIRA', '30135867886', 'IGARAÇU DO TIETÊ ', 'F', 23, '2013-01-02'),
('LEONARDO HENRIQUE DOS SANTOS', '47409472855', 'IGARAÇU DO TIETÊ ', 'M', 23, '2012-01-02'),
('MARIANA RUSSI RUBIO', '57381789809', 'JAÚ', 'F', 19, '2007-01-02'),
('JOÃO GUILHERME GIANAZI CARVALHO', '50711551847', 'ASSIS', 'M', 3, '2016-01-02'),
('BETINA BOSOLI CAMARGO', '55992917829', 'LENÇOIS PAULISTA', 'F', 5, '2014-01-02'),
('ANDRÉ MURAD NAGAHAMA', '50817920803', 'SÃO PAULO - SP', 'M', 15, '2000-01-02'),
('DAVI BERTINOTTI DOS SANTOS', '94880537840', 'DUARTINA', 'M', 13, '2015-01-02'),
('GABRIEL LUAN DA SILVA NASCIMENTO', '44368449860', 'JAÚ', 'M', 19, '2002-01-02'),
('VINICIUS GABRIEL RODRIGUES', '42119410895', 'IGARAÇU DO TIETÊ ', 'M', 23, '2009-01-02'),
('ANA BEATRIZ LORENTI LUCHESI', '54954736803', 'JAÚ', 'F', 19, '2010-01-02'),
('SAMUEL RODRIGUES SOUSA', '54937969889', 'BOTUCATU', 'M', 1, '2013-01-02'),
('DIEGO BARIZÃO FILHO', '44973051802', 'ASSIS', 'M', 3, '2011-01-02'),
('ARTHUR MELLADO', '43570685845', 'JAÚ', 'M', 19, '2010-01-02'),
('ANDERSON MATHEUS DOS SANTOS NASCIMENTO', '45726484843', 'IGARAÇU DO TIETÊ ', 'M', 23, '2006-01-02'),
('GUSTAVO VERRUCK NAKAYA', '43946468802', 'PRESIDENTE PRUDENTE', 'M', 8, '2011-01-02'),
('MANUELA PIRES PAES', '43713379882', 'ASSIS', 'F', 3, '2011-01-02'),
('PEDRO AMORIM GASPARIN MENEGON', '42299725806', 'ASSIS', 'M', 3, '2008-01-02'),
('VITOR ORSELLI', '32078816884', 'JAÚ', 'M', 19, '1998-01-02'),
('OMAR SANFELICE DIAS', '11111111111', 'LENÇÓIS PAULISTA', 'M', 5, '1971-01-02'),
('DAVI OLIVEIRA BINATO RAMIRES', '55157489803', 'ASSIS', 'M', 3, '2014-01-02'),
('JOÃO RICARDO BINATO AIZZO', '48897562809', 'ASSIS', 'M', 3, '2014-01-02'),
('ISABELA FERAFIM ARGENTINO', '51574485890', 'LENÇÓIS PAULISTA', 'F', 5, '2015-01-02'),
('MARIANA FREITAS', '11111111111', 'MARILIA', 'F', 7, '2001-01-02'),
('MARIA JULIA BERTI CARNELOZZI', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('LUIZ GUILHERME LORENTI LUCHESI', '54954893810', 'JAÚ', 'M', 19, '2009-01-02'),
('ALEXANDRE CASTRO GUZZO', '59739659888', 'CATANDUVA', 'M', 20, '2012-01-02'),
('MARIA TERESA OLIVEIRA DA SILVA', '46510411830', 'PENAPOLIS', 'F', 10, '2012-01-02'),
('DANIEL NASCIMENTO CAMARGO', '51849594830', 'DUARTINA', 'M', 13, '2006-01-02'),
('GABRIEL ROBERTO ERENO', '51258738880', 'IGARAÇU DO TIETÊ ', 'M', 23, '2016-01-02'),
('ANA LAURA RODRIGUES', '49638294876', 'IGARAÇU DO TIETÊ ', 'F', 23, '2015-01-02'),
('BERNARDO TRONCO BRAMBILLA NERI', '46654885848', 'ASSIS', 'M', 3, '2013-01-02'),
('JONAS NANNI MENINO', '41278959858', 'BARRA BONITA - SP', 'M', 15, '2005-01-02'),
('DAVI FELIPPI DE OLIVEIRA', '51656835835', 'JAÚ', 'M', 19, '2013-01-02'),
('EMILY KAYLANE DOS SANTOS ', '46465144867', 'TUPÃ', 'F', 2, '2003-01-02'),
('CHARLES SCOTT DOS SANTOS', '50301258818', 'BOTUCATU', 'M', 1, '2016-01-02'),
('LUCAS VITORINO PRADO', '45405374823', 'LINS', 'M', 11, '2007-01-02'),
('PEDRO SANTANA DE JESUS', '52731849835', 'JAÚ', 'M', 19, '2007-01-02'),
('LUCAS SEIDEL MARQUES', '50107236893', 'JAÚ', 'M', 19, '2004-01-02'),
('CAIO HENRIQUE BALIEIRO FIOLINE', '48899486867', 'PENÁPOLIS', 'M', 6, '2014-01-02'),
('MARIANA MATTOS CARVALHO PAULOZZI', '50920484840', 'LINS', 'F', 18, '2016-01-02'),
('MARIANA SILVA FRANÇA', '47838568854', 'LINS', 'F', 18, '2013-01-02'),
('ALICE MORALES CASTRO', '53374379842', 'LENÇOIS PAULISTA', 'F', 5, '2013-01-02'),
('KAUAM MARCELINO PEREZ', '41048333809', 'JAÚ', 'M', 19, '2003-01-02'),
('RAFAELA CONTI DE LIMA MARTINS', '49289406879', 'BAURU', 'F', 28, '2014-01-02'),
('CAIO HENRIQUE PEREIRA BELASCO', '57965703823', 'BIRIGUI', 'M', 12, '2011-01-02'),
('GABRIEL BORDIN LEITE', '51862259836', 'JAÚ', 'M', 19, '2005-01-02'),
('HEITOR RUIZ FERRAREZI', '51748451839', 'CATANDUVA', 'M', 20, '2016-01-02'),
('BENJAMIN ROLF DIEM', '48197221820', 'ASSIS', 'M', 3, '2014-01-02'),
('GABRIEL BONILHA DE SOUZA', '51490167803', 'TUPÃ', 'M', 2, '2008-01-02'),
('ARTHUR BERNARDINO SANTOS ', '53891142803', 'PENAPOLIS', 'M', 10, '2017-01-02'),
('MARIA VITÓRIA OLIVEIRA MARQUES', '46578517804', 'ASSIS', 'F', 3, '2013-01-02'),
('GABRIELA GOMES MOREIRA', '48144808819', 'ASSIS', 'F', 3, '2003-01-02'),
('ANA CLARA MARIPENSA', '39006463841', 'MARILIA', 'F', 7, '2003-01-02'),
('SAMUEL ARAUJO SIMAO', '50437069885', 'LINS', 'M', 18, '2014-01-02'),
('AMANDA BAPTISTELLA MANFRINATO', '48394213820', 'LENÇOIS PAULISTA', 'F', 5, '2014-01-02'),
('NYCOLLE VITOR LEAL', '46040476850', 'PENAPOLIS', 'F', 10, '2009-01-02'),
('ANDREY PIANTE CHOTOLLI', '41512350869', 'PENAPOLIS', 'M', 6, '1996-01-02'),
('RAFAEL MARFIN ARAGÃO', '53189861889', 'JAÚ', 'M', 19, '2005-01-02'),
('ELISA GASPARIN BAPTISTA', '44287832809', 'ASSIS', 'F', 3, '2002-01-02'),
('RAFAEL ROCHA MACHADO', '23937128875', 'TUPÃ', 'M', 2, '2004-01-02'),
('MATHEUS HENRIQUE CARVALHO', '37666935811', 'JAÚ', 'M', 19, '1995-01-02'),
('NICOLAS MARQUES RIBEIRO', '51518158811', 'JAÚ', 'M', 19, '2013-01-02'),
('URIEL SANTOS MELLO', '45806212807', 'JAÚ', 'M', 19, '2012-01-02'),
('EDUARDO MARTINS DE OLIVEIRA SOUZA', '42917469897', 'ASSIS', 'M', 3, '2007-01-02'),
('NAIARA MENDES VARELA LANDIM', '48219925825', 'ASSIS', 'F', 3, '2009-01-02'),
('BENTO GONZALES CARDOSO', '44829618841', 'PENAPOLIS', 'M', 6, '2011-01-02'),
('MARIA PAULA RIOS', '34612743806', 'MARILIA', 'F', 7, '2000-01-02'),
('RIAN FRANCO SANTOS LIMA', '11111111111', 'MARILIA', 'M', 7, '2001-01-02'),
('PAULO RICARDO PIMENTEL DE LIMA ', '46979946803', 'TUPÃ', 'M', 2, '2000-01-02'),
('ANA LIVEA ULHÕA RUIZ', '50066354870', 'TUPÃ', 'F', 2, '2014-01-02'),
('GUILHERME DE ANDRADE SOBRAL', '48894398897', 'DUARTINA', 'M', 13, '2009-01-02'),
('JULIA FULONI DE SOUZA', '50029014840', 'IACANGA', 'F', 9, '2015-01-02'),
('ARTHUR MIGUEL GOUVEA RAMOS ', '48824458831', 'TUPÃ', 'M', 2, '2012-01-02'),
('JÚLIA VITÓRIA DA SILVA CLEMENTE', '17039400839', 'MARÍLIA', 'F', 7, '2015-01-02'),
('LUIZA PEDRO CONSTANZO', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('ISIS DE OLIVEIRA TAKEUTI', '56130797818', 'BOTUCATU', 'F', 1, '2015-01-02'),
('MANUELLA AGUILAR DALL EVEDOVE', '46881206801', 'TUPÃ', 'F', 2, '2011-01-02'),
('NATAN COSTA FERREIRA NOGUEIRA', '99099195168', 'LENÇÓIS PAULISTA', 'M', 5, '2011-01-02'),
('ELOA DA SILVA', '48575669825', 'BOTUCATU', 'F', 1, '2014-01-02'),
('EDUARDO ROMPINELLI VIEIRA', '47588906847', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('VALENTINA LEME PAGNONCELLI', '56916928875', 'LENÇÓIS PAULISTA', 'F', 5, '2015-01-02'),
('DIEGO MARCOS RODRIGUES DA SILVA', '47626245865', 'MARILIA', 'M', 7, '1999-01-02'),
('SAMUEL HENRIQUE PRESSINATO BRANDÃO ', '52735748898', 'DUARTINA', 'M', 13, '2009-01-02'),
('LUIZ OCTAVIO PIRES MACEDO SALGADO ESCHIAVANO', '11111111111', 'MARILIA', 'M', 7, '1997-01-02'),
('JULIA GABRIELE GONCALVES', '44089860890', 'MARILIA', 'F', 7, '2000-01-02'),
('MARIANE DE OLIVEIRA CORDEIRO', '54521128807', 'MARÍLIA', 'F', 7, '2009-01-02'),
('YAGO HIROSHI KUNITAKIDE OLIVEIRA', '11111111111', 'LINS', 'M', 18, '2002-01-02'),
('LIVIA YUKARI SASSAKI', '50395618819', 'PRESIDENTE PRUDENTE', 'F', 8, '2015-01-02'),
('MIGUEL AUGUSTO VASSOLER ', '55681706818', 'DOIS CORREGOS ', 'M', 25, '2015-01-02'),
('ARTHUR BOCCA BUENO', '50794289886', 'DOIS CORREGOS ', 'M', 25, '2015-01-02'),
('MARIA LÍS DIDONI RAYES MATIAZZI', '51519558880', 'IGARAÇU DO TIETÊ ', 'F', 23, '2016-01-02'),
('DANIELLE SIMHA GHIBERTI', '40015941884', 'MARILIA', 'F', 7, '2001-01-02'),
('RAISSA GOMES HONORATO', '49752193870', 'BIRIGUI', 'F', 12, '2011-01-02'),
('LIVIA LOPES DE JESUS', '24262977862', 'TUPÃ', 'F', 2, '2009-01-02'),
('DANIEL RODRIGUES DOS SANTOS', '53036730818', 'JAÚ', 'M', 19, '2008-01-02'),
('GIOVANA CALDERARE', '48224587843', 'CAFELÂNDIA SP', 'F', NULL, '2012-03-21'),
('MARIANA FERREIRA DE ALBUQUERQUE', '52014701814', 'MARILIA', 'F', 7, '2002-01-02'),
('ANA JULIA MARCICANO DE OLIVEIRA', '46629007867', 'PENAPOLIS', 'F', 10, '2013-01-02'),
('LARA MALAGUTI DOS SANTOS', '40792535839', 'ASSIS', 'F', 3, '1998-01-02'),
('MARIA EDUARDADAHROUGE', '44479561870', 'DUARTINA', 'F', 13, '2006-01-02'),
('RODOLFO CRUZ RIBEIRO', '11111111111', 'MARILIA', 'M', 7, '1993-01-02'),
('ENZO BALLONI COUTINHO', '17714425612', 'MARÍLIA', 'M', 7, '2007-01-02'),
('JOÃO VICENTE DE OLIVEIRA VILLA', '28272086875', 'DUARTINA', 'M', 13, '1976-01-02'),
('WILLYAM ANTRACO TEZZI DE SOUZA', '50638579813', 'DUARTINA', 'M', 13, '2015-01-02'),
('MARIA LUIZA COLUCCI MONTORO', '11111111111', 'MARÍLIA', 'F', 7, '2009-01-02'),
('LUCAS MORETTI SCOBAR', '43974921826', 'ASSIS', 'M', 3, '2011-01-02'),
('YASMIM MOTA SILVA', '29802840899', 'MARÍLIA', 'F', 7, '2016-01-02'),
('FELIPE KENJI ITO', '11111111111', 'RONDONIA', 'M', 7, '2001-01-02'),
('IASMIN SCALDELAI RIBEIRO SANCHES', '50533204895', 'CATANDUVA', 'F', 20, '2011-01-02'),
('LIVIA MARIA DE PAULA CASTRO', '39140841898', 'MARILIA', 'F', 7, '2004-01-02'),
('THEO SOARES CARDOSO LUZ', '55236877822', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('LIVIA GABRIEL FERREIRA FERNANDES ', '51120468800', 'LINS ', 'F', 18, '2016-01-02'),
('AMANDA SATOMI KIMURA MINAMI', '52535040875', 'MARILIA', 'F', 7, '2004-01-02'),
('MATEUS MICHELON CAMARGO', '49296993806', 'TUPÃ', 'M', 2, '2014-01-02'),
('AYRTON BIASON GOMA', '11111111111', 'MARILIA', 'M', 7, '1997-01-02'),
('VITOR HUGO MARQUEZINI', '45799565835', 'MARILIA', 'M', 7, '2003-01-02'),
('AURORA BASSAN LOBATO', '55000680839', 'PENÁPOLIS', 'F', 6, '2018-01-02'),
('BEATRIZ DE OLIVEIRA MONTEIRO', '33258799857', 'JAÚ', 'F', 19, '2012-01-02'),
('ISABELLA PEREIRA CERON', '50551366850', 'CATANDUVA', 'F', 20, '2011-01-02'),
('MANUELLA SOARES SANTOS', '56093166856', 'ASSIS', 'F', 3, '2014-01-02'),
('PAULO CESAR GASPARIN BAPTISTA', '44287857801', 'ASSIS', 'M', 3, '2004-01-02'),
('AGATHA DE OLIVEIRA TAKEUTI', '50670603818', 'BOTUCATU', 'F', 1, '2013-01-02'),
('EDUARDO BUZZO MAGRI', '43631450800', 'MARILIA', 'M', 7, '1999-01-02'),
('INGRID CAMILLI ADAMI DA SILVA', '47560499821', 'TUPÃ', 'F', 2, '2002-01-02'),
('AMANDA SALOMÃO RODRIGUES', '22450986847', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('LETICIA RAFAELA DA SILVA', '46108545895', 'IACANGA', 'F', 9, '1997-01-02'),
('IZABELA PAURO RIBEIRO ', '56919827883', 'DOIS CORREGOS ', 'F', 25, '2016-01-02'),
('IZABELLA NAKAHODO', '44846054810', 'IGARAÇU DO TIETÊ ', 'F', 23, '2006-01-02'),
('AMANDA DO NASCIMENTO MAZARO', '11111111111', 'MARÍLIA', 'F', 7, '2016-01-02'),
('ARTHUR COSTA MARCATO PAIXAO', '50140571876', 'LINS ', 'M', 11, '2015-01-02'),
('ANA CLARA MANHÃS DE ARAUJO', '59715714862', 'BIRIGUI', 'F', 12, '2012-01-02'),
('JOÃO MURILO XIMENEZ', '42304406858', 'IGARAÇU DO TIETÊ ', 'M', 23, '2007-01-02'),
('LARA DA SILVA PONTES', '52381011803', 'ASSIS', 'F', 3, '2017-01-02'),
('LEONARDO MARTINS BARRETO', '50472479881', 'ASSIS', 'M', 3, '2008-01-02'),
('CAIO BRAGHETO CAMPO', '42663469807', 'PRESIDENTE PRUDENTE', 'M', 8, '2010-01-02'),
('NOAH YUKIU SHINKADO LUCHESI', '53251603892', 'CAFELÂNDIA SP', 'M', NULL, '2017-07-18'),
('ENZO GABRIEL HONORIO', '48603782881', 'BOTUCATU', 'M', 1, '2014-01-02'),
('ALICIA FERREIRA GUIMARÃES', '46820813813', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('ENZO AVELLANEDA CALDEIRA', '48734860843', 'TUPÃ', 'M', 2, '2014-01-02'),
('LARA ISABELLY FERNANDES RODRIGUES', '11111111111', 'LINS', 'F', 18, '2006-01-02'),
('LORENA XAVIER DA SILVA', '49279280805', 'CATANDUVA', 'F', 20, '2012-01-02'),
('PEDRO ALVES MORAES', '49446097878', 'LENÇOIS PAULISTA', 'M', 5, '2013-01-02'),
('GUILHERME AZARIAS DE AZEVEDO', '42615148850', 'JAÚ', 'M', 19, '2010-01-02'),
('MARIA FERNANDA SALEM', '11111111111', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('FERNANDA SANTINONI COUTO', '49639635820', 'MARILIA', 'F', 7, '2004-01-02'),
('LAURA BORRALHO MONTEIRO LACERDA', '13233893698', 'MARILIA', 'F', 7, '2000-01-02'),
('PEDRO CAVENAGHI AGOSTINI', '50853064814', 'PENAPOLIS', 'M', 6, '2015-01-02'),
('ENZO GABRIEL DA SILVA GRANADO', '49982481894', 'LENÇÓIS PAULISTA', 'M', 5, '2015-01-02'),
('LAYSA MIRELLA DA SILVA FERREIRA', '50208960805', 'CATANDUVA', 'F', 20, '2014-01-02'),
('MARIA EDUARDA FERREIRA DA COSTA', '44568233801', 'TUPÃ', 'F', 2, '2011-01-02'),
('ALANA ALMEIDA PINTO', '11111111111', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('LUISA DA SILVA FRADE ', '45928992882', 'LINS', 'F', 11, '2011-01-02'),
('RAFAEL LOPES DO VALE', '41941546811', 'PENÁPOLIS', 'M', 6, '1992-01-02'),
('ENZO GABRIEL ALBERTIN', '59562918858', 'JAÚ', 'M', 19, '2015-01-02'),
('PEDRO EVANGELISTA CARBONIERI', '43742813803', 'ASSIS', 'M', 3, '2009-01-02'),
('PEDRO LUCAS SOARES LIMA', '23636877879', 'ASSIS', 'M', 3, '2012-01-02'),
('CAMILI BAPTISTA', '46161760860', 'MARILIA', 'F', 7, '2003-01-02'),
('MARIA CLARA CAPARROZ LAZARI', '51112896821', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('HEITOR PEREIRA DA FONSECA', '51991827814', 'BOTUCATU', 'M', 1, '2013-01-02'),
('HENRI FRANZO NASCIMENTO', '53144692867', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('GABRIEL VASSELO MARTINS ', '46409210809', 'DOIS CORREGOS ', 'M', 25, '2012-01-02'),
('LUANA HALINA SIQUEIRA SANTOS', '51186757825', 'MARILIA', 'F', 7, '2002-01-02'),
('MARIA LUÍZA MONTEROZORIO FOGAÇA ', '50596707835', 'BOTUCATU', 'F', 1, '2012-01-02'),
('PEDRO CAMILO DOS SANTOS NOGUEIRA', '51719554846', 'PRESIDENTE PRUDENTE', 'M', 8, '2013-01-02'),
('BRUNA MARCONDES RAVAL', '52366818807', 'BIRIGUI', 'F', 12, '2011-01-02'),
('MARIA CLARA LEITE VENTURA', '11111111111', 'LINS', 'F', 18, '2011-01-02'),
('EIKE EDUARDO PACHECO', '11111111111', 'LINS', 'M', 18, '2012-01-02'),
('FELIPE ANDRÉ VERGINASSI', '38006575894', 'PRESIDENTE PRUDENTE', 'M', 26, '1996-01-02'),
('LUAN DOS SANTOS TAVARES', '53604500885', 'DUARTINA', 'M', 13, '2012-01-02'),
('MIKHAEL SIMPLICIO DOS SANTOS ', '53359773888', 'TUPÃ', 'M', 2, '2005-01-02'),
('LETICIA RAFAELA DA SILVA', '46108545895', 'IACANGA', 'F', 9, '1997-01-02'),
('ALICIA CAMPOS DA COSTA', '48883221800', 'JAU', 'F', 19, '2014-01-02'),
('MIRELA VITÓRIA FRAGOSO DOS SANTOS', '11111111111', 'DUARTINA', 'F', 13, '2013-01-02'),
('MADJER MUHAMMAD SABBAG', '52632884845', 'CATANDUVA', 'M', 20, '2002-01-02'),
('THEODORO HENRIQUE ALVES CAVALCANTE ', '55374297805', 'LINS', 'M', 11, '2018-01-02'),
('AMANDA VITÓRIA NUNES RODRIGUES', '49054397870', 'LINS', 'F', 18, '2006-01-02'),
('OTAVIO AUGUSTO DOS SANTOS COSTA', '45581519854', 'ASSIS', 'M', 3, '2009-01-02'),
('EMANNUEL BENTO DA SILVA FERREIRA', '50208916814', 'CATANDUVA', 'M', 20, '2010-01-02'),
('MATHEUS GOMES PIMENTA', '46421566820', 'CATANDUVA', 'M', 20, '2012-01-02'),
('CATHARINA SAITO DE OLIVEIRA', '46754179813', 'MARILIA', 'F', 7, '2004-01-02'),
('ENRICO BANEZA RHEINLANDER', '57121299810', 'PENÁPOLIS', 'M', 6, '2019-01-02'),
('RAFAELA LEAL ASSIS ', '58134707866', 'PENÁPOLIS', 'F', 6, '2020-01-02'),
('HUGO KAZUO DE SOUZA HAIASHI', '46402176842', 'GUAIÇARA', 'M', 16, '2012-01-02'),
('PEDRO LUCAS DOS SANTOS SENATORE', '48660545818', 'PENAPOLIS', 'M', 10, '2014-01-02'),
('FLÁVIO RODRIGUES CIMÓ', '32136632809', 'ASSIS', 'M', 3, '1991-01-02'),
('JOÃO HENRIQUE PRATES CARRENHO', '30782203892', 'AGUDOS', 'M', 17, '2007-01-02'),
('ANA CLARA GUNTHER BORIN', '46520010880', 'JAÚ', 'F', 19, '2012-01-02'),
('LUISA RIBEIRO LANZONI', '11111111111', 'AGUDOS', 'F', 17, '2017-01-02'),
('TAYNARA HERMENEGILDO VICENTE DA SILVA ', '57589982814', 'TUPÃ ', 'F', 2, '2011-01-02'),
('IGOR CHAGAS SCHVAIGUER', '54065262860', 'ASSIS', 'M', 3, '2004-01-02'),
('ARTHUR XAVIER RODRIGUES SCHIAVON', '41035730820', 'PENÁPOLIS', 'M', 10, '2008-01-02'),
('CAMILA SLOMPO BELO', '46230496801', 'DUARTINA', 'F', 13, '2011-01-02'),
('GABRIEL R DO AMARAL', '47815218865', 'LENÇÓIS PAULISTA', 'M', 5, '2007-01-02'),
('YAGO HENRIQUE RIBEIRO DOS SANTOS', '42393683831', 'GUAIÇARA', 'M', 16, '2009-01-02'),
('ANA JULIA FARIA', '48765009835', 'JAU', 'F', 19, '2011-01-02'),
('VINÍCIUS KENZO MIYASHIRO', '50462528804', 'PARAGUAÇU PAULISTA', 'M', 31, '2009-01-02'),
('DIOGO CREMONEZI MARTINS', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 26, '2008-01-02'),
('FELIPE DE SOUZA PADILHA', '45343252826', 'PRESIDENTE PRUDENTE', 'M', 8, '2008-02-10'),
('BEATRIZ DE LUCCI', '50800836898', 'IGARAÇU DO TIETÊ ', 'F', 23, '2013-01-02'),
('JULIA GARCEZ DA SILVA', '46900001823', 'BIRIGUI', 'F', 12, '2011-01-02'),
('THAINÁ CAMPOS RODRIGUES', '52242704800', 'CATANDUVA', 'F', 20, '2017-01-02'),
('MATHEUS BECCARIA AMORIM DE OLIVEIRA', '47154582847', 'CATANDUVA', 'M', 20, '2003-01-02'),
('MIGUEL ANDERSON DE SOUZA ONORIO', '59098035817', 'TUPÃ', 'M', 2, '2016-01-02'),
('PIETRO DE MELO FÁVERO', '48178996898', 'BOTUCATU', 'M', 4, '2012-01-02'),
('MARCELA ESTVANATO GIMENES PENTEADO', '49105986850', 'IACANGA', 'F', 9, '2010-01-02'),
('MARIA CLARAS CURIEL WALDEMARIN DE OLIVEIRA ', '52401635882', 'LINS', 'F', 18, '2008-01-02'),
('HELOISA PEREIRA DE BARROS', '49341899800', 'BOTUCATU', 'F', 1, '2015-01-02'),
('MIGUEL DE LIMA FAVATO', '48904453828', 'CATANDUVA', 'M', 20, '2010-01-02'),
('HELENA ESCOBAR PIOVEZANI', '51556947879', 'ASSIS', 'F', 3, '2016-01-02'),
('HENRIQUE DE OLIVEIRA ARAUJO', '44345078857', 'PENAPOLIS', 'M', 10, '2011-01-02'),
('BRUNA ARAÚJO PALMA BARCHI', '60172577810', 'ASSIS', 'F', 3, '2016-01-02'),
('LUIZ OTÁVIO LIMA CAFERRO', '48072947842', 'PENAPOLIS', 'M', 10, '2014-01-02'),
('ANA MARIA CARAMANO TERSI', '56478163806', 'JAÚ', 'F', 19, '2013-01-02'),
('FELIPE BONFIM REIS', '52314628888', 'PENÁPOLIS', 'M', 6, '2014-01-02'),
('ISABELLA SARTORIO FERREIRA ', '54105446843', 'LINS', 'F', 11, '2018-01-02'),
('GIOVANA RODRIGUES GIMENES', '48438259804', 'ASSIS', 'F', 3, '2014-01-02'),
('CATARINA FRASSON LOPES GARCIA', '50679393897', 'ASSIS', 'F', 3, '2011-01-02'),
('MIGUEL M ORMELESI', '54044963800', 'JAÚ', 'M', 19, '2012-01-02'),
('CLARA BRITO SOARES', '51705204848', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('SOFIA CARLA SERRANO CAMPAGNOLLO', '57198875807', 'PENÁPOLIS', 'F', 10, '2014-01-02'),
('BENJAMIN D'' AVANZO JORGE', '11111111111', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('HELOISA LEMES FINCO', '49859627838', 'GUAIÇARA', 'F', 16, '2015-01-02'),
('BETTINA VIANA DE CARVALHO LIMA', '58061409895', 'GUAIÇARA/SP', 'F', 16, '2019-01-02'),
('FELIPE STRADIOTO VICENTINI', '44311369832', 'MARÍLIA', 'M', 7, '2011-01-02'),
('OTÁVIO CAMPOS MAIA', '50769060803', 'CATANDUVA', 'M', 20, '2011-01-02'),
('NICOLAS FELIPE DE OLIVEIRA MARIANO', '50908273894', 'DUARTINA', 'M', 13, '2012-01-02'),
(' JOÃO GABRIEL NUNES', '53594945812', 'AGUDOS', 'M', 17, '2007-01-02'),
('ENRICO CASARI VELOSO DE ALMEIDA ', '47551723811', 'TUPÃ ', 'M', 2, '2011-01-02'),
('ALAN RAVI TADDEI RAMOS', '43373193877', 'ASSIS', 'M', 3, '2010-01-02'),
('BERNARDO ALVES ANDREOTTI', '26932310864', 'AGUDOS', 'M', 17, '2016-01-02'),
('LAURA MOREIRA GUALDA', '56035258867', 'PRESIDENTE PRUDENTE', 'F', 8, '2014-01-02'),
('THEODORA MUNIZ DE PAULA', '46175961862', 'LINS', 'F', 11, '2012-01-02'),
('ANA CLARA FERREIRA DE SOUZA', '11111111111', 'ASSIS ', 'F', 3, '2018-01-02'),
('PEDRO LUCAS PARPINELLI PERES ', '38571542848', 'PENAPOLIS', 'M', 10, '2006-01-02'),
('GABRIELA NOGARA ALMEIDA', '53610590807', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('HELENA CELESTINO', '47888447880', 'BOTUCATU', 'F', 4, '2009-01-02'),
('THIAGO SOUZA BRITO', '39941980896', 'SÃO PAULO', 'M', 15, '2004-01-02'),
('MARCO ANTÔNIO GIL MUNHOZ PEREIRA', '53039892835', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('GIOVANA GAVA PIZI', '52707084859', 'PRESIDENTE PRUDENTE', 'F', 26, '2003-01-02'),
('VINICIUS LOPES DA SILVA', '11111111111', 'JAU', 'M', 19, '2007-01-02'),
('MATHEUS JANUARIO PEREIRA', '30756044880', 'TUPA', 'M', 2, '1982-01-02'),
('AGNES ARAUJO FERNANDES FERREIRA', '48651199813', 'IACANGA', 'F', 9, '2014-01-02'),
('DAVI SIMONGINI PAIVA', '47830119821', 'PARAGUAÇU PAULISTA', 'M', 31, '2013-01-02'),
('LUCAS SPAMPINATO KILL', '49754030804', 'ASSIS', 'M', 3, '2015-01-02'),
('VALENTINA AMORIN VICENTIM', '53371454874', 'CATANDUVA', 'F', 20, '2017-01-02'),
('FERNANDA TIEMI KOGA BISOLATTE', '47817878862', 'LINS', 'F', 18, '2003-01-02'),
('RAYRA SOPHIA DE OLIVEIRA VERISSIMO CARDOSO', '47937492830', 'TUPÃ', 'F', 2, '2013-01-02'),
('HEITOR OLIVEIRA SANTANA', '11111111111', 'LINS', 'M', 18, '2011-01-02'),
('EDUARDO DE ABREU SOARES', '30117930857', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('MARIA EDUARDA LEMES BATISTA', '44946037837', 'BIRIGUI', 'F', 12, '2010-01-02'),
('LETICIA SAKATA', '57479169809', 'MARÍLIA', 'F', 7, '2014-01-02'),
('BIANCA MARQUETI ROJAS', '46145675845', 'ASSIS', 'F', 3, '2012-01-02'),
('PIETRA SCALDELAI TUPY', '44011578851', 'CATANDUVA', 'F', 20, '2011-01-02'),
('LORENZO BIANCHI AGUIAR', '50047090847', 'LINS', 'M', 18, '2015-01-02'),
('MATHEUS SALBEGO ALVES MAIA', '11111111111', 'LINS', 'M', 18, '2016-01-02'),
('PAULO ELIEL MEDINA', '45714492838', 'AGUDOS', 'M', 17, '1998-01-02'),
('NOAH DE RESENDE BARBOSA', '51841446840', 'ASSIS ', 'M', 3, '2016-01-02'),
('EMANUELLE CRISTINA GOMES NASCIMENTO', '48311412839', 'GUAIÇARA/SP', 'F', 16, '2014-01-02'),
('BRUNO CESAR RIBEIRO PAES', '53816733883', 'PENAPOLIS', 'M', 10, '2008-01-02'),
('CAIO VIANA ONGARATTO', '42827874814', 'LENÇÓIS PAULISTA', 'M', 5, '2009-01-02'),
('BEATRIZ MORAES DOS SANTOS', '47585989830', 'ASSIS ', 'F', 3, '2013-01-02'),
('VINCENZO BRASSOLOTO', '47339267824', 'DUARTINA', 'M', 13, '2009-01-02'),
('OLIVIA SILVA AMBRÓSIO ', '51451698844', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('SUELLEN GOUVEA NUNES', '50865583870', 'LINS', 'F', 18, '2016-01-02'),
(' AYLA LICURSI DE A SEGA', '41870849833', 'AGUDOS', 'F', 17, '2016-01-02'),
('LÍVIA ISADORA FELIX PEREIRA', '54468704845', 'GUAIÇARA', 'F', 16, '2015-01-02'),
('DAVI DAMACENO VOLPINI', '45730996896', 'ASSIS', 'M', 3, '2012-01-02'),
('VITOR LUÍS FRANCISCO BUENO', '43840954819', 'PARAGUAÇU PAULISTA', 'M', 31, '2011-01-02'),
('FRANCISCO SEGALLA', '45132725899', 'JAÚ', 'M', 19, '2011-01-02'),
('YAGO DE  PAULA SPADA', '58079607850', 'CATANDUVA', 'M', 20, '2012-01-02'),
('EDUARDO MESQUITA SPRESSAO', '49813569867', 'MARILIA', 'M', 7, '2002-01-02'),
('ALEXANDRE REOLON', '27681857877', 'TUPA', 'M', 2, '1977-01-02'),
('LUIZA MIGLIORINI SILVANI', '53277720802', 'JAÚ', 'F', 19, '2015-01-02'),
('JORGE HENRIQUE PEREIRA COLEVATI', '51529772818', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('SOPHIA PINHEIRO IWAMOTO', '50102930805', 'BOTUCATU', 'F', 4, '2010-01-02'),
('ISADORA MARTINS BATISTELA', '44998859808', 'ASSIS', 'F', 3, '2006-01-02'),
('MATEUS SOARES BRITO', '49371748869', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('LARISSA ANDRADE TERAO', '41986388883', 'CATANDUVA', 'F', 20, '2003-01-02'),
('MATHEUS YAMANISHI GRUNENBERG', '46026172807', 'ASSIS', 'M', 3, '2012-01-02'),
('JULIA GOMES PAVÃO', '51114278807', 'ATIBAIA - SP', 'F', 15, '2004-01-02'),
('MIRELLA SALABER PEREIRA', '51781030847', 'LINS', 'F', 11, '2009-01-02'),
('HECTOR HUGO DE MELO', '90078174856', 'JAU', 'M', 19, '2012-01-02'),
('RAFAEL PAVANELLO DINIZ', '45081647810', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('JULIA DE AZEVEDO SANTOS', '54462014855', 'TUPÃ', 'F', 2, '2009-01-02'),
('EMANUELLY YASMIN INÁCIO', '24152794801', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('LARA RANZULLA DA SILVA', '51514148870', 'PENAPOLIS', 'F', 6, '2012-01-02'),
('ENZO ESCOBAR PIOVEZANI', '45642347810', 'ASSIS', 'M', 3, '2012-01-02'),
('MARCOS ALVES DE MORAES', '11111111111', 'LENÇOIS PAULISTA', 'M', 5, '2014-01-02'),
('FELIPE BENETTI BETIO', '50897150848', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('AIME MACIEL LOBATO', '49662002880', 'PENÁPOLIS', 'F', 6, '2015-01-02'),
('PEDRO WILLIAM GIACON PRENDIN', '54279995826', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('MARIA BEATRIZ AMARAL', '49595654892', 'GUAIÇARA/SP', 'F', 16, '2015-01-02'),
('ANNA CLARA AZMAN RIBEIRO', '54734366845', 'PENÁPOLIS', 'F', 6, '2008-01-02'),
('ENZO SANTANA PRATA', '11111111111', 'AGUDOS', 'M', 17, '2008-01-02'),
('LIZIA PACHECO DE MELO', '51439413851', 'AGUDOS', 'F', 17, '2016-01-02'),
('SARAH ANGELO GOMES', '53454594871', 'CATANDUVA', 'F', 20, '2009-01-02'),
('DAVI SALBEGO ALVES MAIA', '11111111111', 'LINS', 'M', 18, '2011-01-02'),
('JULIA MOREIRA GUALDA', '56035196810', 'PRESIDENTE PRUDENTE', 'F', 8, '2014-01-02'),
('PEDRO FRANCO BARRACHI', '50069388890', 'LINS', 'M', 18, '2015-01-02'),
('JOÃO GUILHERME MONTANHA DA SILVA', '51955931836', 'LINS', 'M', 18, '2014-01-02'),
('MIGUEL TRUGILIO ', '49493677818', 'TUPÃ', 'M', 2, '2015-01-02'),
('THAINA VITORIA CAMARGO GARCIA FERREIRA', '53277377806', 'PENAPOLIS', 'F', 10, '2011-01-02'),
('ARTHUR BELENTANI DO SANTOS', '49187744821', 'LINS', 'M', 18, '2014-01-02'),
('MIGUEL GONÇALVES PIRES', '42505602875', 'ASSIS', 'M', 3, '2009-01-02'),
('DAVI LUCA DE ALMEIDA ', '46599787886', 'PARAGUAÇU PAULISTA', 'M', 31, '2012-01-02'),
('CLARA DE AVANCE MONTEIRO', '46412482814', 'TUPÃ', 'F', 2, '2007-01-02'),
('GABRIEL JUNQUEIRA LIMA', '11111111111', 'MARILIA', 'M', 7, '2004-01-02'),
('OLIVIA BAQUI DAMARIO GOMES', '42098325886', 'CATANDUVA', 'F', 20, '2003-01-02'),
('BEATRIZ ARAUJO DE LIMA', '47316986859', 'BOTUCATU', 'F', 4, '2007-01-02'),
('JOAO VITHOR ADIB GONÇALVES', '53500904882', 'BOTUCATU', 'M', 1, '2015-01-02'),
('THIAGO DOS SANTOS MELO FILHO', '57747170890', 'PARAGUAÇU PAULISTA', 'M', 31, '2014-01-02'),
('LEONARDO BARROS TEIXEIRA', '52487299800', 'BOTUCATU', 'M', 1, '2017-01-02'),
('ANA LUIZA DE LIMA CARDOSO', '46495313810', 'ASSIS', 'F', 3, '2005-01-02'),
('ÍSIS SILVA DINIZ', '52742908846', 'ASSIS', 'F', 3, '2011-01-02'),
('ALICE RAPUSSI MENDES', '44869273896', 'TUPÃ', 'F', 2, '2009-01-02'),
('BENTO CÉSAR GAVASSI', '11111111111', 'MARÍLIA', 'M', 7, '2011-01-02'),
('ANA CLARA DE OLIVEIRA DALCECO', '46237400800', 'GUAIÇARA', 'F', 16, '2006-01-02'),
('MARIA EDUARDA PENNA', '24048389890', 'JAU', 'F', 19, '2015-01-02'),
('LAURA CARDOSO PAVONI', '50733697852', 'GUAIÇARA/SP', 'F', 16, '2014-01-02'),
('CECILIA PEREIRA PENHA', '51313256846', 'LINS', 'F', 18, '2013-01-02'),
('PEDRO SILVA TEIXEIRA', '47209762809', 'GUAIÇARA', 'M', 16, '2012-01-02'),
('SARA NYCOLE DE OLIVEIRA', '55294908832', 'CATANDUVA', 'F', 20, '2011-01-02'),
('LUCAS BARBOSA FARIA', '45815829897', 'CATANDUVA', 'M', 20, '2008-01-02'),
('LUCAS PASSOS CALABRIA', '51046179802', 'AGUDOS', 'M', 17, '2015-01-02'),
('RYAN AVELLANEDA CALDEIRA', '54312871841', 'TUPÃ', 'M', 2, '2007-01-02'),
('IZABELA SOUZA MOURA', '57652781833', 'TUPÃ ', 'F', 2, '2013-01-02'),
('DAVI LUCAS CARAMANO TERSI', '56478093832', 'JAU', 'M', 19, '2013-01-02'),
('DANIEL MAGNABOSCO DA SILVA', '48641889809', 'LINS', 'M', 18, '2014-01-02'),
('ARTHUR PEREIRA ROCHA LOPES', '55951107830', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('LIVIA FERNANDES CARNEIRO ', '52297592833', 'PRESIDENTE PRUDENTE', 'F', 8, '2014-01-02'),
('PEDRO MIGUEL MATIAS', '58107263804', 'PENAPOLIS', 'M', 6, '2012-01-02'),
('RAUL DI NATALE OLIVEIRA', '53592920839', 'AGUDOS', 'M', 17, '2013-01-02'),
('MARIA EDUARDA DE BARROS CORDEIRO', '53282439865', 'ASSIS', 'F', 3, '2009-01-02'),
('SOPHIA MAGALHÃES RODRIGUES ', '53706912821', 'MARÍLIA ', 'F', 7, '2017-01-02'),
('THAUANNY OLEGARIO DA SILVA DE DEUS', '49066711876', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('ALICE MARIA LOPES DE OLIVEIRA ', '47218493890', 'TUPÃ', 'F', 2, '2013-01-02'),
('LIVIA CORREIA BALBINO DOS SANTOS', '50517474859', 'BOTUCATU', 'F', 1, '2012-01-02'),
('FELIPPE DALAN DALCIN ', '10420539956', 'ASSIS', 'M', 3, '2012-01-02'),
('NATHALIA WAIBEL', '40124999808', 'MARILIA', 'F', 7, '2001-01-02'),
('ARTUR DE OLIVEIRA SQUARIZ SIMÕES SORES   ', '56878677831', 'TUPÃ', 'M', 2, '2010-01-02'),
('JOÃO BATISTA MIMESSE GONÇALVES', '26868978862', 'PRESIDENTE PRUENTE', 'M', 26, '2011-01-02'),
('RAFAEL UTTEMPERGHER DE MENDONÇA', '39850115831', 'MARÍLIA', 'M', 7, '1992-01-02'),
('VITOR DAL POZ LUCENA ', '11111111111', 'ASSIS ', 'M', 3, '2013-01-02'),
('THEO PINHEIRO IWAMOTO', '50102994889', 'BOTUCATU', 'M', 4, '2011-01-02'),
('MARCO GOYS DE ROBERTIS', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 8, '2017-01-02'),
('VICTORIA CAMARGO DE BRITO', '44276633893', 'ASSIS', 'F', 3, '2011-01-02'),
('ANA JULIA DE OLIVEIRA', '46633083840', 'LENÇOIS PAULISTA', 'F', 5, '2013-01-02'),
('CAUÃ GABRIEL PORTO VENÂNCIO', '51235910873', 'LINS', 'M', 11, '2012-01-02'),
('LEONARDO VANZELLA GUILHERMETTI', '50788959816', 'ASSIS', 'M', 3, '2012-01-02'),
('FREDERICO MAXIMO DALDEGAN', '11111111111', 'JAU', 'M', 19, '1988-01-02'),
('RENAN LOPES', '45459135800', 'CATANDUVA', 'M', 20, '2012-01-02'),
('MARIANA MARTINS', '11111111111', 'LINS', 'F', 18, '2013-01-02'),
('MARIA EDUARDA MARTINS ANDREOTTI', '51723171808', 'ASSIS ', 'F', 3, '2016-01-02'),
('BRYAN DE CARVALHO SOARES', '49059287886', 'CATANDUVA', 'M', 20, '2009-01-02'),
('ISAQUE MARTINS ALEXANDRE', '57008117825', 'LENÇÓIS PAULISTA', 'M', 5, '2012-01-02'),
('YASMIM MOURA DE AGUSTINI', '49034583856', 'CATANDUVA', 'F', 20, '2009-01-02'),
('MATHEUS DE LIMA SILVA', '44243516880', 'GUAIÇARA/SP', 'M', 16, '2011-01-02'),
('VICTOR AUGUSTO PASIEKA TOMÉ VARGAS', '45625950865', 'PENAPOLIS', 'M', 10, '2010-01-02'),
('LORENA SILVA FELIPPIN', '44188373881', 'PENAPOLIS', 'F', 10, '2011-01-02'),
('SARA EMANUELE ARAUJO SIMÃO', '51639150863', 'LINS', 'F', 18, '2016-01-02'),
('FELIPE GABRIEL NISTARDA MARQUES', '55298308899', 'TUPÃ', 'M', 2, '2007-01-02'),
('LIVIA BEATRIZ CELESTINO DE SOUZA', '45770834871', 'PENAPOLIS', 'F', 10, '2012-01-02'),
('FELIPE AKIRA BARRETO CARRIJO', '11111111111', 'PENÁPOLIS', 'M', 6, '2019-01-02'),
('GUSTAVO HENRIQUE AMORELLI DE OLIVEIRA', '48556548/60', 'LINS', 'M', 18, '2014-01-02'),
('ARTHUR MORAIS FRANCISCO', '29390395852', 'AGUDOS', 'M', 17, '2014-01-02'),
('LAÍS CELESTINO MAGALHÃES', '54011950874', 'PENAPOLIS', 'F', 10, '2008-01-02'),
('MATHEUS SANCHES FERREIRA', '42596896818', 'PENAPOLIS', 'M', 10, '2008-01-02'),
('ANALU SOUZA CABRAL', '53782897854', 'MARÍLIA ', 'F', 7, '2017-01-02'),
('DEBORA DE FREITAS FERREIRA', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('HELENA MOREIRA AVANÇO', '26815571866', 'AGUDOS', 'F', 17, '2016-01-02'),
('RAMON TROMBELI DE ALMEIDA AZEVEDO', '55610793874', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('BRUNA FERNANDES MODOLO', '24022755881', 'PENÁPOLIS', 'F', 6, '2009-01-02'),
('ENZO FERNANDES DE JESUS', '46236645892', 'GUAIÇARA', 'M', 16, '2009-01-02'),
('HEITOR SANTOS MORAES', '53528293837', 'MARÍLIA', 'M', 7, '2017-01-02'),
('ANALICY DE JESUS DA SILVA', '46833291829', 'LINS', 'F', 18, '2013-01-02'),
('JOSÉ PAULO CABRAL', '45100237821', 'LINS', 'M', 11, '2012-01-02'),
('LUCAS MONTE OLIVA PORTILHO', '42684407800', 'PENAPOLIS', 'M', 10, '2007-01-02'),
('DANIEL ANTONIO VALENTE DE LIMA', '23795248825', 'ASSIS', 'M', 3, '2005-01-02'),
('ASAFE MARCONDES PEREIRA', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 26, '2001-01-02'),
('JAQUELINE MODAELLI', '40173279821', 'MARILIA', 'F', 7, '1990-01-02'),
('JULIA FRANZIN RODRIGUES ROSA', '11111111111', 'MARILIA', 'F', 7, '2001-01-02'),
('FERNANDA CLÁUDIO NAKAMURA', '46999302813', 'BOTUCATU', 'F', 4, '2011-01-02'),
('NICOLAS LEVI ARAUJO ALVES', '54396527870', 'JAU', 'M', 19, '2013-01-02'),
('LUANNA MAZIERO TELES', '11201181909', 'MARILIA', 'F', 7, '2005-01-02'),
('ARTHUR ENRICO BEIRIGO DE MORAES', '25310695850', 'ASSIS', 'M', 3, '2011-01-02'),
('RAFAEL RUIZ SILVA', '11719829845', 'PRESIDENTE PRUDENTE', 'M', 26, '2006-01-02'),
('ENZO MION AGUIAR', '38707051832', 'TUPÃ', 'M', 2, '2006-01-02'),
('VITOR VIEIRA SUZUKI SATO', '48623708881', 'MARILIA', 'M', 7, '2000-01-02'),
('JOÃO PEDRO JADO DA SILVA', '24175847863', 'TUPÃ', 'M', 2, '2008-01-02'),
('MIGUEL DOS SANTOS BARBOSA', '49799494877', 'TUPÃ', 'M', 2, '2015-01-02'),
('MARIA CLARA DOS SANTOS', '47886077856', 'BOTUCATU', 'F', 1, '2013-01-02'),
('LUIZA MARTINS DOS SANTOS', '47508625846', 'LINS', 'F', 18, '2013-01-02'),
('CAETANO GOYS DE ROBERTIS', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 8, '2012-01-02'),
('ENRICO ARCURI DE FREITAS', '46149889890', 'LENÇÓIS PAULISTA', 'M', 5, '2010-01-02'),
('MARIA EDUARDA FERREIRA DE MELO MATOS', '40385870884', 'JAU', 'F', 19, '2008-01-02'),
('BEATRIZ GIL QUIRINO', '46376433847', 'JAÚ', 'F', 19, '2004-01-02'),
('JOAO LUCAS DE OLIVEIRA GOUVEIA', '46483636806', 'PENAPOLIS', 'M', 6, '2013-01-02'),
('LARA LOBO BATISTA', '49912196805', 'CATANDUVA', 'F', 20, '2013-01-02'),
('RAFAELA MAETINS NORONHA', '11111111111', 'LINS', 'F', 18, '2014-01-02'),
('BEN RESENDE BARBOSA ', '52457435855', 'ASSIS ', 'M', 3, '2014-01-02'),
('EDUARDO MARINELLI MACHADO', '39933478893', 'CATANDUVA', 'M', 20, '2004-01-02'),
('DANIEL VASCONCELOS DOS SANTOS', '11111111111', 'LINS', 'M', 18, '2014-01-02'),
('HADASSAH PEREIRA GRACIANO', '31931446814', 'AGUDOS', 'F', 17, '2018-01-02'),
('LETICIA PEREIRA BURANELLO', '48483689871', 'PENAPOLIS', 'F', 6, '2005-01-02'),
('SAMUEL TORREZAN MARCHESI', '11111111111', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('VITOR WAKI BACHIEGA', '52541469829', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('HEITOR BENJAMIN RAMOS', '13414990814', 'AGUDOS', 'M', 17, '2013-01-02'),
('MIGUEL CINI SOCAL', '43767254808', 'CATANDUVA', 'M', 20, '2002-01-02'),
('GUSTAVO FALASS DINIZ', '55032627860', 'ASSIS', 'M', 3, '2010-01-02'),
('GABRIEL MONTEIRO DOS SANTOS', '50468424830', 'DUARTINA', 'M', 13, '2014-01-02'),
('ESTELA CORDEIRO DOS SANTOS', '51699021821', 'LINS', 'F', 18, '2016-01-02'),
('LORENZO MACHADO GARCIA ', '53053105802', 'MARÍLIA ', 'M', 7, '2017-01-02'),
('GUSTAVO DOS SANTOS MARQUESI', '49749903811', 'IACANGA', 'M', 9, '2014-01-02'),
('MATEUS MONTE OLIVA PORTILHO BARBOSA', '46431647866', 'PENÁPOLIS', 'M', 10, '2013-01-02'),
('GIOVANA GOUVEIA DANTAS', '49942941860', 'ASSIS', 'F', 3, '2015-01-02'),
('LUIZA ZAMBROZIO PASSARI', '34253512810', 'PENÁPOLIS', 'F', 6, '2015-01-02'),
('GABRIEL ROSA REGASSI ', '50874606829', 'PARAGUAÇU PAULISTA', 'M', 31, '2010-01-02'),
('LUCCA ZABEU DE CHECCHI', '49479642867', 'BOTUCATU', 'M', 4, '2012-01-02'),
('SUELLEN ANTICO NOGUEIRA', '42128185823', 'PRESIDENTE PRUDENTE', 'F', 26, '1993-01-02'),
(' ADEMIR DUARTE FERNANDES ROSA', '48527234866', 'TUPÃ', 'M', 2, '2010-01-02'),
('GUILHERME AUGUSTO DE MORAES DELVECHIO', '46644715800', 'CATANDUVA', 'M', 20, '2008-01-02'),
('ISAAC DIAS ITO', '50412404850', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('CAMILA PEREIRA MENDES', '48507471838', 'PRESIDENTE PRUDENTE', 'F', 26, '1998-01-02'),
('MATEUS ZUBI GIMENES', '45060130851', 'MARILIA', 'M', 7, '2003-01-02'),
('GUSTAVO YOSIOKA RIBEIRO', '19592969736', 'MARÍLIA ', 'M', 7, '2016-01-02'),
('JOAQUIN VILLAGRA S MARQUES SENGIA ', '57035771875', 'TUPÃ', 'M', 2, '2010-01-02'),
('MARIA EDUARDA SCOTT DOS SANTOS', '45821272823', 'BOTUCATU', 'F', 1, '2012-01-02'),
('HELENA BARBOSA DA SILVA', '40197295819', 'AGUDOS', 'F', 17, '2013-01-02'),
('MARCUS VINICIUS GOMES OSIPOV', '49861681850', 'TUPÃ', 'M', 2, '2001-01-02'),
('JULIA OLIVEIRA CAMARGO', '42988261806', 'CATANDUVA', 'F', 20, '2002-01-02'),
('FELLYPE GABRIEL BRAGA DOS SANTOS ', '46430609804', 'PARAGUAÇU PAULISTA', 'M', 31, '2007-01-02'),
('MANUELA GOMES LUPOLI', '11111111111', 'CATANDUVA', 'F', 20, '2005-01-02'),
('LIVIA BEATRIZ BEZERRA', '45161826886', 'CATANDUVA', 'F', 20, '2012-01-02'),
('JULIA AMARO LUIZ PIVA', '58023303848', 'TUPÃ', 'F', 2, '2009-01-02'),
('GIOVANA GAROSO LOMBARDO', '57065531813', 'TUPÃ', 'F', 2, '2010-01-02'),
('VINÍCIUS FITIPALDI DA SILVA', '49943741805', 'ASSIS', 'M', 3, '2014-01-02'),
('MARIANA NOVAES GARCIA', '50392787806', 'CATANDUVA', 'F', 20, '2009-01-02'),
('RAFAELA HINATA SANCHES MATUCHITA', '55125203858', 'LINS', 'F', 11, '2018-01-02'),
('LAEL OLIVEIRA SOUZA', '42928319808', 'TUPÃ', 'M', 2, '2007-01-02'),
('MURILLO RODRIGO NUNES KERCHE', '43666356826', 'DUARTINA', 'M', 13, '2009-01-02'),
('MIGUEL PIRES DE SOUZA', '54127660805', 'ASSIS', 'M', 3, '2016-01-02'),
('CAUÃ MENEGHETI DOS SANTOS', '42685996818', 'ASSIS', 'M', 3, '2010-01-02'),
('MURILO GOMES DE OLIVEIRA SILVA', '11111111111', 'ASSIS', 'M', 3, '2012-01-02'),
('GUILHERME GROSSI', '40726481831', 'JAU', 'M', 19, '1992-01-02'),
('ANA JÚLIA SANTOS DE OLIVEIRA', '46561280848', 'ASSIS', 'F', 3, '2004-01-02'),
('FLAVIO AUGUSTO FACHETTI FORTUNATO', '51027102816', 'LINS', 'M', 11, '2010-01-02'),
('ISABELLY BALIEIRO ROS', '48294122831', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('ANNY LIZ PESTILE COSTA', '51375228803', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('FELIPE AUGUSTO DOS SANTOS COSTA', '49777567898', 'ASSIS', 'M', 3, '2014-01-02'),
('ROBERTA MACIEL MOURA', '15520460604', 'MARILIA', 'F', 7, '2002-01-02'),
('GABRIELY SANTANA BALBO', '27020298842', 'AGUDOS', 'F', 17, '2015-01-02'),
('RAFAELA PIRES PAES', '45610469848', 'ASSIS', 'F', 3, '2012-01-02'),
('PEDRO HENRIQUE CARREIRO PEREIRA', '43602836878', 'ASSIS', 'M', 3, '2009-01-02'),
('JOAO VICTOR BORGES MONICI', '48152458864', 'MARILIA', 'M', 7, '2003-01-02'),
('ANA CLARA RODRIGUES SANCHES', '22446371860', 'TUPÃ', 'F', 2, '2011-01-02'),
('GABRIELE AMARO BIGESCHI ', '60378466852', 'TUPÃ', 'F', 2, '2009-01-02'),
('MARIA HELENA RAFAEL CRUZ', '49161887800', 'BOTUCATU', 'F', 1, '2013-01-02'),
('KAIQUE OLIVEIRA GONZAGA', '56085887892', 'PENÁPOLIS', 'M', 6, '2013-01-02'),
('LUCCA ZABEU DE CHECCHI', '49479642867', 'BOTUCATU', 'M', 4, '2012-01-02'),
('JULIANA ACÁSSIA DA SILVA', '47586434824', 'PRESIDENTE PRUDENTE', 'F', 26, '1998-01-02'),
('JOÃO PEDRO FACHETTI FORTUNATO', '51027179878', 'LINS', 'M', 11, '2010-01-02'),
('MARIANA VIEIRA DIAS ALVES', '50755097890', 'TARUMÃ', 'F', 22, '2011-01-02'),
('PEDRO LIZARELLI SOARES', '42977587845', 'MARILIA', 'M', 7, '2003-01-02'),
('JONAS LOSSILA REOLON', '47387452806', 'TUPA ', 'M', 2, '2013-01-02'),
('MARIA EDUARDA DOS SANTOS PELEGRINI ', '45927964893', 'PARAGUAÇU PAULISTA', 'F', 31, '2012-01-02'),
('NATALY MOÇO CODAGNONE', '50168122847', 'DUARTINA', 'F', 13, '2007-01-02'),
('SOFIA MARIA RODRIGUES MIRANDA', '52605072827', 'LINS', 'F', 18, '2013-01-02'),
('HADASSA DOS SANTOS ARAÚJO SILVA ', '43823451998', 'MARÍLIA ', 'F', 7, '2011-01-02'),
('ARIADNY BISPO DOS SANTOS', '53593784840', 'AGUDOS', 'F', 17, '2012-01-02'),
('GUILHERME GAROSO LOMBARDO', '57065426866', 'TUPÃ', 'M', 2, '2010-01-02'),
('JÚLIA PEREIRA BORETTI', '51854146858', 'ASSIS', 'F', 3, '2016-01-02'),
('BIANCA CACIATORI DE ARRUDA', '54789829898', 'TUPÃ', 'F', 2, '2011-01-02'),
('HELENA SANTELO AKASHI MACHADO DE MATOS', '43229703898', 'PRESIDENTE PRUDENTE', 'F', 26, '2009-01-02'),
('RODOLFO RISSO MILANO', '11111111111', 'JAU', 'M', 19, '1981-01-02'),
('MARIA JÚLIA GASBARRO DOS SANTOS', '53344188810', 'PARAGUAÇU PAULISTA', 'F', 31, '2008-01-02'),
('SARAH LALUCE ROSABONI', '54749540854', 'CATANDUVA', 'F', 20, '2005-01-02'),
('MAITE VITORIA NOVAS RODRIGO', '11111111111', 'LINS', 'F', 18, '2016-06-27'),
('ALICE KAWAKAMI DA SILVA', '52977469818', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('JOAQUIM PARO MASCHIETTO', '58627753905', 'PENÁPOLIS', 'M', 6, '2019-01-02'),
('INGRID AVELINO DE SOUZA', '55006703873', 'AGUDOS', 'F', 17, '2012-01-02'),
('CAUÃ MENEGHETI DOS SANTOS', '42685996818', 'ASSIS', 'M', 3, '2010-01-02'),
('PEDRO HENRIQUE VITOR LEAL', '48851338825', 'PENAPOLIS', 'M', 10, '2014-01-02'),
('ANA LÍVIA BRASIL CIMÓ', '45799974840', 'ASSIS', 'F', 3, '2012-01-02'),
('MATHEUS ROBERTO PENACHINI', '48732349807', 'ASSIS ', 'M', 3, '2014-01-02'),
('RAFAELLY EDUARDA TOFOLI DE PONTES', '55169617852', 'BOTUCATU', 'F', 1, '2013-01-02'),
('GUSTAVO MAROTTI DE ALMEIDA', '47099892819', 'MARILIA', 'M', 7, '2002-01-02'),
('LUCAS BLAYA BUENO SILVA', '43451697807', 'PRESIDENTE PRUDENTE', 'M', 26, '2008-01-02'),
('LÍVIA MENDES TEIXEIRA', '11111111111', 'TARUMÃ', 'F', 22, '2011-01-02'),
('RODRIGO HABER MELLEM', '44448369897', 'MARILIA', 'M', 7, '2001-01-02'),
('VALENTINA NEVES BRUSCHI', '50482909846', 'CATANDUVA', 'F', 20, '2015-01-02'),
('GIUGLIA BERTOCCO DE PAIVA NOGUEIRA', '10356219917', 'MARILIA', 'F', 7, '2003-01-02'),
('MIGUEL MANTOVANI FRANCO', '48095688819', 'PARAGUAÇU PAULISTA', 'M', 31, '2014-01-02'),
('EDUARDO AUGUSTO DE ANDRADE HAIK FILHO', '45345705895', 'PRESIDENTE PRUDENTE', 'M', 26, '2003-01-02'),
('RAFAEL PEREIRA BORETTI', '49557189819', 'ASSIS', 'M', 3, '2015-01-02'),
('ALICE MARIS FELIPIN', '43518536893', 'TUPA ', 'F', 2, '2010-01-02'),
('PEDRO HENRIQUE PIOVESAN RAMOS', '46892164870', 'CATANDUVA', 'M', 20, '2012-01-02'),
('MARIA EDUARDA R L  LOPES', '51505463807', 'MARILIA', 'F', 7, '2001-01-02'),
('BERNARDO RUIZ TARIFA ', '50676934870', 'TUPÃ', 'M', 2, '2014-01-02'),
('BÁRBARA DE OLIVEIRA VENÂNCIO', '33162023823', 'ASSIS', 'F', 3, '1989-01-02'),
('DAVI HOSTI GAVIRA', '50490452825', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('FRANCINE REIS REDI FERNANDES ', '54962849883', 'TUPÃ', 'F', 2, '2009-01-02'),
('ARTHUR DA SILVA BRAGIATO', '51844615820', 'AGUDOS', 'M', 17, '2011-01-02'),
('ALINE FERNANDES DE PAIVA PAROLIZ', '31168542898', 'JAU', 'F', 19, '1982-01-02'),
('OTÁVIO AUGUSTO ENSINA DE OLIVEIRA ', '43594783804', 'MARÍLIA ', 'M', 7, '2009-01-02'),
('RAFAELA PAIXÃO DE ANDRADE', '52037895844', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('MARIA THAIS FRICHER FRACASSI', '45003605811', 'CATANDUVA', 'F', 20, '2003-01-02'),
('ANA JÚLIA MOÇO CODAGNONE', '50168159848', 'DUARTINA', 'F', 13, '2005-01-02'),
('ANA BATISTA BARBOSA', '11111111111', 'LINS', 'F', 18, '2013-01-02'),
('MAITE VITORIA NOVAES RODRIGO', '51447394828', 'LINS', 'F', 18, '2016-01-02'),
('GABRIELLY FERNANDES REVOREDO', '55732088881', 'PENÁPOLIS', 'F', 6, '2018-01-02'),
('BEATRIZ MONTANARI MANFRE', '50898417805', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('TIAGO ROSA VIDEIRA', '44976125890', 'PENÁPOLIS', 'M', 6, '2009-01-02'),
('ALICE VITORATTO AZEVEDO ', '53700648812', 'PARAGUAÇU PAULISTA', 'F', 31, '2011-01-02'),
('LUISA PERES CANOVAS', '47063565800', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('ANTONIO ROMERO NOGUEIRA', '45007724807', 'PRESIDENTE PRUDENTE', 'M', 26, '2006-01-02'),
('ANA JULIA CANATO', '44265486835', 'PARAGUAÇU PAULISTA', 'F', 21, '2011-01-02'),
('JAÕA ARTHUR PEREIRAMARCELINO', '49975386806', 'LINS', 'M', 18, '2015-01-02'),
('LAURA MICHEL PIRES', '11111111111', 'CATANDUVA', 'F', 20, '2000-01-02'),
('ENZO GABRIEL ALVES RAMOS', '47333795870', 'LINS', 'M', 18, '2011-01-02'),
('ERICK PINHEIRO ', '21363886819', 'MARÍLIA ', 'M', 7, '1981-01-02'),
('RAI DE JESUS MATIAS OLIVEIRA', '51434320867', 'BOTUCATU', 'M', 1, '2012-01-02'),
('PRISCILA DE OLIVEIRA MARTINS DOS SANTOS', '33061558888', 'ASSIS', 'F', 3, '1994-01-02'),
('JÚLIO GARCIA PEREZ ', '48814063320', 'ASSIS ', 'M', 3, '2014-01-02'),
('MATHEUS DA SILVA XAVIER', '45000787897', 'BIRIGUI', 'M', 12, '2009-01-02'),
('ANDRIAN EDUARDO SANTOS', '49704008813', 'TARUMÃ', 'M', 22, '2012-01-02'),
('KAMILY VITORIA MION MANDELLI', '90016757866', 'TUPÃ', 'F', 2, '2012-01-02'),
('SOPHIA IZIDORO DO PRADO', '56341688806', 'JAU', 'F', 19, '2015-01-02'),
('ISAAC POLETI APPOLINARIO', '57074268203', 'IACANGA', 'M', 9, '2010-01-02'),
('ALICE RIBEIRO MENDES', '48551025805', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('FRANCISCO BATISTA GONÇALVES', '49864808800', 'ASSIS', 'M', 3, '2015-01-02'),
('MARIANA BERTELLINI', '11111111111', 'CATANDUVA', 'F', 20, '2005-01-02'),
('ELIAS HENRIQUE GALDINO MARTINS', '11111111111', 'LINS', 'M', 18, '2014-01-02'),
('ALANA CAMERA PIERONI PITANGA', '11111111111', 'MARILIA', 'F', 7, '2000-01-02'),
('LUIS FELIPE DE SOUZA MORENO', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 26, '2010-01-02'),
('ALESSANDRA ROGATO FREIRE FERREIRA', '22727433824', 'JAU', 'F', 19, '1982-01-02'),
('SAMUEL OLIVEIRA SPINA DA SILVA ', '51444765892', 'LINS', 'M', 18, '2016-01-02'),
('MIGUEL SOBRAL AMORIM', '71874279136', 'PENÁPOLIS', 'M', 6, '2014-01-02'),
('MARIA LUIZA FAREZIN SANTIAGO', '53776967862', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('ARTHUR  BRASIL CIMO ', '51881693805', 'ASSIS ', 'M', 3, '2016-01-02'),
('GUSTAVO DOS SANTOS BUENO ', '53582602850', 'PARAGUAÇU PAULISTA', 'M', 31, '2008-01-02'),
('MARIANNE PENACHINI DA COSTA RESENDE BARBOSA ', '38433669850', 'ASSIS ', 'F', 3, '1990-01-02'),
('MARINA PERES CANOVAS', '52070037800', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('MARIA VITORIA ZARPELAO DE CAMPOS', '49038781806', 'PRESIDENTE PRUDENTE', 'F', 26, '2008-01-02'),
('GIULIA PATERRA TUÄO', '11111111111', 'MARILIA', 'F', 7, '2001-01-02'),
('GABRIELLY CAETANO DE SOUZA', '11111111111', 'PARAGUAÇU PAULISTA', 'F', 21, '2010-01-02'),
('THEO ALEXANDRE CLARO DE LIMA', '52830494857', 'JAU', 'M', 19, '2017-01-02'),
('MARIANA RIBAS SANTOS', '44463732859', 'ASSIS', 'F', 3, '1999-01-02'),
('ANNA BEATRIZ DOS SANTOS FERREIRA DIAS ', '57244509847', 'TUPÃ', 'F', 2, '2012-01-02'),
('NICOLAS POLETI APPOLINARIO', '57070223846', 'IACANGA', 'M', 9, '2013-01-02'),
('MARCELO ROBERTO DA SILVA', '24769402830', 'MARÍLIA ', 'M', 7, '1980-01-02'),
('IGOR GABRIEL DE PEDRI', '52413589864', 'ASSIS', 'M', 3, '2011-01-02'),
('JOÃO PEDRO DONEGAR PEREIRA', '11111111111', 'BIRIGÜI', 'M', 12, '2013-01-02'),
('LUÍSA MANFIO GALIANO', '45309727809', 'ASSIS', 'F', 3, '2012-01-02'),
('BEATRIZ RODRIGUES LUCHETTI', '45242647876', 'LINS', 'F', 18, '2010-01-02'),
('LUIS FELIPE HERMENEGILDO VICENTE DA SILVA', '57589995800', 'TUPA', 'M', 2, '2013-01-02'),
('YOHAN DE MATTOS QUINTO', '48232261862', 'LINS', 'M', 18, '2014-01-02'),
('ISADORA APARECIDA NUNES PIANI', '44273764873', 'GUAIÇARA', 'F', 16, '2008-01-02'),
('YUDI TANAKA CAVALLO ', '48276402895', 'CATANDUVA', 'M', 20, '2009-01-02'),
('BENJAMIN BASSETI APOLINARIO', '50928364828', 'PRESIDENTE PRUDENTE', 'M', 26, '2016-01-02'),
('ENZO PACHELLI', '38152640816', 'JAÚ', 'M', 19, '2006-01-02'),
('ENZO RIBEIRO MENDES', '44383021883', 'PENÁPOLIS', 'M', 6, '2011-01-02'),
('LUIZA RODRIGUES DE ARAUJO', '49898479892', 'PENÁPOLIS', 'F', 6, '2015-01-02'),
('PEDRO AUGUSTO DE BRITO NASCIMENTO', '49747285800', 'TARUMÃ', 'M', 22, '2012-01-02'),
('SOPHIA OYAN', '49325845806', 'BOTUCATU', 'F', 1, '2014-01-02'),
('LUIS GUSTAVO JUSTINO DOS ANJOS', '11111111111', 'LINS', 'M', 18, '2014-01-02'),
('THOR MORAES MACIEIRA', '44686199883', 'CATANDUVA', 'M', 20, '2002-01-02'),
('ANA JULIA OLIVEIRA SPINA DA SILVA', '48972573876', 'LINS', 'F', 18, '2013-01-02'),
('LEONOR SOBRAL AMORIM', '71874256195', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('MARIANA PINHEIRO MARTELO', '11111111111', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('PAULA RODRIGUES DE FARIAS', '11111111111', 'PRESIDENTE PRUDENTE', 'F', 26, '1998-01-02'),
('LUÍS OTAVIO LABADESSA BELIZÁRIO ', '47143627801', 'TUPÃ', 'M', 2, '2012-01-02'),
('GABRIELA SOBRINHO COSTA', '50946484899', 'AGUDOS', 'F', 17, '2011-01-02'),
('MARIA VITORIA DA SILVA MARANGONI', '11111111111', 'PRESIDENTE PRUDENTE', 'M', 26, '2000-01-02'),
('LUIS RONALDO DE SOUSA VILANI ', '22621161804', 'DUARTINA', 'M', 13, '1983-01-02'),
('CECÍLIA PESSOA MOREIRA MACHADO BARREIROS', '11111111111', 'ASSIS', 'F', 3, '2016-01-02'),
('LUIZ ANTÔNIO CAMPIONI CAMPOS', '48743894810', 'PENAPOLIS', 'M', 6, '2014-01-02'),
('GUILHERME BASSETO DA SILVA', '44403924824', 'BIRIGUI', 'M', 12, '2011-01-02'),
('LUCAS DAHER DA SILVEIRA LUSTRI', '51107314895', 'JAU', 'M', 19, '2015-01-02'),
('SARAH VITORIA SNDRADE VENTURA', '43898074803', 'PARAGUAÇU PAULISTA', 'F', 31, '2010-01-02'),
('NATANAEL AUGUSTO DARDANI', '41705421888', 'CATANDUVA', 'M', 20, '2000-01-02'),
('FERNANDA FERRAIOILI DE PAULA', '11111111111', 'MARILIA', 'F', 7, '2002-01-02'),
('VITOR HUGO DE SOUZA SOLA', '50870803874', 'TUPA', 'M', 2, '2001-01-02'),
('PEDRO HENRIQUE FATORI PEREIRA', '11111111111', 'CATANDUVA', 'M', 20, '2011-01-02'),
('OLÍVIA IOLANDA PEREIRA', '11111111111', 'ASSIS', 'F', 3, '2012-01-02'),
('EDUARDO LEITE MARTINS', '58169127807', 'DUARTINA', 'M', 13, '2008-01-02'),
('HEITOR NUNES BERNAL', '11111111111', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('LAURA PEDROSO DE OLIVEIRA', '56359573822', 'IACANGA', 'F', 9, '2016-01-02'),
('MARIANA ESTABILE', '60403182875', 'BIRIGUI', 'F', 12, '2014-01-02'),
('CLARA DA SILVA BORREGO', '38597688831', 'PRESIDENTE PRUDENTE', 'F', 26, '2003-01-02'),
('LARISSA DOS SANTOS VIDOTI ', '58928515831', 'TUPÃ', 'F', 2, '2013-01-02'),
('ANA LIVIA MONTEIRO HASSAN', '26824677841', 'PENÁPOLIS', 'F', 6, '2015-01-02'),
('MATHEUS PEREIRA NARDIS', '50204765870', 'TARUMÃ', 'M', 22, '2014-01-02'),
('JOÃO PEDRO DOS SANTOS', '47420403848', 'LENÇOIS PAULISTA', 'M', 5, '2012-01-02'),
('LUIZ OTÁVIO CHAPANI VEZZA', '45541536812', 'LENÇÓIS PAULISTA', 'M', 5, '2012-01-02'),
('MELISSA ALVES SANTOS PEREIRA', '11111111111', 'LINS', 'F', 18, '2013-01-02'),
('HELENA GOMES DA SILVA', '53663383873', 'LENÇOIS PAULISTA', 'F', 5, '2014-01-02'),
('MARIA VITORIA DA SILVA MARANGONI', '44582024807', 'PRESIDENTE PRUDENTE', 'F', 26, '2000-01-02'),
('DAVI LUCCAS SANTANA LUCIO', '51876605808', 'PARAGUAÇU PAULISTA', 'M', 21, '2014-01-02'),
('DANILO SILVEIRA DE MATOS', '77765627007', 'AGUDOS', 'M', 17, '2010-01-02'),
('GUSTAVO BASSETO DA SILVA', '47555945886', 'BIRIGUI', 'M', 12, '2013-01-02'),
('MIGUEL MARQUES DA SILVA', '50464404827', 'JAU', 'M', 19, '2015-01-02'),
('ROBERTO MARTINI', '47784633823', 'LENÇOIS PAULISTA', 'M', 5, '2013-01-02'),
('MURILO CARDOSO BORGES DA SILVA', '47033857837', 'LENÇÓIS PAULISTA', 'M', 5, '2011-01-02'),
('MARIA FERNANDA CHAPANI DE OLIVEIRA', '42111429848', 'LENÇÓIS PAULISTA', 'F', 5, '2009-01-02'),
('RAFAEL HENRIQUE DA SILVA CRUZ', '48745056862', 'PARAGUAÇU PAULISTA', 'M', 31, '2007-01-02'),
('LUIZ CARLOS CAMARA NETO', '42263028854', 'LINS', 'M', 18, '2009-01-02'),
('CAUE BASSALOBRE MARQUES DA COSTA  ', '48000406802', 'MARÍLIA ', 'M', 7, '2008-01-02'),
('VICTORIA MEDINA DOS SANTOS', '56966126870', 'LENÇOIS PAULISTA', 'F', 5, '2009-01-02'),
('MIGUEL DAVI SALES TAVARES ', '46046039878', 'TUPÃ', 'M', 2, '2012-01-02'),
('JOÃO MARCOS PAIZAN NETO', '52761095839', 'GUAIÇARA/SP', 'M', 16, '2017-01-02'),
('VICTOR ANTÔNIO MAIA', '50769005896', 'CATANDUVA', 'M', 20, '2005-01-02'),
('PEDRO CARRILLO VOROS', '53727977892', 'LENÇÓIS PAULISTA', 'M', 5, '2006-01-02'),
('PEDRO HENRIQUE DE OLIVEIRA', '41581483830', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('GABRIELA PEREIRA', '42827342804', 'LENÇÓIS PAULISTA', 'F', 5, '2007-01-02'),
('VITOR GABRIEL DE MORAES SALES', '50396794831', 'LENÇÓIS PAULISTA', 'M', 5, '2008-01-02'),
('CAUÃ MUCCI TORRES', '11111111111', 'LINS', 'M', 18, '2013-01-02'),
('MARIA CLARA MARCOLINO', '49748773809', 'LENÇÓIS PAULISTA', 'F', 5, '2010-01-02'),
('SAMYRA DA SILVA CIORLIN', '11111111111', 'CATANDUVA', 'F', 20, '2002-01-02'),
('SOPHIA LARA CAETANO', '26069459806', 'CATANDUVA', 'F', 20, '2009-01-02'),
('FELIPE MATHEUS FABRI MORAIS GRANADO ', '35232038800', 'ASSIS ', 'M', 3, '1988-01-02'),
('MARIA EDUARDA COSTA PASSARI', '46243830870', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('MARIAH PEDROSO DE OLIVEIRA', '53632881847', 'IACANGA', 'F', 9, '2017-01-02'),
('MARIA LUIZA CLABUCHAR ALEIXO', '44755877865', 'PENAPOLIS', 'F', 10, '2011-01-02'),
('YASMIM GABRIELLY DOS SANTOS ALMEIDA', '11111111111', 'LINS', 'F', 18, '2014-01-02'),
('MARINA LOCH EIRA', '11111111111', 'MARILIA', 'F', 7, '2001-01-02'),
('LEONARDO ANDRADE MARIANO', '53533721825', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('MANUELA DE AQUINO MORETTI', '51580010814', 'PENÁPOLIS', 'F', 6, '2016-01-02'),
('ACACIO LOURENZO SANTOS DA CRUZ', '50272770833', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('MATHEUS COUTINHO DE OLIVEIRA E SILVA', '55223247833', 'BOTUCATU', 'M', 4, '2010-01-02'),
('RENATA ORTIZ', '45736720876', 'PRESIDENTE PRUDENTE', 'F', 26, '2000-01-02'),
('ANA CLARA RODRIGUES ALVES', '58316751810', 'PARAGUAÇU PAULISTA', 'F', 21, '2010-01-02'),
('ARTHUR HENRIQUE DE FREITAS', '41167567846', 'TUPÃ', 'M', 2, '2007-01-02'),
('BEATRIZ SILVA ROSSETI', '11111111111', 'MARILIA', 'F', 7, '2003-01-02'),
('MARIA SOFIA IBANHES ANARIO ', '45602447822', 'TUPÃ', 'F', 2, '2012-01-02'),
('MARIA JULIA ELIAS DE FREITAS', '45127501856', 'PRESIDENTE PRUDENTE', 'F', 26, '2000-01-02'),
('MARIA LUIZA POLONIO GREMIS', '46825710877', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('REGIANE KUME ', '32467935817', 'ASSIS ', 'F', 3, '1986-01-02'),
('DAVI PACHECO DE MELO', '46087100873', 'AGUDOS', 'M', 17, '2009-01-02'),
('MIGUEL ANTONIO FERREIRA', '49773205819', 'PARAGUAÇU PAULISTA', 'M', 21, '2014-01-02'),
('DANIEL  DE LIMA SIMIÃO ', '50700911820', 'ASSIS ', 'M', 3, '2015-01-02'),
('SAMIRA MEKARO E SILVA', '39455953803', 'PARAGUAÇU PAULISTA', 'F', 31, '2006-01-02'),
('ENZO BARBOSA DE SOUSA', '46880721800', 'BIRIGUI', 'M', 12, '2012-01-02'),
('CONRADO ALMEIDA PAES', '59123078839', 'TARUMÃ', 'M', 22, '2014-01-02'),
('VIVIANN SENA SILVA ', '50072605847', 'CATANDUVA', 'F', 20, '2015-01-02'),
('GABRIELLA SILVA DE FRANÇA', '47838513871', 'LINS', 'F', 18, '2008-01-02'),
('FELIPE SANTOS CRACCO', '44892001880', 'GUAIÇARA', 'M', 16, '2011-01-02'),
('ANA LAURA CLABUCHAR ALEIXO', '42576094864', 'PENAPOLIS', 'F', 10, '2010-01-02'),
('ARTHUR DE BIANCO RESENDE SILVA', '42790487898', 'LINS', 'M', 18, '2010-01-02'),
('SOFIA CORDEIRO DOS SANTOS', '51251008895', 'LINS', 'F', 18, '2014-01-02'),
('ISADORA AISSA CONSTANTINO', '36623533850', 'CATANDUVA', 'F', 20, '2004-01-02'),
('LILIAN DA SILVA ROSA', '51943629862', 'PARAGUAÇU PAULISTA', 'F', 21, '2010-01-02'),
('MARIANE DOS SANTOS SANCHES', '44536269835', 'PENÁPOLIS', 'F', 6, '2011-01-02'),
('BERNARDO BRAGATO DA PURIFICAÇÃO ', '51853068820', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('LEONARDO POLTRONIERI NUNES', '44473989828', 'GUAIÇARA/SP', 'M', 16, '2007-01-02'),
('MATHEUS PARO NOVAES ', '56283747841', 'PENÁPOLIS', 'M', 6, '2018-01-02'),
('PEDRO FERNANDES MODOLO', '24022788895', 'PENÁPOLIS', 'M', 6, '2011-01-02'),
('MATHEUS SERRANO DIAS', '49064120846', 'LENÇOIS PAULISTA', 'M', 5, '2008-01-02'),
('EMANUELY VITÓRIA GOMES DE SOUZA', '49800646809', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('MARIANA DE AQUINO MORETTI', '49927125844', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('JOAO FRANCISCO PARO NOVAES ', '49693704860', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('HENRIQUE ANTÔNIO GALDINO BERTACCO', '48634868800', 'PRESIDENTE PRUDENTE', 'M', 26, '2000-01-02'),
('MANUELA NOVAIS RODRIGUES ', '44908745889', 'TUPÃ', 'F', 2, '2011-01-02'),
('TAYLON HENRIQUE BERTUCCIO SALES', '35029075879', 'BIRIGUI', 'M', 12, '1990-01-02'),
('LUIZ MAZIEIRO DOS SANTOS PELICIA', '53603371844', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('ESTER CAMPOS DE ALMEIDA', '50850567874', 'ASSIS', 'F', 3, '2016-01-02'),
('FELIPE OLIVI MARTINS', '35285880807', 'CATANDUVA', 'M', 20, '2004-01-02'),
('JULIA BARCAROLLO PINTO', '42282109880', 'ASSIS ', 'F', 3, '2007-01-02'),
('SOFIA RODRIGUES GONÇALVES LIMA', '23967496848', 'TUPÃ', 'F', 2, '2006-01-02'),
('DANIEL PELEGRINI CAÇÃO', '44988158431', 'PARAGUAÇU PAULISTA', 'M', 31, '2010-01-02'),
('JOÃO VITOR CARDOSO', '46756756893', 'AGUDOS', 'M', 17, '1999-01-02'),
('JULIA MUNHOZ', '52663455865', 'CATANDUVA', 'F', 20, '2017-01-02'),
('TALITA SALIONI', '11111111111', 'MARILIA', 'F', 7, '2004-01-02'),
('MIGUEL AMORIM GASPARIN MENEGON', '43240061805', 'ASSIS', 'M', 3, '2010-01-02'),
('OTAVIO PESIEKA TOMÉ VARGAS', '48303883828', 'PENAPOLIS', 'M', 10, '2014-01-02'),
('LIVIA ALVES MAIA RANGEL', '51602599882', 'AGUDOS', 'F', 17, '2007-01-02'),
('BRUNO DE JESUS TREVISAN', '51228937800', 'MARILIA', 'M', 7, '2000-01-02'),
('BEATIRZ ALMEIDA DA CUNHA', '53688329821', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('GABRIELLA MARTINS NORONHA', '46614108824', 'LINS', 'F', 18, '2008-01-02'),
('GABRIEL IMENES LEÃO', '50044775822', 'AGUDOS', 'M', 17, '2015-01-02'),
('MARIA JULIA SERRADOR', '55979881824', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('JULIA GONÇALVES DINARDI', '49227551875', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('LARA GONÇALVES DOS SANTOS', '41805515861', 'CATANDUVA', 'F', 20, '2001-01-02'),
('LUISA DE SOUZA LIRA', '57173837898', 'IACANGA', 'F', 9, '2015-01-02'),
('LEONARDO GABRIEL MAZOLLA MENDES', '44345436877', 'GUAIÇARA', 'M', 16, '2008-01-02'),
('SOFIA BARBIERI FUSARI', '46452740822', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('GUSTAVO LUÍS DA SILVA', '39410024811', 'PRESIDENTE PRUDENTE', 'M', 26, '1997-01-02'),
('MATHEUS FERNANDES CONSTANTINO', '46602816802', 'TUPÃ', 'M', 2, '2011-01-02'),
('MATHEUS MONTEIRO CREPALDI', '44839134847', 'CATANDUVA', 'M', 20, '2008-01-02'),
('LORENA GASBARRO GUERIN', '30476726875', 'PARAGUAÇUPAULISTA', 'F', 31, '2012-01-02'),
('ANA LIVIA DE OLIVEIRA LOPES VIEIRA', '30138073856', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('JOÃO RICARDO DE OLIVEIRA', '46927885494', 'DUARTINA', 'M', 13, '2013-01-02'),
('OTAVIO RONDINA COUTO', '43450223801', 'AGUDOS', 'M', 17, '2008-01-02'),
('ANDRÉ FERNANDES MODOLO', '24022765844', 'PENÁPOLIS', 'M', 6, '2012-01-02'),
('KAUÊ LUIZ DA SILVA ANDRADE', '53860692844', 'IACANGA', 'M', 9, '2008-01-02'),
('ARIEL PERES LUCAS', '11111111111', 'DUARTINA', 'M', 13, '2009-01-02'),
('PEDRO HENRIQUE VITOR LEAL', '48851338825', 'PENAPOLIS', 'M', 10, '2014-01-02'),
('ISABELLE MOREIRA DA SILVA', '49594704888', 'CATANDUVA', 'F', 20, '2000-01-02'),
('VITOR VENTURA', '48768104863', 'ASSIS', 'M', 3, '2007-01-02'),
('JOÃO PACHECO DE ALMEIDA PRADO FILHO', '40814690831', 'DUARTINA', 'M', 13, '1995-01-02'),
('LEONARDO HENRIQUE DE OLIVEIRA SILVA', '49922133830', 'GUAIÇARA/SP', 'M', 16, '2015-01-02'),
('RUBENS HELENO TEIXEIRA NETO', '45735141805', 'PENÁPOLIS', 'M', 6, '2012-01-02'),
('LUIZ OTAVIO MATIAS PEREIRA', '42791418865', 'LINS', 'M', 18, '2009-01-02'),
('THEO GONZALES CARDOSO', '44829580852', 'PENAPOLIS', 'M', 6, '2008-01-02'),
('JOÃO LORENZO CAMPOS RODRIGUES', '56952814825', 'ASSIS', 'M', 3, '2016-01-02'),
('BEATRIZ ANTIQUEIRA REVOREDO', '54286408809', 'PENÁPOLIS', 'F', 6, '2018-01-02'),
('SOPHIA CAROLINA DE MELLO OLIVEIRA', '47095550875', 'GUAIÇARA', 'F', 16, '2012-01-02'),
('DAVI GONÇALVES DINARDI', '53180618850', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('BRENDA ROCHA DE CARVALHO', '49946087847', 'CATANDUVA', 'F', 20, '2010-01-02'),
('MIGUEL IMENES LEÃO', '49286694873', 'AGUDOS', 'M', 17, '2012-01-02'),
('ANTÔNIO AUGUSTO MARCHIOLLI DE ALMEIDA', '51269353802', 'PENÁPOLIS', 'M', 6, '2015-01-02'),
('NICOLAS TOGNOLI DO PRADO ANDRADE', '44439802885', 'CATANDUVA', 'M', 20, '2008-01-02'),
('RAYANE DA SILVA OLIVEIRA', '12805381637', 'LENCOIS PAULISTA', 'F', 5, '2011-01-02'),
('JOÃO GURITA NETO', '50014697831', 'PRESIDENTE PRUDENTE', 'M', 26, '2001-01-02'),
('ANA BEATRIZ MEDEIROS PEREIRA', '55460381878', 'MARILIA', 'F', 7, '2013-01-02'),
('ANA LAURA TAKASAKI MARTINEZ', '55704254896', 'TUPÃ', 'F', 2, '2018-01-02'),
('MARIA FLOR NOGUEIRA VICENTE', '57619635823', 'ASSIS', 'F', 3, '2016-01-02'),
('DAVI ANDRADE DE SOUZA', '51446209814', 'GUAIÇARA/SP', 'M', 16, '2016-01-02'),
('PEDRO HENRIQUE GUZZO SANTILOTO', '47552456809', 'CATANDUVA', 'M', 20, '2001-01-02'),
('MURILO AUGUSTO FRAGOSO DOS SANTOS', '11111111111', 'DUARTINA', 'M', 13, '2011-01-02'),
('HEITOR RONDINA COUTO', '45349285807', 'AGUDOS', 'M', 17, '2012-01-02'),
('MARCOS DO NASCIMENTO MAZARO', '18990842174', 'MARILIA', 'M', 7, '2018-01-02'),
('VIVIAN VIANA DE CARVALHO', '40894382845', 'GUAIÇARA', 'F', 16, '1997-01-02'),
('CATARINA NOGUEIRA GRANADO', '47074051806', 'ASSIS', 'F', 3, '2013-01-02'),
('ALICE NARDEGAN BUSTAMANTE ', '47326013837', 'TUPÃ', 'F', 2, '2013-01-02'),
('MARINA AKEMI BARRETO CARRIJO', '45963408890', 'PENÁPOLIS', 'F', 6, '2012-01-02'),
('GABRIEL ONIWA NUNES', '11633546608', 'CATANDUVA', 'M', 20, '2000-01-02'),
('ENZO PIOVEZAN VASCONCELLOS', '47145842866', 'GUAIÇARA', 'M', 16, '2012-01-02'),
('DANILO HANTKE RODRIGUES GARCIA', '45813691855', 'CATANDUVA', 'M', 20, '2011-01-02'),
('THEO PAVANI ZIBORDI', '53307094823', 'ASSIS', 'M', 3, '2017-01-02'),
('GABRIEL SHIGO T MARCATTO ', '39755982909', 'LINS', 'M', 11, '2007-01-02'),
('PEDRO ROCHA PASSARI', '50840321830', 'PENÁPOLIS', 'M', 6, '2016-01-02'),
('THEO TORREZAN TOSATI', '53489564812', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('DAVI MANZANO TORREZAN ZAMBELLO', '49434127858', 'PENÁPOLIS', 'M', 6, '2014-01-02'),
('JULIANA MARINHO', '50760796807', 'PENAPOLIS', 'F', 10, '2006-01-02'),
('LETÍCIA  DA SILVA OLIVEIRA', '12805354664', 'LENCOIS PAULISTA', 'F', 5, '2011-01-02'),
('ALICE VITORIA DE OLIVEIRA', '56541102848', 'IACANGA', 'F', 9, '2015-01-02'),
('BIANCA AKEMI HAMATSU', '30984166882', 'MARÍLIA', 'F', 7, '2015-01-02'),
('ISADORA ORTIZ DE CARVALHO', '49116867823', 'PRESIDENTE PRUDENTE', 'F', 26, '2001-01-02'),
('GABRIEL ROSA REGASSI', '50874606829', 'PARAGUAÇU PAULISTA', 'M', 21, '2010-01-02'),
('JOÃO PEDRO BASSETO CARRIJO', '47606726809', 'PENÁPOLIS', 'M', 6, '2013-01-02'),
('JOAQUIM DOS SANTOS OLIVEIRA NETO', '49792169865', 'CATANDUVA', 'M', 20, '2015-01-02'),
('ANA LAURA TAKASAKI MARTINEZ ', '55704254896', 'TUPÃ', 'F', 2, '2018-01-02'),
('JOÃO GABRIEL SILVA RIBEIRO', '49489039810', 'GUAIÇARA/SP', 'M', 16, '2015-01-02'),
('PEDRO HENRIQUE REDIGOLO MIZAEL', '50327373806', 'CATANDUVA', 'M', 20, '2015-01-02'),
('EDUARDO PEREIRA DOS SANTOS', '53233744897', 'CATANDUVA', 'M', 20, '2010-01-02'),
('FRANCISCO NOGUEIRA GRANADO', '51800822855', 'ASSIS', 'M', 3, '2016-01-02'),
('OLAVO SILVA MAIA', '46790263837', 'ASSIS', 'M', 3, '2013-01-02'),
('EMANUELLY MADINA  MARTINS ', '48564393860', 'TUPÃ', 'F', 2, '2014-01-02'),
('JOÃO GABRIEL CARVALHO DE SANTANA ', '52876592886', 'IACANGA', 'M', 9, '2014-01-02'),
('MANUELA MARIA PEREIRA CASUMBÁ', '28985226860', 'GUAIÇARA', 'F', 16, '2013-01-02'),
('EMANOEL HENRIQUE OLIVEIRA ORENHA', '11111111111', 'TUPÃ', 'M', 2, '2007-01-02'),
('LOUISE IANELA SALLES', '42593410817', 'PENÁPOLIS', 'F', 6, '2009-01-02'),
('PEDRO LUCAS DE JESUS SOUZA', '47159043812', 'LINS', 'M', 18, '2005-01-02'),
('JÚLIA PAVANI ZIBORDI', '53307035819', 'ASSIS', 'F', 3, '2017-01-02'),
('ELOÁ MOURA DE AGUSTINI', '49869409881', 'CATANDUVA', 'F', 20, '2013-01-02'),
('MARIA FERNANDA MARTINS NEVES', '52516464886', 'GUAIÇARA', 'F', 16, '2017-01-02'),
('THIAGO MARIANO SERAFIM GOMES', '36065901806', 'DUARTINA', 'M', 13, '2000-01-02'),
('BENJAMIM BOARETO DE LIMA VIEIRA', '48653167870', 'MARÍLIA', 'M', 7, '2012-01-02'),
('JOÃO GABRIEL FERNANDES TIARDELI', '42255642824', 'TUPÃ', 'M', 2, '2001-01-02'),
('LAURA VERONESE', '54973047880', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('MURILO OLIVEIRA MENDES', '52359601814', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('MARIA LUIZA PEGO MANOEL', '43572273603', 'PENAPOLIS', 'F', 10, '2005-01-02'),
('DAVI VIEIRA ROCCA', '52077443804', 'BIRIGUI', 'M', 12, '2016-01-02'),
('SOFIA CHIODEROLI CARVALHO OLIVEIRA', '46749836810', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('FELIPE ANDRE SANHUEZA ROJAS', '30620769840', 'ASSIS', 'M', 3, '1982-01-02'),
('CAMILA EDUARDA DE ABREU', '36827832880', 'PRESIDENTE PRUDENTE', 'F', 26, '2001-01-02'),
('WESLEY FERREIRA DA SILVA SANTOS', '57179509850', 'IACANGA', 'M', 9, '2012-01-02'),
('FRANCISCO GOMES', '11111111111', 'LINS', 'M', 18, '1959-01-02'),
('SOFIA MARANGONI DE SOUZA', '50472370871', 'PENÁPOLIS', 'F', 6, '2015-01-02'),
('ÉLOA MOREIRA DOMINGUES', '56556069841', 'IACANGA', 'F', 9, '2014-01-02'),
('ISABELA NAVARRO TEDESCHI', '45056700827', 'TUPÃ', 'F', 2, '2012-01-02'),
('MARIA EDUARDA POLTRONIERI GOMES DE PAULO', '50457627883', 'GUAIÇARA/SP', 'F', 16, '2015-01-02'),
('JULIA CRUZ URBANO', '48665870830', 'JAÚ', 'F', 19, '2013-01-02'),
('ISABELLE GERALDO CILENTO', '11479855456', 'MANAUS - AM', 'F', 15, '2002-01-02'),
('SARAH RODRIGUES DE SOUSA', '54178149890', 'PENÁPOLIS', 'F', 10, '2018-01-02'),
('DAVI FERREIRA CANO', '50450091848', 'LINS', 'M', 27, '2015-01-02'),
('ANA HELENA LUCATTO MURATA', '11984999800', 'MARÍLIA', 'F', 7, '2011-01-02'),
('LAVÍNIA MORAES WOLF LIMA', '48164147893', 'ASSIS', 'F', 3, '2013-01-02'),
('BEATRIZ RIBEIRO BURGHETII', '53336814812', 'CAFELANDIA', 'F', 'NULL', '2017-08-08'),
('PEDRO SABARANSKI NETO ', '11111111111', 'LINS ', 'M', 11, '2014-01-02'),
('AMANDA DIAS FONSECA DE SOUZA', '52332811800', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('ISIS NEVES CAVALCANTE JORGE CUNHA', '15261122643', 'PENÁPOLIS', 'F', 6, '2014-01-02'),
('LUIZ OTAVIOMONTEIRO', '11111111111', 'LINS', 'M', 18, '1986-01-02'),
('ISABELLI GARCIA CORDEIRO', '59424244894', 'PENAPOLIS', 'F', 10, '2016-01-02'),
('KAUANI LUIZA MAGAINE CARDOSO', '55449240821', 'PENÁPOLIS', 'F', 10, '2015-01-02'),
('LIVIA FONSECA', '53496165871', 'LENÇÓIS PAULISTA', 'F', 5, '2012-01-02'),
('GABRIEL DOS SANTOS SILVA', '49797228819', 'CATANDUVA', 'M', 20, '2012-01-02'),
('OTAVIO REDIVO OLIVEIRA', '11445522111', 'PRESIDENTE PRUDENTE', 'M', 26, '2005-01-02'),
('ARTHUR RODRIGUES SEBASTIÃO', '50567528822', 'CATANDUVA', 'M', 20, '2013-01-02'),
('LÍVIA PEREIRA DE OLIVEIRA', '42383892807', 'CAMPINAS - SP', 'F', 15, '2003-01-02'),
('MANUELA MARTELO SOARES SILVA', '47799702885', 'PENÁPOLIS', 'F', 6, '2013-01-02'),
('CLARA DE OLIVEIRA PEDROLA', '51700619861', 'JAÚ', 'F', 19, '2011-01-02'),
('ESHILEY BEATRIZ SILVA DOS SANTOS', '54838518897', 'IACANGA', 'F', 9, '2010-01-02'),
('VITOR FERREIRA VOLICH', '56286607870', 'BOTUCATU', 'M', 4, '2010-01-02'),
('JOAO LUCAS AMARAL MENDES', '50890941874', 'LINS', 'M', 27, '2015-01-02'),
('PEDRO HENRIQUE DE ROSSI ALCÂNTARA ', '39359102822', 'PARAGUAÇU PAULISTA', 'M', 31, '2006-01-02'),
('BERNARDO RODRIGUES MELFA', '49084319818', 'ASSIS', 'M', 3, '2013-01-02'),
('MARIA EDUARDA ZAMBROZI PASSARI', '58288181805', 'PENÁPOLIS', 'F', 6, '2020-01-02'),
('LEONARDO BEN HUR OLIVEIRA ARAUJO', '43038467839', 'PENAPOLIS', 'M', 10, '2009-01-02'),
('ANA LUÍZA FREIRE POSSIDÔNIO', '48363458805', 'ASSIS', 'F', 3, '2014-01-02'),
('JOÃO LUCAS ARARIPE SUCUPIRA MELLO DA SILVA', '53336309840', 'PENÁPOLIS', 'M', 6, '2017-01-02'),
('VITOR NAVARRO TEDESCHI', '46922438809', 'TUPÃ', 'M', 2, '2013-01-02'),
('ESTEVAM ROGÉRIO DA SILVA', '21542338808', 'JAÚ', 'M', 19, '1977-01-02'),
('VIVIAN AZEVEDO OLIVA', '52984004850', 'ASSIS', 'F', 3, '2015-01-02'),
('ITALO VIEIRA CEZÁRIO', '11111111111', 'MARILIA', 'M', 7, '2015-01-02'),
('MARIA SOPHIA FERREIRA PANÇA ', '52764720840', 'PENÁPOLIS', 'F', 6, '2017-01-02'),
('MARIA LUZ CHUFFI MIGUEL', '49801664827', 'PENAPOLIS', 'F', 10, '2014-01-02'),
('MILENA DE PAULA SALVADOR', '56913533810', 'IACANGA', 'F', 9, '2014-01-02'),
('LEANDRO SANCHES DOS SANTOS', '58179498816', 'IACANGA', 'M', 9, '2020-01-02'),
('MARIA LUIZA VILLAR DINIZ', '58074533875', 'MARÍLIA', 'F', 7, '2011-01-02'),
('JOSÉ NETO LOPES DAMASIO', '49675447893', 'ASSIS', 'M', 3, '2015-01-02'),
('GABRIEL BERGER MENDES', '48415865805', 'SÃO PAULO - SP', 'M', 15, '2002-01-02'),
('VICTOR RAPHAEL LOPES ARAUJO', '52416620819', 'JAÚ', 'M', 19, '2010-01-02'),
('GIOVANA ALEXANDRE DA SILVA', '49912744861', 'CATANDUVA', 'F', 20, '2011-01-02'),
('MATHEUS PARRA SANTOS SILVA', '44148152825', 'IACANGA', 'M', 9, '2009-01-02'),
('BEATRIZ RAMOS DE SOUZA', '45761451859', 'CATANDUVA', 'F', 20, '2012-01-02'),
('HIGOR PARTEZANE GARCIA', '41871013810', 'MARILIA', 'M', 7, '1995-01-02'),
('LAIS MARIA SALZEDAS', '48963301885', 'MARILIA', 'F', 7, '1999-01-02'),
('ENZO DE MELO FAVERO', '48179015866', 'BOTUCATU', 'M', 4, '2010-01-02'),
('LUIS FELIPE BALSI DE OLIVEIRA', '48309941854', 'LENÇÓIS PAULISTA', 'M', 5, '2003-01-02'),
('CAIO CESAR MARCONDES DE GODOY', '42426532807', 'GUAIÇARA/SP', 'M', 16, '1998-01-02'),
('LIVIA CAROLINE DE GODOY', '49716156871', 'LENÇÓIS PAULISTA', 'F', 5, '2007-01-02'),
('ENZO GABRIEL POLTRONIERI NUNES', '57865225806', 'GUAIÇARA', 'M', 16, '2015-01-02'),
('SARAH MOREIRA', '55956055880', 'LENÇÓIS PAULISTA', 'F', 5, '2013-01-02'),
('ANA CLARA ESTEVAM LEITE', '51335285822', 'ASSIS', 'F', 3, '2008-01-02'),
('JOÃO LUCAS DOS SONTOS SOUZA', '50554594846', 'TUPÃ', 'M', 2, '2007-01-02'),
('GAEL MORENO', '59000892821', 'PENÁPOLIS', 'M', 10, '2020-01-02'),
('RIO DE REZENDE BARBOSA', '58005507860', 'ASSIS', 'M', 3, '2019-01-02'),
('DIEGO BERTOLI INOCENTI', '50610334859', 'PENÁPOLIS', 'M', 6, '2015-01-02');


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

