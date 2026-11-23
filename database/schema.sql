CREATE DATABASE IF NOT EXISTS patas_cia
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patas_cia;

CREATE TABLE IF NOT EXISTS tutores (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  telefone  VARCHAR(11)  NOT NULL,          -- somente dígitos (DDD + número)
  email     VARCHAR(120) NULL,
  endereco  VARCHAR(200) NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tutor_telefone (telefone)   -- evita tutor cadastrado em duplicidade
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS animais (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id        INT NOT NULL,
  nome            VARCHAR(80) NOT NULL,
  especie         VARCHAR(30) NOT NULL,
  raca            VARCHAR(60) NULL,
  sexo            ENUM('M','F') NOT NULL,
  data_nascimento DATE NULL,
  observacoes     VARCHAR(255) NULL,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_animal_tutor FOREIGN KEY (tutor_id)
    REFERENCES tutores(id) ON DELETE RESTRICT,  -- segunda barreira contra exclusão
  UNIQUE KEY uq_animal_tutor_nome (tutor_id, nome)
) ENGINE=InnoDB;

-- Agenda de consultas
CREATE TABLE IF NOT EXISTS consultas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  animal_id     INT NOT NULL,
  data_hora     DATETIME NOT NULL,
  motivo        VARCHAR(150) NOT NULL,
  observacoes   VARCHAR(255) NULL,
  status        ENUM('agendada','realizada','cancelada') NOT NULL DEFAULT 'agendada',
  -- só consultas "agendada" ocupam o horário; ao cancelar/realizar o horário é liberado
  horario_ativo DATETIME GENERATED ALWAYS AS (IF(status = 'agendada', data_hora, NULL)) STORED,
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_animal FOREIGN KEY (animal_id)
    REFERENCES animais(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_consulta_horario (horario_ativo),  -- impede duas consultas no mesmo horário
  KEY idx_consulta_data (data_hora)
) ENGINE=InnoDB;
