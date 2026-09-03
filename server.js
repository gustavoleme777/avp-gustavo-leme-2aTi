import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

const times = [
  { id: 1, nome: "Flamengo", cidade: "Rio de Janeiro", titulos: 8 },
  { id: 2, nome: "Palmeiras", cidade: "Sao Paulo", titulos: 12 },
  { id: 3, nome: "Santos", cidade: "Santos", titulos: 8 },
  { id: 4, nome: "Corinthians", cidade: "Sao Paulo", titulos: 7 }
];

const partidas = [
  { id: 1, mandante: "Flamengo", visitante: "Palmeiras", golsMandante: 2, golsVisitante: 1, data: "2026-09-10" },
  { id: 2, mandante: "Santos", visitante: "Corinthians", golsMandante: 0, golsVisitante: 0, data: "2026-09-11" }
];

app.get("/", (req, res) => {
  res.json({
    mensagem: "API de futebol funcionando!",
    endpoints: ["/times", "/times/:id", "/partidas", "POST /times", "POST /partidas"]
  });
});

app.get("/times", (req, res) => {
  res.json(times);
});

app.get("/times/:id", (req, res) => {
  const id = Number(req.params.id);

  const time = times.find((time) => time.id === id);

  if (!time) {
    return res.status(404).json({
      mensagem: "Time nao encontrado"
    });
  }

  res.json(time);
});

app.get("/partidas", (req, res) => {
  res.json(partidas);
});

app.post("/times", (req, res) => {
  const { nome, cidade, titulos = 0 } = req.body;

  if (!nome || !cidade) {
    return res.status(400).json({
      mensagem: "Nome e cidade sao obrigatorios"
    });
  }

  const novoTime = {
    id: times.length + 1,
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

app.post("/partidas", (req, res) => {
  const { mandante, visitante, golsMandante = 0, golsVisitante = 0, data } = req.body;

  if (!mandante || !visitante || !data) {
    return res.status(400).json({
      mensagem: "Mandante, visitante e data sao obrigatorios"
    });
  }

  const novaPartida = {
    id: partidas.length + 1,
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

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
