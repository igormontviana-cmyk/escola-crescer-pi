const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Rotas
const usuariosRoutes = require("./routes/usuarios");
const turmasRoutes = require("./routes/turmas");
const avaliacoesRoutes = require("./routes/avaliacoes");
const frequenciasRoutes = require("./routes/frequencias");

app.use("/usuarios", usuariosRoutes);
app.use("/turmas", turmasRoutes);
app.use("/avaliacoes", avaliacoesRoutes);
app.use("/frequencias", frequenciasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
