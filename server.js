const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MySQL Pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'senai',
  database: 'chefsaep',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de Upload de Imagens com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'receitas');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receita_' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem inválido. Formatos aceitos: JPG, JPEG, PNG, GIF e WEBP.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Servir arquivos estáticos da aplicação
app.use('/receitas', express.static(path.join(__dirname, 'receitas')));
app.use('/imagens_usuarios', express.static(path.join(__dirname, 'imagens_usuarios')));
app.use('/icones', express.static(path.join(__dirname, 'icones')));
app.use('/fonte', express.static(path.join(__dirname, 'fonte')));
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// ROTAS DA API
// -------------------------------------------------------------

// 1. Autenticação (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ erro: 'E-mail inválido ou vazio' });
    }

    if (!senha || !senha.trim()) {
      return res.status(400).json({ erro: 'A senha é obrigatória e não pode estar vazia' });
    }

    const [rows] = await pool.query(
      `SELECT id_usuario, nome, nome_usuario, email, imagem_usuario, tipo 
       FROM tb_usuario 
       WHERE email = ? AND senha = ?`,
      [email.trim(), senha.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário não encontrado ou senha incorreta' });
    }

    const usuario = rows[0];
    return res.json({ sucesso: true, usuario });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// 2. Listagem de Receitas (Mural Principal + Busca)
app.get('/api/receitas', async (req, res) => {
  try {
    const { chef, id_usuario } = req.query;
    const userId = id_usuario ? parseInt(id_usuario, 10) : 0;

    let queryConditions = '';
    const queryParams = [userId];

    if (chef && chef.trim()) {
      let cleanChef = chef.trim();
      if (cleanChef.startsWith('@')) {
        cleanChef = cleanChef.substring(1);
      }

      // Validar se o chef existe
      const [chefsEncontrados] = await pool.query(
        `SELECT id_usuario, nome, nome_usuario FROM tb_usuario 
         WHERE tipo = 'chef' AND (LOWER(nome_usuario) = LOWER(?) OR LOWER(nome) LIKE LOWER(?))`,
        [cleanChef, `%${cleanChef}%`]
      );

      if (chefsEncontrados.length === 0) {
        return res.json({
          encontrado: false,
          mensagem: 'Chef não encontrado',
          receitas: []
        });
      }

      queryConditions = `WHERE (LOWER(u.nome_usuario) = LOWER(?) OR LOWER(u.nome) LIKE LOWER(?))`;
      queryParams.push(cleanChef, `%${cleanChef}%`);
    }

    const sql = `
      SELECT 
        r.id_receita,
        r.titulo_receita,
        r.origem_receita,
        r.url_imagem,
        r.id_usuario,
        u.nome AS autor_nome,
        u.nome_usuario AS autor_username,
        u.imagem_usuario AS autor_imagem,
        COUNT(DISTINCT f.id_favorito) AS total_favoritos,
        MAX(CASE WHEN f.id_usuario = ? THEN 1 ELSE 0 END) AS favoritado
      FROM tb_receita r
      INNER JOIN tb_usuario u ON r.id_usuario = u.id_usuario
      LEFT JOIN tb_favoritar f ON r.id_receita = f.id_receita
      ${queryConditions}
      GROUP BY r.id_receita, r.titulo_receita, r.origem_receita, r.url_imagem, r.id_usuario, u.nome, u.nome_usuario, u.imagem_usuario
      ORDER BY r.id_receita DESC
    `;

    const [receitas] = await pool.query(sql, queryParams);

    return res.json({
      encontrado: true,
      receitas
    });
  } catch (error) {
    console.error('Erro ao listar receitas:', error);
    return res.status(500).json({ erro: 'Erro ao carregar receitas' });
  }
});

// 3. Interação de Favoritar / Desfavoritar Receita
app.post('/api/favoritos/toggle', async (req, res) => {
  try {
    const { id_usuario, id_receita } = req.body;

    if (!id_usuario || !id_receita) {
      return res.status(400).json({ erro: 'Usuário e receita são obrigatórios' });
    }

    // Verificar se já está favoritado
    const [existente] = await pool.query(
      `SELECT id_favorito FROM tb_favoritar WHERE id_usuario = ? AND id_receita = ?`,
      [id_usuario, id_receita]
    );

    let favoritado = false;

    if (existente.length > 0) {
      // Remover favorito
      await pool.query(
        `DELETE FROM tb_favoritar WHERE id_usuario = ? AND id_receita = ?`,
        [id_usuario, id_receita]
      );
      favoritado = false;
    } else {
      // Inserir favorito
      await pool.query(
        `INSERT INTO tb_favoritar (id_usuario, id_receita) VALUES (?, ?)`,
        [id_usuario, id_receita]
      );
      favoritado = true;
    }

    // Obter novo total de favoritos da receita
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tb_favoritar WHERE id_receita = ?`,
      [id_receita]
    );

    const novoTotal = totalRows[0].total;

    return res.json({
      sucesso: true,
      favoritado,
      total_favoritos: novoTotal
    });
  } catch (error) {
    console.error('Erro ao favoritar/desfavoritar:', error);
    return res.status(500).json({ erro: 'Erro ao processar favorito' });
  }
});

// 4. Obter Estatísticas do Chef (Menu Lateral)
app.get('/api/chef/:id/estatisticas', async (req, res) => {
  try {
    const chefId = parseInt(req.params.id, 10);

    const [receitasCount] = await pool.query(
      `SELECT COUNT(*) AS total_receitas FROM tb_receita WHERE id_usuario = ?`,
      [chefId]
    );

    const [favoritosCount] = await pool.query(
      `SELECT COUNT(f.id_favorito) AS total_favoritos 
       FROM tb_receita r 
       INNER JOIN tb_favoritar f ON r.id_receita = f.id_receita 
       WHERE r.id_usuario = ?`,
      [chefId]
    );

    return res.json({
      total_receitas: receitasCount[0].total_receitas || 0,
      total_favoritos: favoritosCount[0].total_favoritos || 0
    });
  } catch (error) {
    console.error('Erro ao carregar estatísticas do chef:', error);
    return res.status(500).json({ erro: 'Erro ao carregar estatísticas' });
  }
});

// 5. Obter Receitas do Chef Logado ("Suas receitas")
app.get('/api/chef/:id/receitas', async (req, res) => {
  try {
    const chefId = parseInt(req.params.id, 10);

    const [receitas] = await pool.query(
      `SELECT id_receita, titulo_receita, origem_receita, url_imagem, created_at 
       FROM tb_receita 
       WHERE id_usuario = ? 
       ORDER BY id_receita DESC`,
      [chefId]
    );

    return res.json({ receitas });
  } catch (error) {
    console.error('Erro ao buscar receitas do chef:', error);
    return res.status(500).json({ erro: 'Erro ao carregar receitas do chef' });
  }
});

// 6. Cadastrar Nova Receita
app.post('/api/receitas', upload.single('imagem'), async (req, res) => {
  try {
    const { titulo_receita, origem_receita, id_usuario } = req.body;

    const erros = {};
    if (!titulo_receita || !titulo_receita.trim()) {
      erros.titulo = 'O título da receita é obrigatório';
    }
    if (!origem_receita || !origem_receita.trim()) {
      erros.origem = 'A origem da receita é obrigatória';
    }
    if (!req.file) {
      erros.imagem = 'A imagem da receita é obrigatória';
    }

    if (Object.keys(erros).length > 0) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ erros });
    }

    const chefId = parseInt(id_usuario, 10);
    const nomeImagem = req.file.filename;

    const [result] = await pool.query(
      `INSERT INTO tb_receita (titulo_receita, origem_receita, id_usuario, url_imagem) 
       VALUES (?, ?, ?, ?)`,
      [titulo_receita.trim(), origem_receita.trim(), chefId, nomeImagem]
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Receita cadastrada com sucesso',
      id_receita: result.insertId,
      receita: {
        id_receita: result.insertId,
        titulo_receita: titulo_receita.trim(),
        origem_receita: origem_receita.trim(),
        id_usuario: chefId,
        url_imagem: nomeImagem
      }
    });
  } catch (error) {
    console.error('Erro ao cadastrar receita:', error);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ erro: error.message || 'Erro ao cadastrar receita' });
  }
});

// 7. Excluir Receita
app.delete('/api/receitas/:id', async (req, res) => {
  try {
    const idReceita = parseInt(req.params.id, 10);
    const { id_usuario } = req.body;

    // Buscar imagem da receita para remover se foi criada por upload
    const [rows] = await pool.query(
      `SELECT url_imagem, id_usuario FROM tb_receita WHERE id_receita = ?`,
      [idReceita]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Receita não encontrada' });
    }

    // Se id_usuario for fornecido, checar permissão
    if (id_usuario && rows[0].id_usuario !== parseInt(id_usuario, 10)) {
      return res.status(403).json({ erro: 'Sem permissão para excluir esta receita' });
    }

    const imagemPath = path.join(__dirname, 'receitas', rows[0].url_imagem);

    // Deletar da base (as chaves estrangeiras em tb_favoritar com ON DELETE CASCADE removem os favoritos)
    await pool.query(`DELETE FROM tb_receita WHERE id_receita = ?`, [idReceita]);

    // Remover arquivo se for upload recente e existir
    if (rows[0].url_imagem.startsWith('receita_') && fs.existsSync(imagemPath)) {
      fs.unlink(imagemPath, () => {});
    }

    return res.json({ sucesso: true, mensagem: 'Receita excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    return res.status(500).json({ erro: 'Erro ao excluir receita' });
  }
});

// Redirecionamento padrão para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Servidor ChefSaep rodando com sucesso na porta ${PORT}: http://localhost:${PORT}`);
});
