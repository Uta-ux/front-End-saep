-- Criação do banco de dados ChefSaep
CREATE DATABASE IF NOT EXISTS chefsaep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chefsaep;

-- Tabela de Usuários (tb_usuario)
DROP TABLE IF EXISTS tb_favoritar;
DROP TABLE IF EXISTS tb_receita;
DROP TABLE IF EXISTS tb_usuario;

CREATE TABLE tb_usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nome_usuario VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    imagem_usuario VARCHAR(255) NOT NULL,
    tipo ENUM('chef', 'comum') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Receitas (tb_receita)
CREATE TABLE tb_receita (
    id_receita INT AUTO_INCREMENT PRIMARY KEY,
    titulo_receita VARCHAR(255) NOT NULL,
    origem_receita VARCHAR(255) NOT NULL,
    id_usuario INT NOT NULL,
    url_imagem VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_receita_usuario FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Favoritos (tb_favoritar)
CREATE TABLE tb_favoritar (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_receita INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorito_usuario FOREIGN KEY (id_usuario) REFERENCES tb_usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_favorito_receita FOREIGN KEY (id_receita) REFERENCES tb_receita(id_receita) ON DELETE CASCADE,
    CONSTRAINT uq_usuario_receita UNIQUE (id_usuario, id_receita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserção de dados dos usuários (importados de tb_usuario.csv)
INSERT INTO tb_usuario (id_usuario, nome, nome_usuario, email, senha, imagem_usuario, tipo, created_at, updated_at) VALUES
(1, 'Chef Marco Bianchi', 'chef1', 'chef1@saepchef.com', '123456', 'chef1.jpg', 'chef', '2026-01-10 09:15:00', '2026-01-10 09:15:00'),
(2, 'Chef Ana Ferreira', 'chef2', 'chef2@saepchef.com', '123456', 'chef2.jpg', 'chef', '2026-01-12 10:30:00', '2026-01-12 10:30:00'),
(3, 'Chef Lucas Tanaka', 'chef3', 'chef3@saepchef.com', '123456', 'chef3.jpg', 'chef', '2026-01-14 14:20:00', '2026-01-14 14:20:00'),
(4, 'Mariana Costa', 'usuario1', 'usuario1@gmail.com', '123456', 'usuario1.jpg', 'comum', '2026-01-16 08:45:00', '2026-01-16 08:45:00'),
(5, 'Rafael Souza', 'usuario2', 'usuario2@gmail.com', '123456', 'usuario2.jpg', 'comum', '2026-01-18 11:00:00', '2026-01-18 11:00:00'),
(6, 'Beatriz Lima', 'usuario3', 'usuario3@gmail.com', '123456', 'usuario3.jpg', 'comum', '2026-01-20 16:10:00', '2026-01-20 16:10:00');

-- Inserção inicial das receitas anexadas
INSERT INTO tb_receita (id_receita, titulo_receita, origem_receita, id_usuario, url_imagem, created_at, updated_at) VALUES
(1, 'Risoto de Funghi', 'Itália', 1, 'receita1.jpg', '2026-01-22 10:00:00', '2026-01-22 10:00:00'),
(2, 'Espaguete à Bolonhesa', 'Itália', 1, 'receita2.jpg', '2026-01-23 11:30:00', '2026-01-23 11:30:00'),
(3, 'Lasanha Tradicional', 'Itália', 1, 'receita3.jpg', '2026-01-24 12:45:00', '2026-01-24 12:45:00'),
(4, 'Bacalhau à Brás', 'Portugal', 2, 'receita4.jpg', '2026-01-25 13:15:00', '2026-01-25 13:15:00'),
(5, 'Feijoada Completa', 'Brasil', 2, 'receita5.jpg', '2026-01-26 14:00:00', '2026-01-26 14:00:00'),
(6, 'Moqueca Baiana', 'Brasil', 2, 'receita6.jpg', '2026-01-27 15:20:00', '2026-01-27 15:20:00'),
(7, 'Ramen Tradicional', 'Japão', 3, 'receita7.jpg', '2026-01-28 18:30:00', '2026-01-28 18:30:00'),
(8, 'Sushi e Sashimi Variados', 'Japão', 3, 'receita8.jpg', '2026-01-29 19:40:00', '2026-01-29 19:40:00'),
(9, 'Yakissoba Especial', 'Japão', 3, 'receita9.jpg', '2026-01-30 20:10:00', '2026-01-30 20:10:00');

-- Inserção de favoritos de demonstração
INSERT INTO tb_favoritar (id_usuario, id_receita, created_at, updated_at) VALUES
(4, 1, '2026-02-01 10:00:00', '2026-02-01 10:00:00'),
(5, 1, '2026-02-02 11:15:00', '2026-02-02 11:15:00'),
(6, 1, '2026-02-03 12:30:00', '2026-02-03 12:30:00'),
(4, 4, '2026-02-04 14:00:00', '2026-02-04 14:00:00'),
(5, 5, '2026-02-05 15:20:00', '2026-02-05 15:20:00'),
(6, 7, '2026-02-06 16:45:00', '2026-02-06 16:45:00'),
(4, 8, '2026-02-07 17:10:00', '2026-02-07 17:10:00');
