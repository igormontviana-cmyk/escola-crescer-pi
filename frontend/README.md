# Escola Gente Miúda Crescer · Sistema Acadêmico (front navegável)

Front-end navegável do PI (Engenharia de Software, 5º período), fiel ao protótipo de alta fidelidade do Figma e aos requisitos do documento do projeto. Sem backend: os dados são simulados e as alterações ficam salvas no navegador.

## Como abrir

**Opção 1 (localhost):** na pasta `frontend`, rode `node servidor.js` e acesse http://localhost:5173

**Opção 2:** dê dois cliques em `index.html`.

Precisa de internet para carregar as fontes (Google Fonts) e os gráficos (Chart.js).

## Acesso

Na tela de login, use os botões de **Acesso de demonstração** (Aluno, Professor, Coordenação, Gestor). Senha padrão = CPF (só números), como no fluxo "Esqueceu sua senha?" do protótipo.

| Perfil | Usuário | CPF / senha |
|---|---|---|
| Professor | Ricardo Almeida | 12345678909 |
| Coordenação | Marta Ribeiro | 98765432100 |
| Gestor | Paulo Duarte | 45678912366 |
| Aluno | Anna Miyamoto | botão "Aluno" |

Para voltar os dados ao estado original: menu do usuário (canto superior direito) > **Restaurar dados de demonstração**.

## O que tem em cada perfil

- **Professor** (telas do Figma): Página Principal (avisos, calendário com criação de eventos, próximos eventos), Lista de Alunos, Detalhes do aluno + Ocorrência, Notas (turma > matéria > tabela por bimestre, com edição), Chamada (aulas do mês + chamada de qualquer turma), Avaliações com peso (RN-005) e publicação no boletim. Acessa e edita todas as turmas.
- **Aluno** (RF05): Início, Boletim, Frequência por disciplina com alerta abaixo de 75% (RN-008), Ouvidoria (reclamação, sugestão, elogio ou dúvida, com opção anônima), Mural.
- **Coordenação** (RF02): visão das turmas, Usuários (cadastro, edição, inativação; RN-001, RN-002), Turmas e grade curricular (RN-003), Ouvidoria (responder e mudar status), Disciplinas.
- **Gestor** (RF07, RF08): Dashboard de KPIs com Chart.js, Relatórios com média e desvio padrão (exporta CSV), Alunos em risco, Ouvidoria, Turmas, Auditoria LGPD (RN-009).
- **Professor, Coordenação e Gestor:** criar turma e matricular aluno. O aluno novo entra na lista, nas notas, na chamada e no boletim.
- **Todos:** Perguntas frequentes, Mural (RF06, autor pode excluir o próprio aviso), busca, notificações, bloqueio por perfil (RN-007).

Dados de demonstração: 8 turmas (6º ano ao 3º ano do Ensino Médio), 125 alunos com nomes fictícios e 7 professores.

## Versão mobile

Abaixo de 900px a interface vira app: navegação inferior por perfil, cabeçalho compacto, chamada com toque na linha inteira e botão Salvar fixo, boletim em cards e modais em formato de bottom sheet.

## Estrutura

```
frontend/
├── index.html
├── servidor.js             servidor local sem dependências
├── css/styles.css          design system (desktop)
├── css/mobile.css          experiência mobile
├── assets/public/          logo oficial da escola (alta resolução)
├── assets/img/             fotos dos alunos (recortes do protótipo Figma)
└── js/
    ├── icons.js, data.js, core.js, app.js
    └── views/professor.js, aluno.js, coordenador.js, gestor.js
```

Stack: HTML5, CSS3 e JavaScript puro + Chart.js v4, conforme o item 21.1 do documento do PI.
