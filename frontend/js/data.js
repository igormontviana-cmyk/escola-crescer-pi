/* =========================================================
   Dados simulados (front navegável, sem backend)
   Alunos, notas e frequências do 3ºEM - A vêm do protótipo Figma.
   KPIs e estatísticas do Gestor vêm do documento do PI (item 22).
   ========================================================= */
window.EC = window.EC || {};

(function () {
  // PRNG determinístico: os mesmos dados a cada carregamento
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const clamp = (v, a = 0, b = 10) => Math.min(b, Math.max(a, v));
  const r1 = (v) => Math.round(v * 10) / 10;

  const DISCIPLINAS = {
    mat: { nome: 'Matemática Avançada', curto: 'Matemática', ch: 160 },
    fis: { nome: 'Física', curto: 'Física', ch: 80 },
    qui: { nome: 'Química Orgânica e Inorgânica', curto: 'Química', ch: 80 },
    bio: { nome: 'Biologia', curto: 'Biologia', ch: 80 },
    his: { nome: 'História', curto: 'História', ch: 80 },
    geo: { nome: 'Geografia', curto: 'Geografia', ch: 80 },
    soc: { nome: 'Sociologia e Filosofia', curto: 'Sociologia', ch: 80 },
    por: { nome: 'Língua Port. e Redação', curto: 'Português', ch: 160 },
    mtf: { nome: 'Matemática', curto: 'Matemática', ch: 160 },
    lpf: { nome: 'Língua Portuguesa', curto: 'Português', ch: 160 },
    cie: { nome: 'Ciências', curto: 'Ciências', ch: 120 },
    ing: { nome: 'Inglês', curto: 'Inglês', ch: 80 },
  };
  Object.keys(DISCIPLINAS).forEach((k) => (DISCIPLINAS[k].id = k));

  const EM = ['mat', 'fis', 'qui', 'geo', 'soc', 'bio', 'por', 'his']; // ordem da tela "Matérias" do Figma
  const EF = ['lpf', 'mtf', 'cie', 'his', 'geo', 'ing'];

  const TURMAS = [
    { id: '3ema', nome: '3ºEM - A', curto: '3° ano A', serie: '3º Ano EM', turno: 'Matutino', sala: 'Sala 12', disciplinas: EM.slice() },
    { id: '2emd', nome: '2ºEM - D', curto: '2° ano D', serie: '2º Ano EM', turno: 'Matutino', sala: 'Sala 08', disciplinas: EM.slice() },
    { id: '1emb', nome: '1ºEM - B', curto: '1° ano B', serie: '1º Ano EM', turno: 'Vespertino', sala: 'Sala 05', disciplinas: EM.slice() },
    { id: '7efa', nome: '7º Ano - A', curto: '7° ano A', serie: '7º Ano EF', turno: 'Vespertino', sala: 'Sala 03', disciplinas: EF.slice() },
  ];

  const PROFESSORES = [
    { id: 'p1', nome: 'Ricardo Almeida', email: 'ricardo.almeida@gentemiudacrescer.com', cpf: '12345678909', disc: [['3ema', 'mat'], ['3ema', 'fis'], ['2emd', 'por'], ['7efa', 'cie']] },
    { id: 'p2', nome: 'Helena Prado', email: 'helena.prado@gentemiudacrescer.com', cpf: '31415926535', disc: [['3ema', 'bio'], ['3ema', 'qui'], ['2emd', 'bio'], ['2emd', 'qui'], ['1emb', 'bio'], ['1emb', 'qui']] },
    { id: 'p3', nome: 'Carlos Menezes', email: 'carlos.menezes@gentemiudacrescer.com', cpf: '27182818284', disc: [['3ema', 'his'], ['3ema', 'geo'], ['3ema', 'soc'], ['2emd', 'his'], ['2emd', 'geo'], ['2emd', 'soc'], ['1emb', 'his'], ['7efa', 'his'], ['7efa', 'geo']] },
    { id: 'p4', nome: 'Juliana Castro', email: 'juliana.castro@gentemiudacrescer.com', cpf: '16180339887', disc: [['3ema', 'por'], ['1emb', 'por'], ['7efa', 'lpf'], ['7efa', 'ing'], ['2emd', 'mat'], ['1emb', 'mat'], ['7efa', 'mtf'], ['2emd', 'fis'], ['1emb', 'fis'], ['1emb', 'geo'], ['1emb', 'soc']] },
  ];

  // Sprite: recorte das fotos do Figma (Lista de Alunos, 1265x1600)
  const SP = (y) => ({ src: 'assets/img/alunos-sprite.png', w: 1265, h: 1600, cx: 388, cy: y, d: 66 });

  // Alunos do 3ºEM - A exatamente como no protótipo
  const FIGMA_3EMA = [
    ['Anna Miyamoto', 100, [9.0, 8.0, 9.0, 8.0], SP(321)],
    ['Alice Fernandes', 100, [9.8, 9.9, 10.0, 10.0], SP(415)],
    ['Bruno Oliveira', 93, [8.8, 9.3, 9.1, 9.5], SP(509)],
    ['Elizabeth Webber', 80, [7.8, 8.5, 8.0, 8.2], SP(603)],
    ['Felipe Lima', 76, [7.2, 6.9, 7.5, 7.1], null],
    ['Henrique Silva', 75, [7.0, 7.3, 7.8, 8.0], SP(791)],
    ['Sebastian da Cunha', 65, [6.5, 6.8, 6.7, 8.0], SP(885)],
    ['Gabriela Carvalho', 46, [4.8, 4.3, 4.2, 4.5], SP(980)],
    ['João Pereira', 44, [5.0, 4.5, 4.6, 4.3], null],
    ['João Manoel Carvalho', 30, [3.0, 3.2, 2.8, 3.1], SP(1170)],
    ['Camila Souza', 28, [2.8, 2.5, 2.6, 2.9], null],
    ['Diego Martins da Silva', 20, [2.3, 2.1, 2.0, 2.2], null],
    ['Cesar Oliveira Cohen', 0, [0, 0, 0, 0], null],
  ];
  // Foto em alta da Anna (tela Detalhes e info Alunos, 1440x1024)
  const ANNA_HI = { src: 'assets/img/detalhe-sprite.png', w: 1440, h: 1024, x: 94, y: 187, s: 350 }; // recorte acima do marcador sobreposto no Figma
  // Notas da Anna na tela de detalhes do Figma
  const ANNA_DISC = { mat: 8.5, fis: 7.8, qui: 9.2, bio: 7.0, his: 8.0, geo: 6.5, soc: 7.3, por: 8.9 };

  const OUTROS = {
    '2emd': [['Lucas Andrade', 96], ['Mariana Costa', 91], ['Pedro Henrique Rocha', 88], ['Beatriz Lima', 84], ['Rafael Moura', 79], ['Isabela Teixeira', 93], ['Gustavo Nunes', 71], ['Larissa Campos', 86], ['Thiago Fritz', 68], ['Arthur Cervero', 90]],
    '1emb': [['Sofia Martins', 95], ['Enzo Barbosa', 82], ['Valentina Ramos', 89], ['Matheus Freitas', 77], ['Manuela Dias', 92], ['Davi Correia', 64], ['Helena Pires', 87], ['Lorenzo Vieira', 80], ['Lívia Monteiro', 94]],
    '7efa': [['Miguel Araújo', 97], ['Alícia Ribeiro', 90], ['Bernardo Cardoso', 85], ['Laura Mendes', 93], ['Heitor Gomes', 73], ['Cecília Batista', 88], ['Theo Fernandes', 81], ['Maria Clara Lopes', 95], ['Samuel Duarte', 70], ['Júlia Santana', 86]],
  };
  const NIVEL = { '2emd': [8.6, 8.2, 7.6, 7.4, 6.8, 8.9, 5.6, 7.9, 4.8, 8.1], '1emb': [9.1, 7.2, 8.4, 6.6, 8.8, 4.6, 7.7, 6.9, 9.0], '7efa': [9.3, 8.5, 7.8, 8.9, 5.9, 8.0, 7.1, 9.2, 4.4, 7.6] };

  // Padrões de variação por bimestre que somam zero (preservam a média)
  const PAT = [[0, 0, 0, 0], [-.3, .2, .1, 0], [.4, -.2, -.3, .1], [-.5, -.1, .3, .3], [.2, .3, -.4, -.1], [-.2, -.4, .2, .4]];

  const ALUNOS = [];
  const NOTAS = {};   // NOTAS[alunoId][disc] = [b1,b2,b3,b4]
  const FREQ = {};    // FREQ[alunoId][disc] = percentual

  function mkMatricula(t, i) { return '2026' + ({ '3ema': 3, '2emd': 2, '1emb': 1, '7efa': 7 })[t] + String(i + 1).padStart(2, '0') + (hash(t + i) % 9); }
  function mkCpf(seed) { const r = rng(seed); let s = ''; for (let i = 0; i < 11; i++) s += Math.floor(r() * 10); return s; }

  function genNotas(id, turma, nivel, discs, fixed) {
    const r = rng(hash(id));
    NOTAS[id] = {};
    discs.forEach((d, k) => {
      if (fixed && fixed[d]) { NOTAS[id][d] = fixed[d].slice(); return; }
      const alvo = nivel === 0 ? 0 : clamp(nivel + (r() - .5) * 1.6);
      const p = PAT[Math.floor(r() * PAT.length)];
      NOTAS[id][d] = p.map((o) => (nivel === 0 ? 0 : r1(clamp(alvo + o))));
    });
  }
  function genFreq(id, base, discs) {
    const r = rng(hash(id + 'f'));
    FREQ[id] = {};
    discs.forEach((d) => { FREQ[id][d] = base >= 100 || base <= 0 ? base : Math.round(clamp(base + (r() - .5) * 10, 0, 100)); });
  }

  FIGMA_3EMA.forEach(([nome, freq, mat, foto], i) => {
    const id = 'a' + (i + 1);
    ALUNOS.push({ id, nome, turma: '3ema', freq, foto, matricula: mkMatricula('3ema', i), cpf: mkCpf(hash(nome)), nasc: `${String(3 + (i * 7) % 25).padStart(2, '0')}/${String(1 + (i * 5) % 12).padStart(2, '0')}/2008`, responsavel: 'Responsável por ' + nome.split(' ')[0] });
    const nivel = r1(mat.reduce((a, b) => a + b, 0) / 4);
    let fixed = { mat };
    if (nome === 'Anna Miyamoto') {
      fixed = {};
      Object.keys(ANNA_DISC).forEach((d, k) => { fixed[d] = PAT[k % PAT.length].map((o) => r1(ANNA_DISC[d] + o)); });
      fixed.mat = mat;
    }
    genNotas(id, '3ema', nivel, TURMAS[0].disciplinas, fixed);
    genFreq(id, freq, TURMAS[0].disciplinas);
  });
  ALUNOS[0].fotoHi = ANNA_HI;

  Object.keys(OUTROS).forEach((t) => {
    const turma = TURMAS.find((x) => x.id === t);
    OUTROS[t].forEach(([nome, freq], i) => {
      const id = t + '-' + (i + 1);
      ALUNOS.push({ id, nome, turma: t, freq, foto: null, matricula: mkMatricula(t, i), cpf: mkCpf(hash(nome)), nasc: `${String(2 + (i * 7) % 26).padStart(2, '0')}/${String(1 + (i * 5) % 12).padStart(2, '0')}/${t === '7efa' ? 2013 : t === '1emb' ? 2010 : 2009}`, responsavel: 'Responsável por ' + nome.split(' ')[0] });
      genNotas(id, t, NIVEL[t][i], turma.disciplinas);
      genFreq(id, freq, turma.disciplinas);
    });
  });

  // Atividade recente (Figma: log do aluno)
  const ATIVIDADE = {
    a1: ['[07:45] Anna marcou presença em Matemática Avançada', '[08:45] Anna marcou presença em História', '[10:45] Anna marcou presença em Biologia', '[11:45] Anna marcou presença em Língua Port. e Redação', '[18:37] Anna enviou uma atividade de Geografia', '[20:37] Anna enviou uma atividade de Matemática Avançada'],
  };

  // Horário semanal do professor logado (0=dom ... 6=sáb). Sexta igual ao Figma.
  const HORARIO = {
    1: [['3ema', 'mat'], ['2emd', 'por']],
    2: [['3ema', 'fis'], ['7efa', 'cie']],
    3: [['3ema', 'mat'], ['2emd', 'por']],
    4: [['3ema', 'fis'], ['7efa', 'cie']],
    5: [['2emd', 'por'], ['3ema', 'mat'], ['7efa', 'cie']],
  };

  const USUARIOS_DEMO = {
    professor: { perfil: 'professor', id: 'p1', nome: 'Ricardo Almeida', email: 'ricardo.almeida@gentemiudacrescer.com', cpf: '12345678909', foto: { src: 'assets/img/prof-sprite.png', w: 1414, h: 900, cx: 1158, cy: 46, d: 32 } },
    aluno: { perfil: 'aluno', id: 'a1', nome: 'Anna Miyamoto', email: 'anna.miyamoto@aluno.gentemiudacrescer.com', cpf: ALUNOS[0].cpf, foto: ALUNOS[0].foto },
    coordenador: { perfil: 'coordenador', id: 'c1', nome: 'Marta Ribeiro', email: 'marta.ribeiro@gentemiudacrescer.com', cpf: '98765432100' },
    gestor: { perfil: 'gestor', id: 'g1', nome: 'Paulo Duarte', email: 'paulo.duarte@gentemiudacrescer.com', cpf: '45678912366' },
  };

  // Avisos do Mural (os três primeiros são os do Figma)
  const AVISOS = [
    { id: 'v1', titulo: 'Inscrições para Oficina Pedagógica', texto: 'Inscrições abertas para a oficina "Metodologias Ativas na Educação", que ocorrerá em 05/12.', autor: 'Marta Ribeiro', perfil: 'Coordenação', publico: 'professores', dias: -1 },
    { id: 'v2', titulo: 'Regras para Saídas Pedagógicas', texto: 'Qualquer saída pedagógica deve ser aprovada pela coordenação com pelo menos duas semanas de antecedência e deve seguir o protocolo de autorização.', autor: 'Marta Ribeiro', perfil: 'Coordenação', publico: 'professores', dias: -3 },
    { id: 'v3', titulo: 'Entrega de Material Didático', texto: 'Professores que precisarem de material adicional (papel, marcadores, cartolina) devem solicitá-lo à coordenação com antecedência.', autor: 'Paulo Duarte', perfil: 'Gestão', publico: 'professores', dias: -5 },
    { id: 'v4', titulo: 'Simulado do ENEM: 3º ano', texto: 'O simulado acontece no próximo sábado, das 8h às 12h30, no bloco B. Tragam documento com foto e caneta preta.', autor: 'Ricardo Almeida', perfil: 'Professor', publico: '3ema', dias: -2 },
    { id: 'v5', titulo: 'Feira Cultural: inscrição dos grupos', texto: 'Os grupos da Feira Cultural devem ser cadastrados com o professor orientador até sexta-feira.', autor: 'Marta Ribeiro', perfil: 'Coordenação', publico: 'todos', dias: -4 },
    { id: 'v6', titulo: 'Lista de exercícios de Física', texto: 'A lista 4 (Ondulatória) está disponível na secretaria e deve ser entregue na próxima aula.', autor: 'Ricardo Almeida', perfil: 'Professor', publico: '3ema', dias: -6 },
  ];

  // Eventos (Figma: Próximos Eventos). Dia relativo ao mês corrente.
  const EVENTOS = [
    { m: 0, d: 22, cor: 'navy', titulo: 'Reunião Pedagógica Mensal', texto: 'Reunião para discutir o andamento do semestre, desafios em sala de aula e estratégias de ensino.', publico: 'equipe' },
    { m: 0, d: 22, cor: 'green', titulo: 'Palestra: "Inovação na Educação"', texto: 'Palestra online com o especialista em educação, Dr. André Silva, sobre métodos inovadores no ensino.', publico: 'todos' },
    { m: 0, d: 22, cor: 'red', titulo: 'Envio de Notas do 3º Bimestre', texto: 'Data final para o lançamento das notas do 3º bimestre.', publico: 'equipe' },
    { m: 0, d: 22, cor: 'yellow', titulo: 'Feira Cultural', texto: 'Exposição de projetos dos alunos sobre temas culturais, aberta para a comunidade e familiares.', publico: 'todos' },
    { m: 0, d: 28, cor: 'navy', titulo: 'Conselho de Classe', texto: 'Análise do desempenho das turmas com coordenação e professores.', publico: 'equipe' },
    { m: 0, d: 28, cor: 'green', titulo: 'Reunião de Pais e Mestres', texto: 'Entrega de boletins parciais e conversa com as famílias.', publico: 'todos' },
    { m: 0, d: 9, cor: 'yellow', titulo: 'Semana da Leitura', texto: 'Rodas de leitura e troca de livros no pátio.', publico: 'todos' },
    { m: 1, d: 5, cor: 'green', titulo: 'Oficina "Metodologias Ativas"', texto: 'Oficina presencial para professores no auditório.', publico: 'equipe' },
    { m: 1, d: 18, cor: 'red', titulo: 'Simulado Geral', texto: 'Simulado para todas as turmas do Ensino Médio.', publico: 'todos' },
    { m: -1, d: 15, cor: 'navy', titulo: 'Início do 4º Bimestre', texto: 'Abertura oficial do último bimestre letivo.', publico: 'todos' },
  ];

  // Estatística do documento do PI (item 22) + demais disciplinas
  const ESTAT = [
    { disc: 'Matemática', media: 7.6, dp: 1.2, min: 5.0, max: 10.0, interp: 'Desempenho moderado com dispersão média.' },
    { disc: 'Português', media: 8.2, dp: 0.9, min: 6.0, max: 9.8, interp: 'Alta consistência (menor dispersão entre as disciplinas).' },
    { disc: 'História', media: 7.4, dp: 1.5, min: 4.5, max: 9.5, interp: 'Maior dispersão: heterogeneidade no domínio do conteúdo.' },
    { disc: 'Ciências', media: 8.0, dp: 1.1, min: 5.5, max: 9.9, interp: 'Bom desempenho com variabilidade controlada.' },
    { disc: 'Geografia', media: 7.3, dp: 1.3, min: 4.8, max: 9.6, interp: 'Desempenho moderado, atenção às turmas do turno vespertino.' },
    { disc: 'Física', media: 6.9, dp: 1.4, min: 3.9, max: 9.8, interp: 'Menor média geral: candidata a reforço no contraturno.' },
    { disc: 'Biologia', media: 7.7, dp: 1.0, min: 5.6, max: 9.7, interp: 'Desempenho consistente.' },
    { disc: 'Inglês', media: 7.9, dp: 1.2, min: 5.1, max: 10.0, interp: 'Bom desempenho, dispersão média.' },
  ];

  const KPIS = { aprovacao: 78, frequencia: 83, risco: 12, correlacao: 0.78 };
  const FREQ_MENSAL = [['fev', 88], ['mar', 86], ['abr', 85], ['mai', 82], ['jun', 79], ['jul', 81], ['ago', 84], ['set', 83], ['out', 80]];

  // Nuvem frequência x nota com r ≈ 0,78 (dados simulados para a escola)
  const DISPERSAO = (() => {
    const r = rng(778);
    const pts = [];
    for (let i = 0; i < 140; i++) {
      const f = clamp(60 + r() * 40 + (r() - .5) * 8, 45, 100);
      const n = clamp(-2.2 + f * 0.095 + (r() + r() + r() - 1.5) * 1.57, 0, 10);
      pts.push({ x: Math.round(f), y: r1(n) });
    }
    return pts;
  })();

  const LOGS = [
    ['08:02', 'Ricardo Almeida', 'Professor', 'Login realizado', 'ok'],
    ['08:05', 'Ricardo Almeida', 'Professor', 'Registrou chamada: Matemática Avançada, 3ºEM - A', 'ok'],
    ['08:41', 'Marta Ribeiro', 'Coordenador', 'Atualizou grade curricular: 1ºEM - B', 'ok'],
    ['09:12', 'Anna Miyamoto', 'Aluno', 'Consultou boletim', 'ok'],
    ['09:30', 'desconhecido', '-', 'Tentativa de login com senha inválida', 'bad'],
    ['10:03', 'Helena Prado', 'Professor', 'Lançou notas: Biologia, 2ºEM - D (2º BIM)', 'ok'],
    ['10:15', 'Anna Miyamoto', 'Aluno', 'Tentou acessar /notas (sem permissão: RN-007)', 'warn'],
    ['11:20', 'Paulo Duarte', 'Gestor', 'Exportou relatório estatístico', 'ok'],
    ['13:47', 'Carlos Menezes', 'Professor', 'Publicou aviso no mural: 2ºEM - D', 'ok'],
  ];

  EC.data = { DISCIPLINAS, TURMAS, PROFESSORES, ALUNOS, NOTAS, FREQ, ATIVIDADE, HORARIO, USUARIOS_DEMO, AVISOS, EVENTOS, ESTAT, KPIS, FREQ_MENSAL, DISPERSAO, LOGS, rng, hash, clamp, r1 };
})();
