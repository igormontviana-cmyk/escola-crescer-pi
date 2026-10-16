/* =========================================================
   App: roteador (hash), layout por perfil, login e telas comuns
   ========================================================= */
window.EC = window.EC || {};

(function () {
  const D = EC.data;
  const I = EC.icon;
  const esc = EC.esc;
  const ROUTES = [];
  EC.views = EC.views || {};

  /* Rotas: padrão '/alunos/:id', perfis permitidos (RBAC, RN-007) e item de menu */
  EC.route = (pattern, opts) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    ROUTES.push({ pattern, re, keys, ...opts });
  };

  const NAV = {
    professor: [['/inicio', 'Página Principal', 'home'], ['/alunos', 'Lista de Alunos', 'users'], ['/notas', 'Notas', 'chart'], ['/chamada', 'Chamada', 'clipboard'], ['/avaliacoes', 'Avaliações', 'fileCheck']],
    aluno: [['/inicio', 'Início', 'home'], ['/boletim', 'Boletim', 'chart'], ['/frequencia', 'Frequência', 'clipboard'], ['/mural', 'Mural', 'megaphone']],
    coordenador: [['/inicio', 'Início', 'home'], ['/usuarios', 'Usuários', 'users'], ['/turmas', 'Turmas', 'layers'], ['/disciplinas', 'Disciplinas', 'book'], ['/mural', 'Mural', 'megaphone']],
    gestor: [['/dashboard', 'Dashboard', 'grid'], ['/relatorios', 'Relatórios', 'fileText'], ['/risco', 'Alunos em Risco', 'warn'], ['/auditoria', 'Auditoria LGPD', 'shield'], ['/mural', 'Mural', 'megaphone']],
  };
  const HOME = { professor: '/inicio', aluno: '/inicio', coordenador: '/inicio', gestor: '/dashboard' };
  EC.home = (u) => HOME[u.perfil];
  EC.go = (path) => { if (location.hash === '#' + path) render(); else location.hash = path; };

  /* ---------------- Login (Figma: Login) ---------------- */
  function loginView() {
    document.title = 'Login · Escola Gente Miúda Crescer';
    const app = document.getElementById('app');
    app.innerHTML = `
      <main class="login">
        <div class="login-bg">${EC.kids()}</div>
        <button class="login-help" id="login-help" aria-label="Ajuda para acessar">${I('helpChat')}</button>
        <form class="login-card" id="login-form" novalidate>
          ${EC.logo('navy', 'lg')}
          <h1>LOGIN</h1>
          <label class="uline-field">${I('user')}<span class="sr-only">CPF</span>
            <input id="cpf" inputmode="numeric" autocomplete="username" placeholder="000.000.000-00" maxlength="14" required>
          </label>
          <label class="uline-field">${I('lock')}<span class="sr-only">Senha</span>
            <input id="senha" type="password" autocomplete="current-password" placeholder="Senha" required>
            <button type="button" class="eye" id="eye" aria-label="Mostrar senha">${I('eyeOff', 'sm')}</button>
          </label>
          <button type="button" class="login-link" id="forgot">Esqueceu sua senha?</button>
          <div class="login-error" id="login-error" role="alert"></div>
          <button class="btn btn-primary" type="submit">Entrar</button>
          <div class="demo">
            <p>Acesso de demonstração</p>
            <div class="demo-grid">
              ${[['aluno', 'Aluno', 'cap'], ['professor', 'Professor', 'book'], ['coordenador', 'Coordenação', 'layers'], ['gestor', 'Gestor', 'grid']].map(([k, l, ic]) => `<button type="button" data-demo="${k}">${I(ic)}${l}</button>`).join('')}
            </div>
          </div>
        </form>
        <p class="login-foot">${I('shield', 'sm')} Dados protegidos conforme a LGPD (Lei 13.709/2018)</p>
      </main>`;
    const cpf = app.querySelector('#cpf');
    const senha = app.querySelector('#senha');
    const err = app.querySelector('#login-error');
    cpf.addEventListener('input', () => { cpf.value = EC.fmtCpf(cpf.value); });
    app.querySelector('#eye').addEventListener('click', (e) => {
      const show = senha.type === 'password';
      senha.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = I(show ? 'eye' : 'eyeOff', 'sm');
      e.currentTarget.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    });
    app.querySelector('#forgot').addEventListener('click', forgotModal);
    app.querySelector('#login-help').addEventListener('click', forgotModal);
    app.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      const u = D.USUARIOS_DEMO[b.dataset.demo];
      cpf.value = EC.fmtCpf(u.cpf);
      senha.value = u.cpf;
      app.querySelector('#login-form').requestSubmit();
    }));
    app.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      err.classList.remove('show');
      const c = cpf.value.replace(/\D/g, '');
      const user = Object.values(D.USUARIOS_DEMO).find((u) => u.cpf === c);
      if (c.length !== 11 || !senha.value) { err.textContent = 'Informe o CPF completo e a senha.'; void err.offsetWidth; err.classList.add('show'); return; }
      // Senha padrão = CPF (Figma: "Esqueceu sua senha?"). No sistema real, comparação via hash bcrypt (RN-006).
      if (!user || senha.value.replace(/\D/g, '') !== c) { err.textContent = 'CPF ou senha inválidos. Verifique os dados e tente novamente.'; void err.offsetWidth; err.classList.add('show'); EC.log('Tentativa de login com senha inválida', 'bad'); return; }
      await EC.loading(700);
      EC.session.set(user);
      EC.log('Login realizado');
      location.hash = EC.home(user);
      render();
    });
  }

  /* Modal "Esqueceu sua senha?" (Figma) */
  function forgotModal() {
    EC.modal(`
      <div class="forgot" role="dialog" aria-modal="true" aria-labelledby="fg-t">
        <div class="lock"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V7a3 3 0 0 0-6 0z"/><circle cx="9" cy="16" r="1.3" fill="#d6dbe3"/><circle cx="12" cy="16" r="1.3" fill="#d6dbe3"/><circle cx="15" cy="16" r="1.3" fill="#d6dbe3"/></svg></div>
        <h3 id="fg-t">Esqueceu sua <b>senha?</b></h3>
        <p>Acesso padrão</p>
        <p><b>Usuário</b>: CPF (digite somente os números)</p>
        <p><b>Senha</b>: CPF (digite somente os números)</p>
        <h4>${I('lock')} Não funcionou?</h4>
        <small>Entre em contato com a secretaria da escola<br>para redefinir o padrão</small>
        <button class="btn btn-primary" data-close>OK</button>
      </div>`, { raw: true });
  }

  /* ---------------- Layout ---------------- */
  function notificacoes(u) {
    if (u.perfil === 'professor') {
      const risco = EC.alunosDaTurma('3ema').filter((a) => a.freq < 75).length;
      return [
        ['red', 'clock', 'Prazo de notas', 'Envio das notas do 4º bimestre termina em 5 dias.', '#/notas'],
        ['warn', 'warn', 'Frequência baixa', `${risco} alunos do 3ºEM - A estão abaixo de 75% (RN-008).`, '#/alunos'],
        ['navy', 'clipboard', 'Chamada pendente', 'Há aulas de hoje sem chamada registrada.', '#/chamada'],
      ];
    }
    if (u.perfil === 'aluno') {
      return [
        ['navy', 'fileCheck', 'Nova nota publicada', 'Matemática Avançada: nota do 3º bimestre disponível.', '#/boletim'],
        ['green', 'megaphone', 'Novo aviso no mural', 'Simulado do ENEM: 3º ano.', '#/mural'],
      ];
    }
    if (u.perfil === 'coordenador') {
      return [
        ['warn', 'warn', 'Alunos em risco', '12% dos alunos com frequência abaixo de 75%.', '#/inicio'],
        ['navy', 'layers', 'Grade curricular', '1ºEM - B atualizada hoje às 08:41.', '#/turmas'],
      ];
    }
    return [
      ['warn', 'warn', 'Alerta de frequência', 'Alunos em risco subiu para 12% (limiar 10%).', '#/risco'],
      ['red', 'shield', 'Tentativa de acesso inválida', 'Registrada às 09:30. Ver auditoria.', '#/auditoria'],
    ];
  }
  const NT = { red: ['var(--bad-bg)', 'var(--bad)'], warn: ['var(--warn-bg)', '#8a6200'], navy: ['var(--info-bg)', 'var(--navy-700)'], green: ['var(--ok-bg)', '#0f7a36'] };

  function shell(u, active, inner) {
    const nav = NAV[u.perfil];
    const notes = notificacoes(u);
    return `
      <div class="shell">
        <aside class="sidebar" aria-label="Menu principal">
          <a class="brand" href="#${EC.home(u)}" aria-label="Página principal">${EC.logo('white')}</a>
          <nav class="nav">
            ${nav.map(([p, l, ic]) => `<a href="#${p}" class="${active === p ? 'active' : ''}" ${active === p ? 'aria-current="page"' : ''}>${I(ic)}<span>${l}</span></a>`).join('')}
          </nav>
          <div class="sidebar-foot">
            <div class="role">${I('shield', 'sm')}<span><b>${EC.perfilNome(u.perfil)}</b>Acesso restrito ao seu perfil</span></div>
            <button class="logout" data-logout>${I('logout')}<span>Sair</span></button>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <a class="m-brand" href="#${EC.home(u)}" aria-label="Página principal">${EC.logo('navy')}</a>
            <div class="search rel" id="search">
              ${I('search')}
              <label class="sr-only" for="q">Pesquisar</label>
              <input id="q" type="search" placeholder="Pesquisar..." autocomplete="off">
              <div class="search-results" id="search-results" role="listbox"></div>
            </div>
            <div class="top-actions">
              <button class="icon-btn m-only" id="search-toggle" aria-label="Pesquisar">${I('search')}</button>
              <a class="icon-btn" href="#/faq" aria-label="Perguntas frequentes" title="Perguntas frequentes">${I('helpChat')}</a>
              <div class="rel">
                <button class="icon-btn" id="bell" aria-label="Notificações" aria-expanded="false">${I('bell')}<span class="dot"></span></button>
                <div class="dropdown" id="bell-dd">
                  <h4>Notificações</h4>
                  ${notes.map(([t, ic, h, p, href]) => `<a class="dd-item" href="${href}"><span class="dd-ico" style="background:${NT[t][0]};color:${NT[t][1]}">${I(ic, 'sm')}</span><span><b>${h}</b><small>${p}</small></span></a>`).join('')}
                </div>
              </div>
              <div class="rel">
                <button class="user-chip" id="me" aria-expanded="false" aria-label="Menu do usuário">
                  ${EC.avatar(u, 36)}
                  <span class="who"><b>${esc(u.nome)}</b><small>${esc(u.email)}</small></span>
                </button>
                <div class="dropdown" id="me-dd" style="min-width:260px">
                  <div class="dd-item" style="pointer-events:none">${EC.avatar(u, 40)}<span><b>${esc(u.nome)}</b><small>${EC.perfilNome(u.perfil)} · CPF ${EC.maskCpf(u.cpf)}</small></span></div>
                  <a class="dd-item" href="#/faq">${I('helpChat', 'sm')}<span>Perguntas frequentes</span></a>
                  <button class="dd-item" id="reset-demo">${I('activity', 'sm')}<span>Restaurar dados de demonstração</span></button>
                  <button class="dd-item" data-logout style="color:var(--bad)">${I('logout', 'sm')}<span>Sair</span></button>
                </div>
              </div>
            </div>
          </header>
          <main class="content" id="content" tabindex="-1">${inner}</main>
          <footer class="app-foot">${I('shield', 'sm')} Escola Gente Miúda Crescer · Sistema Acadêmico · dados de alunos tratados conforme a LGPD (Art. 14 e 46)</footer>
        </div>
        <nav class="bottom-nav" aria-label="Navegação">
          ${nav.slice(0, 5).map(([p, l, ic]) => `<a href="#${p}" class="${active === p ? 'active' : ''}">${I(ic)}<span>${l.replace('Página Principal', 'Início').replace('Lista de Alunos', 'Alunos').replace('Alunos em Risco', 'Risco').replace('Auditoria LGPD', 'Auditoria')}</span></a>`).join('')}
        </nav>
      </div>`;
  }

  function wireShell(u) {
    const app = document.getElementById('app');
    app.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', async () => {
      EC.log('Logout');
      EC.session.clear();
      location.hash = '/login';
    }));
    const dds = [['#bell', '#bell-dd'], ['#me', '#me-dd']];
    dds.forEach(([b, d]) => {
      const btn = app.querySelector(b), dd = app.querySelector(d);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !dd.classList.contains('open');
        app.querySelectorAll('.dropdown.open').forEach((x) => x.classList.remove('open'));
        dd.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
        if (b === '#bell') btn.querySelector('.dot')?.remove();
      });
    });
    document.onclick = (e) => { if (!e.target.closest('.dropdown')) app.querySelectorAll('.dropdown.open').forEach((x) => x.classList.remove('open')); if (!e.target.closest('#search')) app.querySelector('#search-results')?.classList.remove('open'); };
    app.querySelector('#reset-demo').addEventListener('click', async () => {
      if (await EC.confirm({ title: 'Restaurar dados?', text: 'Notas, chamadas, avisos e cadastros editados nesta demonstração voltarão ao estado original.', ok: 'Restaurar' })) EC.resetDemo();
    });
    app.querySelector('#search-toggle').addEventListener('click', () => { app.querySelector('.topbar').classList.toggle('searching'); app.querySelector('#q').focus(); });
    wireSearch(u);
  }

  /* Busca global: alunos (equipe) e páginas */
  function wireSearch(u) {
    const q = document.getElementById('q');
    const box = document.getElementById('search-results');
    let hl = -1;
    const pages = NAV[u.perfil].map(([p, l, ic]) => ({ href: '#' + p, t: l, s: 'Página', ic })).concat([{ href: '#/faq', t: 'Perguntas frequentes', s: 'Ajuda', ic: 'helpChat' }]);
    const run = EC.debounce(() => {
      const v = q.value.trim().toLowerCase();
      if (!v) { box.classList.remove('open'); return; }
      const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const nv = norm(v);
      let items = pages.filter((p) => norm(p.t).includes(nv)).map((p) => `<a href="${p.href}"><span class="dd-ico" style="background:var(--gray-100);color:var(--navy-700)">${I(p.ic, 'sm')}</span><span>${esc(p.t)}<small>${p.s}</small></span></a>`);
      if (u.perfil !== 'aluno') {
        items = items.concat(D.ALUNOS.filter((a) => norm(a.nome).includes(nv) || a.matricula.includes(v)).slice(0, 8)
          .map((a) => `<a href="#/alunos/${a.id}">${EC.avatar(a, 32)}<span>${esc(a.nome)}<small>${EC.turma(a.turma).nome} · Matrícula ${a.matricula}</small></span></a>`));
      } else {
        const t = EC.turma(EC.aluno(u.id).turma);
        items = items.concat(t.disciplinas.filter((d) => norm(EC.disc(d).nome).includes(nv)).map((d) => `<a href="#/boletim"><span class="dd-ico" style="background:var(--gray-100);color:var(--navy-700)">${I('book', 'sm')}</span><span>${esc(EC.disc(d).nome)}<small>Boletim</small></span></a>`));
      }
      box.innerHTML = items.length ? items.join('') : '<div class="empty">Nada encontrado para "' + esc(q.value) + '"</div>';
      box.classList.add('open');
      hl = -1;
    }, 120);
    q.addEventListener('input', run);
    q.addEventListener('focus', run);
    q.addEventListener('keydown', (e) => {
      const links = [...box.querySelectorAll('a')];
      if (!links.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        hl = (hl + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle('hl', i === hl));
      } else if (e.key === 'Enter') { (links[hl] || links[0]).click(); box.classList.remove('open'); q.blur(); }
      else if (e.key === 'Escape') { box.classList.remove('open'); }
    });
    box.addEventListener('click', () => { box.classList.remove('open'); q.value = ''; document.querySelector('.topbar').classList.remove('searching'); });
  }

  /* ---------------- Render ---------------- */
  function render() {
    const path = ((location.hash || '#/').slice(1) || '/').split('?')[0];
    const u = EC.session.get();
    if (!u || path === '/login') { if (u && path === '/login') { location.hash = EC.home(u); return; } if (path !== '/login') { history.replaceState(null, '', '#/login'); } loginView(); return; }
    if (path === '/' || path === '') { location.hash = EC.home(u); return; }

    let match = null, params = {};
    for (const r of ROUTES) {
      const m = path.match(r.re);
      if (m) { match = r; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); break; }
    }
    const app = document.getElementById('app');
    let html, after, active, title;
    if (!match) {
      title = 'Página não encontrada';
      html = `<div class="denied"><div class="big">${I('search')}</div><h2>Página não encontrada</h2><p>O endereço acessado não existe.</p><a class="btn btn-primary" href="#${EC.home(u)}">Voltar ao início</a></div>`;
    } else if (match.roles && !match.roles.includes(u.perfil)) {
      // RN-007: menor privilégio. No sistema real o bloqueio ocorre no middleware RBAC do backend.
      title = 'Acesso restrito';
      EC.log(`Tentou acessar ${path} (sem permissão: RN-007)`, 'warn');
      html = `<div class="denied"><div class="big">${I('lock')}</div><h2>Acesso restrito</h2><p>Seu perfil (${EC.perfilNome(u.perfil)}) não tem permissão para acessar esta área. Cada usuário acessa apenas as funcionalidades do seu perfil (RN-007).</p><a class="btn btn-primary" href="#${EC.home(u)}">Voltar ao início</a></div>`;
    } else {
      const out = match.render(params, u) || {};
      html = out.html; after = out.after; title = out.title || match.title;
      active = match.nav === undefined ? match.pattern : match.nav;
    }
    document.title = (title ? title + ' · ' : '') + 'Escola Gente Miúda Crescer';
    if (EC.killCharts) EC.killCharts();
    app.innerHTML = shell(u, active, html);
    wireShell(u);
    const content = document.getElementById('content');
    if (after) after(content, u);
    EC.animateRings(content);
    EC.fitPhotos(content);
    window.scrollTo(0, 0);
  }
  EC.render = render;
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', EC.debounce(() => EC.fitPhotos(), 100));

  /* ---------------- Telas comuns ---------------- */

  // Perguntas frequentes (Figma: Perguntas frequêntes)
  const FAQ = {
    professor: [
      ['Como faço para registrar a presença dos alunos?', ['Acesse <b>Chamada</b> no menu lateral.', 'Escolha o dia e clique em <b>Lista de presença</b> na aula desejada.', 'Marque os alunos presentes (ou use a caixa do cabeçalho para marcar todos).', 'Clique em <b>Salvar</b> e confirme. A chamada fica registrada por disciplina, turma e data (RN-004).']],
      ['É possível corrigir uma presença ou falta registrada?', ['Sim. Abra a mesma aula em <b>Chamada</b>, ajuste a marcação do aluno e salve novamente.', 'Toda alteração fica registrada no log de auditoria (RN-009).']],
      ['Como posso lançar as notas das avaliações?', ['Acesse <b>Avaliações</b> e escolha a avaliação da turma.', 'Clique em <b>Lançar notas</b> e informe valores de 0 a 10.', 'Salve e, quando todas as avaliações do bimestre estiverem lançadas, use <b>Publicar no boletim</b>: a média ponderada pelos pesos (RN-005) vai para o boletim.']],
      ['Como edito notas já lançadas?', ['Acesse <b>Notas</b>, escolha a turma com as setas e clique na disciplina.', 'Clique em <b>Editar notas</b>, ajuste os valores e salve.', 'Você só pode editar as disciplinas que leciona; as demais aparecem como somente leitura.']],
    ],
    aluno: [
      ['Como consulto meu boletim?', ['Acesse <b>Boletim</b> no menu. As notas aparecem por bimestre, com a média e a situação de cada disciplina.', 'Use <b>Imprimir</b> para salvar em PDF.']],
      ['O que significa o alerta de frequência?', ['A frequência mínima é de 75% por disciplina. Abaixo disso, a coordenação é avisada para acompanhar você (RN-008).']],
      ['Esqueci minha senha. E agora?', ['O acesso padrão usa o CPF como usuário e senha (somente números). Se não funcionar, procure a secretaria da escola.']],
      ['Quem pode ver os meus dados?', ['Somente usuários autenticados com perfil autorizado: seus professores, a coordenação e a gestão. Os dados são tratados conforme a LGPD.']],
    ],
    coordenador: [
      ['Como cadastro um novo usuário?', ['Acesse <b>Usuários</b> e clique em <b>Novo usuário</b>.', 'Todo usuário pertence a exatamente um perfil: Aluno, Professor, Coordenador ou Gestor (RN-001).', 'A senha inicial é o CPF; no sistema real ela é armazenada apenas como hash bcrypt (RN-006).']],
      ['Como altero a grade curricular de uma turma?', ['Em <b>Turmas</b>, clique em <b>Editar grade</b> no card da turma, marque as disciplinas e salve. Toda turma precisa de ao menos uma disciplina (RN-003).']],
      ['Como redefinir a senha de alguém?', ['Em <b>Usuários</b>, abra o menu da linha e escolha <b>Redefinir senha</b>. A senha volta ao padrão (CPF).']],
    ],
    gestor: [
      ['Como os KPIs são calculados?', ['Taxa de aprovação: alunos com média final ≥ 6,0.', 'Alunos em risco: frequência < 75% ou média < 5,0 (RN-008).', 'Correlação: coeficiente de Pearson entre frequência e nota.']],
      ['Posso exportar os relatórios?', ['Sim. Em <b>Relatórios</b>, use <b>Exportar CSV</b> ou <b>Imprimir</b>.']],
      ['O que aparece na auditoria?', ['Logins, tentativas inválidas, acessos negados e alterações em notas e chamadas, para responsabilização conforme a LGPD (Art. 37).']],
    ],
  };
  EC.route('/faq', {
    title: 'Perguntas frequentes', nav: null,
    render(p, u) {
      const list = FAQ[u.perfil];
      return {
        html: `<div class="page-head"><h1>Perguntas frequentes</h1></div>
          <div class="faq">${list.map(([q, a], i) => `
            <div class="faq-item ${i === 0 ? 'open' : ''}">
              <button class="faq-q" aria-expanded="${i === 0}"><span>${i + 1}. ${esc(q)}</span><span class="circle">${I('arrowDown', 'sm')}</span></button>
              <div class="faq-a"><div>${a.length > 1 ? `<ol>${a.map((x) => `<li>${x}</li>`).join('')}</ol>` : `<p>${a[0]}</p>`}</div></div>
            </div>`).join('')}</div>`,
        after(root) {
          root.querySelectorAll('.faq-q').forEach((b) => b.addEventListener('click', () => {
            const it = b.parentElement;
            const open = !it.classList.contains('open');
            it.classList.toggle('open', open);
            b.setAttribute('aria-expanded', open);
          }));
        },
      };
    },
  });

  /* Mural (RF06): mensagens com conteúdo, autor e data */
  EC.avisosPara = (u) => {
    const todos = EC.state.avisos.concat(D.AVISOS);
    if (u.perfil === 'coordenador' || u.perfil === 'gestor') return todos;
    if (u.perfil === 'aluno') { const t = EC.aluno(u.id).turma; return todos.filter((a) => ['todos', 'alunos', t].includes(a.publico)); }
    const minhas = new Set(D.PROFESSORES.find((p) => p.id === u.id).disc.map(([t]) => t));
    return todos.filter((a) => ['todos', 'professores'].includes(a.publico) || minhas.has(a.publico) || a.autor === u.nome);
  };
  EC.publicoNome = (p) => ({ todos: 'Toda a escola', professores: 'Professores', alunos: 'Alunos' }[p] || (EC.turma(p) ? EC.turma(p).nome : p));
  EC.avisoData = (a) => (a.data ? new Date(a.data) : EC.dateAdd(EC.today(), a.dias));
  EC.publicarAviso = (u, onDone) => {
    const turmas = u.perfil === 'professor' ? [...new Set(D.PROFESSORES.find((p) => p.id === u.id).disc.map(([t]) => t))] : D.TURMAS.map((t) => t.id);
    const opts = (u.perfil === 'professor' ? [] : [['todos', 'Toda a escola'], ['professores', 'Professores'], ['alunos', 'Alunos']]).concat(turmas.map((t) => [t, 'Turma ' + EC.turma(t).nome]));
    EC.modal(`${EC.modalHead('Publicar aviso', 'O aviso aparece no mural do público escolhido, com autor e data.')}
      <form class="modal-body stack" id="av-form" novalidate>
        <div class="field"><label for="av-t">Título</label><input class="input" id="av-t" maxlength="80" placeholder="Ex.: Entrega do trabalho de Física"><span class="msg">Informe um título.</span></div>
        <div class="field"><label for="av-x">Mensagem</label><textarea id="av-x" maxlength="400" placeholder="Escreva o aviso..."></textarea><span class="msg">Escreva a mensagem.</span></div>
        <div class="field"><label for="av-p">Público</label><select id="av-p">${opts.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></div>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="av-ok">${I('send', 'sm')} Publicar</button></div>`, {
      onMount(ov, close) {
        ov.querySelector('#av-ok').addEventListener('click', () => {
          const t = ov.querySelector('#av-t'), x = ov.querySelector('#av-x');
          t.parentElement.classList.toggle('err', !t.value.trim());
          x.parentElement.classList.toggle('err', !x.value.trim());
          if (!t.value.trim() || !x.value.trim()) return;
          EC.state.avisos.unshift({ id: 'n' + Date.now(), titulo: t.value.trim(), texto: x.value.trim(), autor: u.nome, perfil: EC.perfilNome(u.perfil), publico: ov.querySelector('#av-p').value, data: new Date().toISOString() });
          EC.save();
          EC.log('Publicou aviso no mural: ' + t.value.trim());
          close();
          EC.toast('Aviso publicado no mural');
          if (onDone) onDone();
        });
      },
    });
  };

  EC.route('/mural', {
    title: 'Mural', roles: ['aluno', 'coordenador', 'gestor', 'professor'],
    render(p, u) {
      const avisos = EC.avisosPara(u).sort((a, b) => EC.avisoData(b) - EC.avisoData(a));
      const podePublicar = u.perfil !== 'aluno';
      return {
        html: `<div class="page-head"><div><h1>Mural</h1><p>Comunicados por turma, com autoria e data.</p></div>${podePublicar ? `<button class="btn btn-primary" id="novo-aviso">${I('plus', 'sm')} Publicar aviso</button>` : ''}</div>
          <div class="stack" style="max-width:860px">
            ${avisos.map((a, i) => `<article class="card post" style="animation-delay:${i * 40}ms">
              ${EC.avatar({ nome: a.autor, foto: a.autor === 'Ricardo Almeida' ? D.USUARIOS_DEMO.professor.foto : null }, 44)}
              <div><h4>${esc(a.titulo)}</h4><div class="meta"><span>${esc(a.autor)} · ${esc(a.perfil)}</span><span>·</span><span>${EC.fmtDate(EC.avisoData(a))}</span>${EC.chip(EC.publicoNome(a.publico), 'info')}</div></div>
              <p>${esc(a.texto)}</p>
            </article>`).join('') || EC.empty('Nenhum aviso por enquanto.', 'megaphone')}
          </div>`,
        after(root) { root.querySelector('#novo-aviso')?.addEventListener('click', () => EC.publicarAviso(u, render)); },
      };
    },
  });

  document.addEventListener('DOMContentLoaded', render);
})();
