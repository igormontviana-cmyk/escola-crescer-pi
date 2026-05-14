const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "SUA_SENHA",
  database: "sistema_academico_completo",
});

connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("MySQL conectado com sucesso!");
});

module.exports = connection;
