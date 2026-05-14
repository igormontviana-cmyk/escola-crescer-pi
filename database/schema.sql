-- ============================================================
-- Sistema Acadêmico - Escola Crescer
-- Script de Criação do Banco de Dados
-- Projeto Integrador - 4º Período Engenharia de Software
-- ============================================================

DROP DATABASE IF EXISTS sistema_academico_completo;
CREATE DATABASE sistema_academico_completo;
USE sistema_academico_completo;

-- ============================================================
-- 1. TABELAS PRINCIPAIS E HERANÇA DE USUÁRIOS
-- ============================================================

-- Tabela pai para todos os usuários (login centralizado)
CREATE TABLE Usuario (
    id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    senha_hash      VARCHAR(255) NOT NULL,
    data_cadastro   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Independente: Disciplina
CREATE TABLE Disciplina (
    id_disciplina       INT AUTO_INCREMENT PRIMARY KEY,
    nome_disciplina     VARCHAR(100) NOT NULL,
    carga_horaria       INT NOT NULL,
    ementa              TEXT
);

-- Tabela Independente: Turma
CREATE TABLE Turma (
    id_turma    INT AUTO_INCREMENT PRIMARY KEY,
    nome_turma  VARCHAR(100) NOT NULL,
    ano_letivo  INT NOT NULL
);

-- Especialização: Professor
CREATE TABLE Professor (
    id_professor    INT PRIMARY KEY,
    titulacao       VARCHAR(50),
    data_admissao   DATE,
    FOREIGN KEY (id_professor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- Especialização: Coordenador
CREATE TABLE Coordenador (
    id_coordenador  INT PRIMARY KEY,
    FOREIGN KEY (id_coordenador) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- Especialização: Aluno (Ligado a uma Turma)
CREATE TABLE Aluno (
    id_aluno        INT PRIMARY KEY,
    matricula       VARCHAR(20) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    id_turma        INT NOT NULL,           -- Relação 1:N: Um aluno pertence a uma turma
    FOREIGN KEY (id_aluno) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_turma) REFERENCES Turma(id_turma)
);

-- ============================================================
-- 2. TABELAS DE PROCESSOS (Avaliação, Frequência, Mensagem)
-- ============================================================

-- Definição da avaliação (a prova em si, criada pelo professor)
CREATE TABLE Avaliacao (
    id_avaliacao    INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(100) NOT NULL,
    data_aplicacao  DATE NOT NULL,
    peso            DECIMAL(3,2) NOT NULL,  -- Ex: 1.50
    id_disciplina   INT NOT NULL,
    FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina)
);

-- Frequência Diária ligada à disciplina
CREATE TABLE Frequencia (
    id_frequencia   INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno        INT NOT NULL,
    id_turma        INT NOT NULL,
    id_disciplina   INT NOT NULL,
    data_aula       DATE NOT NULL,
    status_presenca ENUM('P','F') NOT NULL, -- P=Presente, F=Falta
    FOREIGN KEY (id_aluno)      REFERENCES Aluno(id_aluno),
    FOREIGN KEY (id_turma)      REFERENCES Turma(id_turma),
    FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina)
);

-- Mensagens do sistema
CREATE TABLE Mensagem (
    id_mensagem         INT AUTO_INCREMENT PRIMARY KEY,
    conteudo            TEXT NOT NULL,
    data_hora_postagem  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario          INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- ============================================================
-- 3. TABELAS ASSOCIATIVAS (Relacionamentos N:M)
-- ============================================================

-- Quem dá aula do quê? (Atribuição de aula)
CREATE TABLE Professor_Disciplina (
    id_professor    INT NOT NULL,
    id_disciplina   INT NOT NULL,
    PRIMARY KEY (id_professor, id_disciplina),
    FOREIGN KEY (id_professor)  REFERENCES Professor(id_professor),
    FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina)
);

-- Grade Curricular da Turma
CREATE TABLE Turma_Disciplina (
    id_turma        INT NOT NULL,
    id_disciplina   INT NOT NULL,
    PRIMARY KEY (id_turma, id_disciplina),
    FOREIGN KEY (id_turma)      REFERENCES Turma(id_turma),
    FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina)
);

-- Notas dos alunos nas avaliações
CREATE TABLE Aluno_Avaliacao (
    id_aluno        INT NOT NULL,
    id_avaliacao    INT NOT NULL,
    nota            DECIMAL(5,2),           -- Ex: 10.00
    PRIMARY KEY (id_aluno, id_avaliacao),
    FOREIGN KEY (id_aluno)      REFERENCES Aluno(id_aluno),
    FOREIGN KEY (id_avaliacao)  REFERENCES Avaliacao(id_avaliacao)
);
