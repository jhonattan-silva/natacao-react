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
CREATE SCHEMA IF NOT EXISTS `liga_natacao` DEFAULT CHARACTER SET utf8 ;
USE `liga_natacao` ;

-- -----------------------------------------------------
-- Table `liga_natacao`.`Usuarios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cpf` VARCHAR(11) NOT NULL,
  `nome` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(45) NOT NULL,
  `celular` VARCHAR(20) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Equipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Equipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Categorias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Categorias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Nadadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Nadadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(120) NOT NULL,
  `cpf` VARCHAR(11) NOT NULL,
  `data_nasc` DATE NOT NULL,
  `celular` VARCHAR(20) NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  `equipes_id` INT NOT NULL,
  `Categorias_id` INT NULL,
  `ativo` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `fk_Nadadores_Equipes1_idx` (`equipes_id` ASC) VISIBLE,
  INDEX `fk_Nadadores_Categorias1_idx` (`Categorias_id` ASC) VISIBLE,
  CONSTRAINT `fk_Nadadores_Equipes1`
    FOREIGN KEY (`equipes_id`)
    REFERENCES `liga_natacao`.`Equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Nadadores_Categorias1`
    FOREIGN KEY (`Categorias_id`)
    REFERENCES `liga_natacao`.`Categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`RankingNadadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`RankingNadadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pontos` INT NULL,
  `temporada` YEAR NULL,
  `Nadadores_id` INT NOT NULL,
  `Categorias_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_RankingNadadores_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_RankingNadadores_Categorias1_idx` (`Categorias_id` ASC) VISIBLE,
  CONSTRAINT `fk_RankingNadadores_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_RankingNadadores_Categorias1`
    FOREIGN KEY (`Categorias_id`)
    REFERENCES `liga_natacao`.`Categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Torneios`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Torneios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `data_inicio` DATE NOT NULL,
  `data_fim` DATE NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Eventos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Eventos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `data` DATE NOT NULL,
  `cidade` VARCHAR(45) NOT NULL,
  `sede` VARCHAR(45) NULL,
  `endereco` VARCHAR(255) NULL,
  `Torneios_id` INT NOT NULL,
  `inscricao_aberta` TINYINT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `fk_Eventos_Torneios1_idx` (`Torneios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Eventos_Torneios1`
    FOREIGN KEY (`Torneios_id`)
    REFERENCES `liga_natacao`.`Torneios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Noticias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Noticias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `texto` TEXT NOT NULL,
  `titulo` VARCHAR(45) NOT NULL,
  `data` DATE NOT NULL,
  `usuarios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Noticias_Usuarios1_idx` (`usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Noticias_Usuarios1`
    FOREIGN KEY (`usuarios_id`)
    REFERENCES `liga_natacao`.`Usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Provas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Provas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estilo` VARCHAR(45) NOT NULL,
  `distancia` INT NOT NULL,
  `tipo` ENUM('individual', 'revezamento') NOT NULL,
  `sexo` ENUM('M', 'F', 'O') NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Resultados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Resultados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tempo` TIME NULL,
  `pontos` INT NULL,
  `Nadadores_id` INT NOT NULL,
  `Provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Resultados_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_Resultados_Provas1_idx` (`Provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Resultados_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Resultados_Provas1`
    FOREIGN KEY (`Provas_id`)
    REFERENCES `liga_natacao`.`Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`RankingEquipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`RankingEquipes` (
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
    REFERENCES `liga_natacao`.`Equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_RankingEquipes_Categorias1`
    FOREIGN KEY (`Categorias_id`)
    REFERENCES `liga_natacao`.`Categorias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Records`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tempo` TIME NULL,
  `Nadadores_id` INT NOT NULL,
  `Provas_id` INT NOT NULL,
  `Torneios_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Records_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_Records_Provas1_idx` (`Provas_id` ASC) VISIBLE,
  INDEX `fk_Records_Torneios1_idx` (`Torneios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Records_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Records_Provas1`
    FOREIGN KEY (`Provas_id`)
    REFERENCES `liga_natacao`.`Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Records_Torneios1`
    FOREIGN KEY (`Torneios_id`)
    REFERENCES `liga_natacao`.`Torneios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Eventos_Resultados`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Eventos_Resultados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `posicao` INT NULL,
  `pontos` INT NULL,
  `Nadadores_id` INT NOT NULL,
  `Provas_id` INT NOT NULL,
  `Eventos_id` INT NOT NULL,
  PRIMARY KEY (`id`, `Eventos_id`),
  INDEX `fk_EventosResultados_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_EventosResultados_Provas1_idx` (`Provas_id` ASC) VISIBLE,
  INDEX `fk_EventosResultados_Eventos1_idx` (`Eventos_id` ASC) VISIBLE,
  CONSTRAINT `fk_EventosResultados_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_EventosResultados_Provas1`
    FOREIGN KEY (`Provas_id`)
    REFERENCES `liga_natacao`.`Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_EventosResultados_Eventos1`
    FOREIGN KEY (`Eventos_id`)
    REFERENCES `liga_natacao`.`Eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Perfis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Perfis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `descricao` VARCHAR(45) NOT NULL,
  `data_criacao` TIMESTAMP NULL,
  `data_atualizacao` TIMESTAMP NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Usuarios_perfis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Usuarios_perfis` (
  `Perfis_id` INT NOT NULL,
  `Usuarios_id` INT NOT NULL,
  PRIMARY KEY (`Perfis_id`, `Usuarios_id`),
  INDEX `fk_Perfis_has_Usuarios_Usuarios1_idx` (`Usuarios_id` ASC) VISIBLE,
  INDEX `fk_Perfis_has_Usuarios_Perfis1_idx` (`Perfis_id` ASC) VISIBLE,
  CONSTRAINT `fk_Perfis_has_Usuarios_Perfis1`
    FOREIGN KEY (`Perfis_id`)
    REFERENCES `liga_natacao`.`Perfis` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Perfis_has_Usuarios_Usuarios1`
    FOREIGN KEY (`Usuarios_id`)
    REFERENCES `liga_natacao`.`Usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Usuarios_equipes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Usuarios_equipes` (
  `Usuarios_id` INT NOT NULL,
  `Equipes_id` INT NOT NULL,
  PRIMARY KEY (`Usuarios_id`, `Equipes_id`),
  INDEX `fk_Usuarios_has_Equipes_Equipes1_idx` (`Equipes_id` ASC) VISIBLE,
  INDEX `fk_Usuarios_has_Equipes_Usuarios1_idx` (`Usuarios_id` ASC) VISIBLE,
  CONSTRAINT `fk_Usuarios_has_Equipes_Usuarios1`
    FOREIGN KEY (`Usuarios_id`)
    REFERENCES `liga_natacao`.`Usuarios` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Usuarios_has_Equipes_Equipes1`
    FOREIGN KEY (`Equipes_id`)
    REFERENCES `liga_natacao`.`Equipes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Permissoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Permissoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `descricao` TEXT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Perfis_Permissoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Perfis_Permissoes` (
  `Perfis_id` INT NOT NULL,
  `Permissoes_id` INT NOT NULL,
  PRIMARY KEY (`Perfis_id`, `Permissoes_id`),
  INDEX `fk_Perfis_has_Permissoes_Permissoes1_idx` (`Permissoes_id` ASC) VISIBLE,
  INDEX `fk_Perfis_has_Permissoes_Perfis1_idx` (`Perfis_id` ASC) VISIBLE,
  CONSTRAINT `fk_Perfis_has_Permissoes_Perfis1`
    FOREIGN KEY (`Perfis_id`)
    REFERENCES `liga_natacao`.`Perfis` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Perfis_has_Permissoes_Permissoes1`
    FOREIGN KEY (`Permissoes_id`)
    REFERENCES `liga_natacao`.`Permissoes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Baterias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Baterias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descricao` VARCHAR(45) NULL,
  `Eventos_id` INT NOT NULL,
  `TipoProvas_id` INT NOT NULL,
  `Nadadores_id` INT NOT NULL,
  `Provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Baterias_Eventos1_idx` (`Eventos_id` ASC) VISIBLE,
  INDEX `fk_Baterias_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_Baterias_Provas1_idx` (`Provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Baterias_Eventos1`
    FOREIGN KEY (`Eventos_id`)
    REFERENCES `liga_natacao`.`Eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_Provas1`
    FOREIGN KEY (`Provas_id`)
    REFERENCES `liga_natacao`.`Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Eventos_Provas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Eventos_Provas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `Eventos_id` INT NOT NULL,
  `Provas_id` INT NOT NULL,
  INDEX `fk_Eventos_has_Provas_Provas1_idx` (`Provas_id` ASC) VISIBLE,
  INDEX `fk_Eventos_has_Provas_Eventos1_idx` (`Eventos_id` ASC) VISIBLE,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_Eventos_has_Provas_Eventos1`
    FOREIGN KEY (`Eventos_id`)
    REFERENCES `liga_natacao`.`Eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Eventos_has_Provas_Provas1`
    FOREIGN KEY (`Provas_id`)
    REFERENCES `liga_natacao`.`Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Inscricoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Inscricoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `Nadadores_id` INT NOT NULL,
  `Eventos_id` INT NOT NULL,
  `Eventos_Provas_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_Inscricoes_Nadadores1_idx` (`Nadadores_id` ASC) VISIBLE,
  INDEX `fk_Inscricoes_Eventos1_idx` (`Eventos_id` ASC) VISIBLE,
  INDEX `fk_Inscricoes_Eventos_Provas1_idx` (`Eventos_Provas_id` ASC) VISIBLE,
  CONSTRAINT `fk_Inscricoes_Nadadores1`
    FOREIGN KEY (`Nadadores_id`)
    REFERENCES `liga_natacao`.`Nadadores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Inscricoes_Eventos1`
    FOREIGN KEY (`Eventos_id`)
    REFERENCES `liga_natacao`.`Eventos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Inscricoes_Eventos_Provas1`
    FOREIGN KEY (`Eventos_Provas_id`)
    REFERENCES `liga_natacao`.`Eventos_Provas` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `liga_natacao`.`Baterias_Inscricoes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `liga_natacao`.`Baterias_Inscricoes` (
  `Baterias_id` INT NOT NULL,
  `Inscricoes_id` INT NOT NULL,
  `piscina` VARCHAR(45) NOT NULL,
  `raia` INT NOT NULL,
  PRIMARY KEY (`Baterias_id`, `Inscricoes_id`),
  INDEX `fk_Baterias_has_Inscricoes_Inscricoes1_idx` (`Inscricoes_id` ASC) VISIBLE,
  INDEX `fk_Baterias_has_Inscricoes_Baterias1_idx` (`Baterias_id` ASC) VISIBLE,
  CONSTRAINT `fk_Baterias_has_Inscricoes_Baterias1`
    FOREIGN KEY (`Baterias_id`)
    REFERENCES `liga_natacao`.`Baterias` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Baterias_has_Inscricoes_Inscricoes1`
    FOREIGN KEY (`Inscricoes_id`)
    REFERENCES `liga_natacao`.`Inscricoes` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
