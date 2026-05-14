const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Criar avaliação
router.post("/", (req, res) => {
  const { titulo, data_aplicacao, peso, id_disciplina } = req.body;
  db.query(
    "INSERT INTO Avaliacao (titulo, data_aplicacao, peso, id_disciplina) VALUES (?, ?, ?, ?)",
    [titulo, data_aplicacao, peso, id_disciplina],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Avaliação criada", id: result.insertId });
    }
  );
});

// Listar todas as avaliações
router.get("/", (req, res) => {
  db.query("SELECT * FROM Avaliacao", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Registrar nota de aluno em avaliação
router.post("/:id/notas", (req, res) => {
  const { id_aluno, nota } = req.body;
  db.query(
    "INSERT INTO Aluno_Avaliacao (id_aluno, id_avaliacao, nota) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nota = ?",
    [id_aluno, req.params.id, nota, nota],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Nota registrada" });
    }
  );
});

// Listar notas de uma avaliação
router.get("/:id/notas", (req, res) => {
  db.query(
    "SELECT aa.id_aluno, u.nome, aa.nota FROM Aluno_Avaliacao aa JOIN Aluno a ON aa.id_aluno = a.id_aluno JOIN Usuario u ON a.id_aluno = u.id_usuario WHERE aa.id_avaliacao = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

module.exports = router;
