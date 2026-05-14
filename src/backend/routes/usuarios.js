const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Criar usuário
router.post("/", (req, res) => {
  const { nome, email, senha_hash, tipo } = req.body;
  db.query(
    "INSERT INTO Usuario (nome, email, senha_hash, tipo) VALUES (?,?,?,?)",
    [nome, email, senha_hash, tipo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ message: "Usuário criado", id: result.insertId });
    }
  );
});

// Listar todos os usuários
router.get("/", (req, res) => {
  db.query("SELECT * FROM Usuario", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Buscar usuário por ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM Usuario WHERE id_usuario = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) return res.status(404).json({ message: "Usuário não encontrado" });
      res.json(results[0]);
    }
  );
});

// Atualizar usuário
router.put("/:id", (req, res) => {
  const { nome, email } = req.body;
  db.query(
    "UPDATE Usuario SET nome = ?, email = ? WHERE id_usuario = ?",
    [nome, email, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Usuário atualizado" });
    }
  );
});

// Deletar usuário
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM Usuario WHERE id_usuario = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Usuário deletado" });
    }
  );
});

module.exports = router;
