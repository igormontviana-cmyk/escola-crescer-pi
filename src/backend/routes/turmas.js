const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Criar turma
router.post("/", (req, res) => {
  const { nome_turma, ano_letivo } = req.body;
  db.query(
    "INSERT INTO Turma (nome_turma, ano_letivo) VALUES (?, ?)",
    [nome_turma, ano_letivo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Turma criada", id: result.insertId });
    }
  );
});

// Listar todas as turmas
router.get("/", (req, res) => {
  db.query("SELECT * FROM Turma", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Buscar turma por ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM Turma WHERE id_turma = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) return res.status(404).json({ message: "Turma não encontrada" });
      res.json(results[0]);
    }
  );
});

// Atualizar turma
router.put("/:id", (req, res) => {
  const { nome_turma, ano_letivo } = req.body;
  db.query(
    "UPDATE Turma SET nome_turma = ?, ano_letivo = ? WHERE id_turma = ?",
    [nome_turma, ano_letivo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Turma atualizada" });
    }
  );
});

// Deletar turma
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM Turma WHERE id_turma = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Turma deletada" });
    }
  );
});

module.exports = router;
