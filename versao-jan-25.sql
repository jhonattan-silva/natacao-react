-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema liga_natacao
-- -----------------------------------------------------

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
INSERT INTO equipes (nome) VALUES
('AAEEVA NATAÇÃO'),
('AITEC SANDALUS/NATAÇÃO TUPÃ'),
('ASSIS NATAÇÃO ATC/SEMEA'),
('ASSOCIAÇÃO ATLÉTICA FERROVIÁRIA DE BOTUCATU'),
('CLUBE ESPORTIVO MARIMBONDO'),
('CLUBE PENAPOLENSE/SME PENAPOLIS'),
('DUDU ACQUA CENTER'),
('FITBEM'),
('KINESIS IACANGA'),
('LAGO AZUL PENAPOLIS'),
('LINS COUNTRY CLUB'),
('NATAÇÃO BIRIGUI'),
('NATAÇÃO DUARTINA'),
('NATAÇÃO OURINHOS'),
('NATAÇÃO UNESP BOTUCATU'),
('PREFEITURA DE GUAIÇARA - TRIUNFO/TRANSBRASILIANA'),
('SAÚDE E MOVIMENTO'),
('SECRETARIA DE ESPORTES E LAZER DE LINS'),
('SECRETARIA DE ESPORTES JAÚ'),
('SMEL CATANDUVA'),
('STUDIO MOTA'),
('TARUMÃ NATAÇÃO - PROJETO RAIA 4');


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

