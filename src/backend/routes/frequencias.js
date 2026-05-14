const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Registrar frequência
router.post("/", (req, res) => {
  const { id_aluno, id_turma, id_disciplina, data_aula, status_presenca } = req.body;
  db.query(
    "INSERT INTO Frequencia (id_aluno, id_turma, id_disciplina, data_aula, status_presenca) VALUES (?, ?, ?, ?, ?)",
    [id_aluno, id_turma, id_disciplina, data_aula, status_presenca],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Frequência registrada", id: result.insertId });
    }
  );
});

// Listar frequências por aluno
router.get("/aluno/:id_aluno", (req, res) => {
  db.query(
    "SELECT * FROM Frequencia WHERE id_aluno = ?",
    [req.params.id_aluno],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

// Listar frequências por turma e disciplina
router.get("/turma/:id_turma/disciplina/:id_disciplina", (req, res) => {
  db.query(
    "SELECT f.*, u.nome FROM Frequencia f JOIN Aluno a ON f.id_aluno = a.id_aluno JOIN Usuario u ON a.id_aluno = u.id_usuario WHERE f.id_turma = ? AND f.id_disciplina = ?",
    [req.params.id_turma, req.params.id_disciplina],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

module.exports = router;
