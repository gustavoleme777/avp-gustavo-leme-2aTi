import express from "express";
import dotenv from "dotenv";
import logger from "./middleware/logger.js";
import auth from "./middleware/auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(logger);
app.use(express.json());

// =========================
// DADOS EM MEMÓRIA
// =========================

const times = [
  { id: 1, nome: "Flamengo", cidade: "Rio de Janeiro", titulos: 8 },
  { id: 2, nome: "Palmeiras", cidade: "Sao Paulo", titulos: 12 },
  { id: 3, nome: "Santos", cidade: "Santos", titulos: 8 },
  { id: 4, nome: "Corinthians", cidade: "Sao Paulo", titulos: 7 }
];

const partidas = [
  {
    id: 1,
    mandante: "Flamengo",
    visitante: "Palmeiras",
    golsMandante: 2,
    golsVisitante: 1,
    data: "2026-09-10"
  },
  {
    id: 2,
    mandante: "Santos",
    visitante: "Corinthians",
    golsMandante: 0,
    golsVisitante: 0,
    data: "2026-09-11"
  }
];

const usuarios = [];

// =========================
// ROTA INICIAL
// =========================

app.get("/", (req, res) => {
  res.json({
    mensagem: "API de futebol funcionando!",
    endpoints: [
      "/times",
      "/times/:id",
      "/partidas",
      "POST /times",
      "POST /partidas",
      "POST /usuarios",
      "POST /login",
      "POST /upload",
      "GET /api-docs"
    ]
  });
});

// =========================
// USUÁRIOS
// =========================

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        mensagem: "Nome, email e senha sao obrigatorios"
      });
    }

    const usuarioExistente = usuarios.find(
      (usuario) => usuario.email === email
    );

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: "Email ja cadastrado"
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = {
      id: usuarios.length + 1,
      nome,
      email,
      senha: senhaCriptografada
    };

    usuarios.push(novoUsuario);

    res.status(201).json({
      mensagem: "Usuario cadastrado com sucesso",
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email
      }
    });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro ao cadastrar usuario"
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        mensagem: "Email e senha sao obrigatorios"
      });
    }

    const usuario = usuarios.find(
      (usuario) => usuario.email === email
    );

    if (!usuario) {
      return res.status(401).json({
        mensagem: "Email ou senha incorretos"
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "Email ou senha incorretos"
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.json({
      mensagem: "Login realizado com sucesso",
      token
    });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro ao realizar login"
    });
  }
});

// =========================
// TIMES - CRUD PROTEGIDO
// =========================

/**
 * @swagger
 * /times:
 *   get:
 *     summary: Lista todos os times
 *     responses:
 *       200:
 *         description: Lista de times
 */
app.get("/times", auth, (req, res) => {
  res.json(times);
});

/**
 * @swagger
 * /times/{id}:
 *   get:
 *     summary: Busca um time pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time encontrado
 *       404:
 *         description: Time nao encontrado
 */
app.get("/times/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  const time = times.find((time) => time.id === id);

  if (!time) {
    return res.status(404).json({
      mensagem: "Time nao encontrado"
    });
  }

  res.json(time);
});

/**
 * @swagger
 * /times:
 *   post:
 *     summary: Cadastra um novo time
 *     responses:
 *       201:
 *         description: Time cadastrado com sucesso
 */
app.post("/times", auth, (req, res) => {
  const { nome, cidade, titulos = 0 } = req.body;

  if (!nome || !cidade) {
    return res.status(400).json({
      mensagem: "Nome e cidade sao obrigatorios"
    });
  }

  const novoTime = {
    id: times.length > 0
      ? Math.max(...times.map((time) => time.id)) + 1
      : 1,
    nome,
    cidade,
    titulos: Number(titulos)
  };

  times.push(novoTime);

  res.status(201).json({
    mensagem: "Time cadastrado com sucesso",
    time: novoTime
  });
});

/**
 * @swagger
 * /times/{id}:
 *   put:
 *     summary: Atualiza um time
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time atualizado com sucesso
 *       404:
 *         description: Time nao encontrado
 */
app.put("/times/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  const time = times.find((time) => time.id === id);

  if (!time) {
    return res.status(404).json({
      mensagem: "Time nao encontrado"
    });
  }

  const { nome, cidade, titulos } = req.body;

  if (nome !== undefined) time.nome = nome;
  if (cidade !== undefined) time.cidade = cidade;
  if (titulos !== undefined) time.titulos = Number(titulos);

  res.json({
    mensagem: "Time atualizado com sucesso",
    time
  });
});

/**
 * @swagger
 * /times/{id}:
 *   delete:
 *     summary: Exclui um time
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time excluido com sucesso
 *       404:
 *         description: Time nao encontrado
 */
app.delete("/times/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  const indice = times.findIndex(
    (time) => time.id === id
  );

  if (indice === -1) {
    return res.status(404).json({
      mensagem: "Time nao encontrado"
    });
  }

  const timeRemovido = times.splice(indice, 1);

  res.json({
    mensagem: "Time excluido com sucesso",
    time: timeRemovido[0]
  });
});

// =========================
// PARTIDAS - CRUD PROTEGIDO
// =========================

/**
 * @swagger
 * /partidas:
 *   get:
 *     summary: Lista todas as partidas
 *     responses:
 *       200:
 *         description: Lista de partidas
 */
app.get("/partidas", auth, (req, res) => {
  res.json(partidas);
});

/**
 * @swagger
 * /partidas:
 *   post:
 *     summary: Cadastra uma nova partida
 *     responses:
 *       201:
 *         description: Partida cadastrada com sucesso
 */
app.post("/partidas", auth, (req, res) => {
  const {
    mandante,
    visitante,
    golsMandante = 0,
    golsVisitante = 0,
    data
  } = req.body;

  if (!mandante || !visitante || !data) {
    return res.status(400).json({
      mensagem: "Mandante, visitante e data sao obrigatorios"
    });
  }

  const novaPartida = {
    id: partidas.length > 0
      ? Math.max(...partidas.map((partida) => partida.id)) + 1
      : 1,
    mandante,
    visitante,
    golsMandante: Number(golsMandante),
    golsVisitante: Number(golsVisitante),
    data
  };

  partidas.push(novaPartida);

  res.status(201).json({
    mensagem: "Partida cadastrada com sucesso",
    partida: novaPartida
  });
});

/**
 * @swagger
 * /partidas/{id}:
 *   put:
 *     summary: Atualiza uma partida
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Partida atualizada com sucesso
 *       404:
 *         description: Partida nao encontrada
 */
app.put("/partidas/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  const partida = partidas.find(
    (partida) => partida.id === id
  );

  if (!partida) {
    return res.status(404).json({
      mensagem: "Partida nao encontrada"
    });
  }

  const {
    mandante,
    visitante,
    golsMandante,
    golsVisitante,
    data
  } = req.body;

  if (mandante !== undefined) partida.mandante = mandante;
  if (visitante !== undefined) partida.visitante = visitante;

  if (golsMandante !== undefined) {
    partida.golsMandante = Number(golsMandante);
  }

  if (golsVisitante !== undefined) {
    partida.golsVisitante = Number(golsVisitante);
  }

  if (data !== undefined) partida.data = data;

  res.json({
    mensagem: "Partida atualizada com sucesso",
    partida
  });
});
/**
 * @swagger
 * /partidas/{id}:
 *   delete:
 *     summary: Exclui uma partida
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Partida excluida com sucesso
 *       404:
 *         description: Partida nao encontrada
 */
app.delete("/partidas/:id"
, auth, (req, res) => {
  const id = Number(req.params.id);

  const indice = partidas.findIndex(
    (partida) => partida.id === id
  );

  if (indice === -1) {
    return res.status(404).json({
      mensagem: "Partida nao encontrada"
    });
  }

  const partidaRemovida = partidas.splice(indice, 1);

  res.json({
    mensagem: "Partida excluida com sucesso",
    partida: partidaRemovida[0]
  });
});

// =========================
// UPLOAD
// =========================

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens JPG, PNG ou WEBP sao permitidas"));
    }
  }
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Envia uma imagem
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Arquivo invalido
 */
app.post("/upload", auth, upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      mensagem: "Nenhuma imagem enviada"
    });
  }

  res.status(201).json({
    mensagem: "Imagem enviada com sucesso",
    arquivo: req.file.filename,
    tamanho: req.file.size,
    tipo: req.file.mimetype
  });
});

// =========================
// SWAGGER
// =========================

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Futebol",
      version: "1.0.0",
      description: "API REST para gerenciamento de times e partidas"
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =========================
// SERVIDOR
// =========================

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});