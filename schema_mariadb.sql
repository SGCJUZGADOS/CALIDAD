-- Esquema Sugerido para Migración a MariaDB / MySQL
-- Este esquema replica la lógica actual de Firebase pero en formato relacional.

CREATE DATABASE IF NOT EXISTS sgc_envigado;
USE sgc_envigado;

-- 1. Tabla de Juzgados
CREATE TABLE juzgados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    usuario_id VARCHAR(50) -- Relación lógica con el login
);

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'radicador', 'radicador_tutelas', 'radicador_demandas', 'admin') DEFAULT 'user',
    juzgado_id INT,
    email VARCHAR(255),
    aplica_vacancia BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (juzgado_id) REFERENCES juzgados(id)
);

-- 3. Tabla Maestra de Tutelas
CREATE TABLE tutelas (
    radicado VARCHAR(23) PRIMARY KEY, -- 23 dígitos
    fecha_reparto DATE,
    accionante VARCHAR(255),
    id_accionante VARCHAR(50),
    accionado VARCHAR(255),
    id_accionado VARCHAR(50),
    juzgado_id INT,
    asignado_a VARCHAR(100),
    ingreso VARCHAR(100), -- Reparto, Competencia, etc.
    derecho VARCHAR(100),
    genero VARCHAR(10),
    
    -- Fechas de Seguimiento
    notificacion_fallo DATE,
    decision VARCHAR(100),
    fecha_limite_impugnacion DATE,
    impugno VARCHAR(10), -- SI/NO
    cumplio VARCHAR(10), -- SÍ/NO/PENDIENTE
    observaciones TEXT,
    
    -- Metadatos
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(50),
    
    FOREIGN KEY (juzgado_id) REFERENCES juzgados(id)
);

-- 4. Tabla de Contadores (Estadísticas rápidas)
CREATE TABLE global_stats (
    key_name VARCHAR(50) PRIMARY KEY, -- total_tutelas, total_demandas
    total_count INT DEFAULT 0
);

-- Índices para búsqueda rápida
CREATE INDEX idx_tutela_juzgado ON tutelas(juzgado_id);
CREATE INDEX idx_tutela_fecha ON tutelas(fecha_reparto);
CREATE INDEX idx_tutela_accionante ON tutelas(accionante);
