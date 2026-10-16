/* =========================================================
   Perfil Coordenador: gestão de usuários, turmas e disciplinas (RF02)
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc, S = EC.state;

  const resumoTurma = (t) => {
    const al = EC.alunosDaTurma(t.id);
    return {
      n: al.length,
      media: al.length ? D.r1(EC.avg(al.map((a) => EC.mediaGeral(a.id)))) : 0,
      freq: al.length ? Math.round(EC.avg(al.map((a) => a.freq))) : 0,
      risco: al.filter((a) => EC.emRisco(a.id)).length,
    };
  };

  EC.views.inicio_coordenador = (p, u) => {
    const ts = EC.turmas();
    const risco = D.ALUNOS.filter((a) => EC.emRisco(a.id));
    return {
      title: 'Início',
      html: `
        <div class="grid g-home">
          <div class="stack" style="gap:24px">
            <div class="page-head flat" style="margin:0"><div><h1>Olá, ${esc(u.nome.split(' ')[0])}</h1><p>Visão geral da coordenação pedagógica.</p></div></div>
            <div class="grid g-4">
              <a class="card kpi" href="#/usuarios" style="text-decoration:none"><span class="ico">${I('cap')}</span><span class="lab">Alunos</span><span class="val">${D.ALUNOS.length}</span><span class="foot">em ${ts.length} turmas</span></a>
              <a class="card kpi" href="#/usuarios" style="text-decoration:none"><span class="ico">${I('users')}</span><span class="lab">Professores</span><span class="val">${D.PROFESSORES.length}</span><span class="foot">ativos</span></a>
              <a class="card kpi" href="#/turmas" style="text-decoration:none"><span class="ico">${I('layers')}</span><span class="lab">Turmas</span><span class="val">${ts.length}</span><span class="foot">Matutino e Vespertino</span></a>
              <a class="card kpi" href="#/disciplinas" style="text-decoration:none"><span class="ico">${I('book')}</span><span class="lab">Disciplinas</span><span class="val">${Object.keys(D.DISCIPLINAS).length}</span><span class="foot">na grade</span></a>
            </div>
            <section class="card">
              <div class="card-head"><h3>Desempenho das turmas</h3><a class="crumb" href="#/turmas" style="margin:0">Gerenciar ${I('right', 'sm')}</a></div>
              <div class="table-wrap" style="padding:12px 0 8px"><table class="t">
                <thead><tr><th>Turma</th><th>Turno</th><th class="c">Alunos</th><th class="c">Média</th><th class="c">Frequência</th><th class="c">Em risco</th></tr></thead>
                <tbody>${ts.map((t) => { const r = resumoTurma(t); return `<tr><td><a href="#/alunos?t=${t.id}" style="color:var(--ink)">${esc(t.nome)}</a></td><td>${t.turno}</td><td class="c">${r.n}</td><td class="c tnum">${EC.fmtNota(r.media)}</td><td class="c tnum">${r.freq}%</td><td class="c">${r.risco ? EC.chip(r.risco + ' aluno(s)', 'bad', 'warn') : EC.chip('Nenhum', 'ok')}</td></tr>`; }).join('')}</tbody>
              </table></div>
            </section>
            <section class="card">
              <div class="card-head"><h3>Alunos que precisam de atenção</h3><span class="sub">Frequência &lt; 75% ou média &lt; 5,0 (RN-008)</span></div>
              <div style="padding:8px 12px 12px">${risco.slice(0, 6).map((a) => `<a class="dd-item" href="#/alunos/${a.id}">${EC.avatar(a, 36)}<span style="flex:1"><b style="color:var(--ink)">${esc(a.nome)}</b><small>${EC.turma(a.turma).nome} · frequência ${a.freq}% · média ${EC.fmtNota(EC.mediaGeral(a.id))}</small></span>${I('right', 'sm')}</a>`).join('')}</div>
            </section>
          </div>
          ${EC.calendarHtml()}
        </div>`,
      after(root) { EC.mountCalendar(root, u); },
    };
  };

  /* ---------------- Usuários (RN-001, RN-002, RN-006) ---------------- */
  function todosUsuarios() {
    const base = []
      .concat(D.ALUNOS.map((a) => ({ id: a.id, nome: a.nome, perfil: 'aluno', email: a.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ').filter((w, i, x) => i === 0 || i === x.length - 1).join('.') + '@aluno.gentemiudacrescer.com', cpf: a.cpf, turma: a.turma, foto: a.foto, ativo: true })))
      .concat(D.PROFESSORES.map((p) => ({ id: p.id, nome: p.nome, perfil: 'professor', email: p.email, cpf: p.cpf, foto: p.id === 'p1' ? D.USUARIOS_DEMO.professor.foto : null, ativo: true })))
      .concat([D.USUARIOS_DEMO.coordenador, D.USUARIOS_DEMO.gestor].map((x) => ({ ...x, ativo: true })));
    const edits = Object.fromEntries(S.usuarios.map((x) => [x.id, x]));
    return base.map((x) => (edits[x.id] ? { ...x, ...edits[x.id] } : x)).concat(S.usuarios.filter((x) => x.novo));
  }
  const PERFIS = [['aluno', 'Aluno'], ['professor', 'Professor'], ['coordenador', 'Coordenador'], ['gestor', 'Gestor']];
  const PTONE = { aluno: 'info', professor: 'ok', coordenador: 'warn', gestor: 'neutral' };

  function userModal(x, onSave) {
    const edit = !!x;
    x = x || { nome: '', email: '', cpf: '', perfil: '', turma: '' };
    EC.modal(`${EC.modalHead(edit ? 'Editar usuário' : 'Novo usuário', edit ? x.nome : 'A senha inicial é o CPF (somente números).')}
      <form class="modal-body form-grid" id="uf" novalidate>
        <div class="field full"><label for="u-nome">Nome completo</label><input class="input" id="u-nome" value="${esc(x.nome)}" maxlength="80"><span class="msg">Informe o nome completo.</span></div>
        <div class="field"><label for="u-cpf">CPF</label><input class="input" id="u-cpf" inputmode="numeric" value="${esc(EC.fmtCpf(x.cpf || ''))}" ${edit ? 'disabled' : ''} placeholder="000.000.000-00"><span class="msg">CPF deve ter 11 dígitos.</span></div>
        <div class="field"><label for="u-perfil">Perfil</label><select id="u-perfil" ${edit ? 'disabled' : ''}><option value="">Selecione...</option>${PERFIS.map(([v, l]) => `<option value="${v}" ${x.perfil === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="msg">Todo usuário pertence a exatamente um perfil (RN-001).</span></div>
        <div class="field full"><label for="u-email">E-mail</label><input class="input" id="u-email" type="email" value="${esc(x.email)}"><span class="msg">Informe um e-mail válido.</span></div>
        <div class="field full" id="u-turma-f" style="${x.perfil === 'aluno' ? '' : 'display:none'}"><label for="u-turma">Turma</label><select id="u-turma"><option value="">Selecione...</option>${EC.turmas().map((t) => `<option value="${t.id}" ${x.turma === t.id ? 'selected' : ''}>${t.nome} · ${t.turno}</option>`).join('')}</select><span class="hint">O aluno fica matriculado em exatamente uma turma por período letivo (RN-002).</span><span class="msg">Selecione a turma do aluno.</span></div>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="u-ok">${edit ? 'Salvar alterações' : 'Cadastrar usuário'}</button></div>`, {
      onMount(ov, close) {
        const $ = (s) => ov.querySelector(s);
        $('#u-cpf').addEventListener('input', (e) => { e.target.value = EC.fmtCpf(e.target.value); });
        $('#u-perfil').addEventListener('change', (e) => { $('#u-turma-f').style.display = e.target.value === 'aluno' ? '' : 'none'; });
        $('#u-ok').addEventListener('click', () => {
          const nome = $('#u-nome').value.trim(), cpf = $('#u-cpf').value.replace(/\D/g, ''), perfil = $('#u-perfil').value, email = $('#u-email').value.trim(), turma = $('#u-turma').value;
          const errs = { '#u-nome': nome.split(' ').length < 2, '#u-cpf': cpf.length !== 11, '#u-perfil': !perfil, '#u-email': !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), '#u-turma': perfil === 'aluno' && !turma };
          Object.entries(errs).forEach(([s, e]) => $(s).closest('.field').classList.toggle('err', e));
          if (Object.values(errs).some(Boolean)) return;
          onSave({ nome, cpf, perfil, email, turma: perfil === 'aluno' ? turma : '' });
          close();
        });
      },
    });
  }

  EC.route('/usuarios', {
    title: 'Usuários', roles: ['coordenador'],
    render(p, u) {
      return {
        html: `
          <div class="page-head"><div><h1>Usuários</h1><p>Cadastro de alunos, professores, coordenação e gestão.</p></div>
            <button class="btn btn-primary" id="novo">${I('userPlus', 'sm')} Novo usuário</button></div>
          <div class="filters">
            <div class="tabs" role="tablist" id="tabs"></div>
            <div class="search" style="flex:1 1 260px;max-width:360px">${I('search')}<label class="sr-only" for="uq">Buscar usuário</label><input id="uq" type="search" placeholder="Buscar por nome ou e-mail"></div>
          </div>
          <div class="card"><div class="table-wrap"><table class="t" id="ut"></table></div></div>
          <p class="muted" style="font-size:12px;margin-top:12px">${I('shield', 'sm')} CPF exibido parcialmente (minimização de dados, LGPD). Senhas são armazenadas apenas como hash bcrypt (RN-006).</p>`,
        after(root) {
          let tab = 'todos';
          const uq = root.querySelector('#uq');
          function draw() {
            const all = todosUsuarios();
            const cnt = (k) => (k === 'todos' ? all.length : all.filter((x) => x.perfil === k).length);
            root.querySelector('#tabs').innerHTML = [['todos', 'Todos']].concat(PERFIS).map(([k, l]) => `<button role="tab" data-t="${k}" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}">${l}<span class="n">${cnt(k)}</span></button>`).join('');
            const v = uq.value.trim().toLowerCase();
            const list = all.filter((x) => (tab === 'todos' || x.perfil === tab) && (!v || x.nome.toLowerCase().includes(v) || x.email.includes(v)));
            root.querySelector('#ut').innerHTML = `<thead><tr><th>Nome</th><th>Perfil</th><th>CPF</th><th>Vínculo</th><th>Status</th><th class="r">Ações</th></tr></thead>
              <tbody>${list.slice(0, 80).map((x) => `<tr>
                <td><span class="t-name">${EC.avatar(x, 36)}<span>${esc(x.nome)}<small class="muted" style="display:block;font-weight:400;font-size:12px">${esc(x.email)}</small></span></span></td>
                <td>${EC.chip(EC.perfilNome(x.perfil), PTONE[x.perfil])}</td>
                <td class="tnum">${EC.maskCpf(x.cpf)}</td>
                <td>${x.perfil === 'aluno' ? esc(EC.turma(x.turma)?.nome || '-') : x.perfil === 'professor' ? (D.PROFESSORES.find((p) => p.id === x.id)?.disc.length || 0) + ' turmas/disciplinas' : 'Escola'}</td>
                <td>${x.ativo === false ? EC.chip('Inativo', 'neutral') : EC.chip('Ativo', 'ok', 'check')}</td>
                <td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-edit="${x.id}" aria-label="Editar ${esc(x.nome)}">${I('edit', 'sm')}</button> <button class="btn btn-ghost btn-sm" data-reset="${x.id}" title="Redefinir senha" aria-label="Redefinir senha de ${esc(x.nome)}">${I('key', 'sm')}</button></td>
              </tr>`).join('') || `<tr><td colspan="6">${EC.empty('Nenhum usuário encontrado.')}</td></tr>`}</tbody>`;
          }
          root.addEventListener('click', async (e) => {
            const tb = e.target.closest('[data-t]'), ed = e.target.closest('[data-edit]'), rs = e.target.closest('[data-reset]');
            if (tb) { tab = tb.dataset.t; draw(); }
            if (ed) {
              const x = todosUsuarios().find((y) => y.id === ed.dataset.edit);
              userModal(x, (v) => {
                const i = S.usuarios.findIndex((y) => y.id === x.id);
                const rec = { ...(i >= 0 ? S.usuarios[i] : { id: x.id }), nome: v.nome, email: v.email, turma: v.turma || x.turma };
                if (i >= 0) S.usuarios[i] = rec; else S.usuarios.push(rec);
                EC.save(); EC.log('Editou usuário: ' + v.nome); EC.toast('Usuário atualizado'); draw();
              });
            }
            if (rs) {
              const x = todosUsuarios().find((y) => y.id === rs.dataset.reset);
              if (await EC.confirm({ title: 'Redefinir senha?', text: `A senha de ${x.nome} voltará ao padrão (CPF, somente números).`, ok: 'Redefinir' })) { EC.log('Redefiniu senha de ' + x.nome); EC.toast('Senha redefinida para o padrão'); }
            }
          });
          root.querySelector('#novo').addEventListener('click', () => userModal(null, (v) => {
            if (todosUsuarios().some((y) => y.cpf === v.cpf)) { EC.toast('Já existe um usuário com esse CPF.', 'err'); return; }
            S.usuarios.push({ id: 'n' + Date.now(), novo: true, ativo: true, ...v });
            EC.save(); EC.log(`Cadastrou usuário: ${v.nome} (${EC.perfilNome(v.perfil)})`); EC.toast('Usuário cadastrado com sucesso'); tab = v.perfil; draw();
          }));
          uq.addEventListener('input', EC.debounce(draw, 120));
          draw();
        },
      };
    },
  });

  /* ---------------- Turmas (RN-003) ---------------- */
  EC.route('/turmas', {
    title: 'Turmas', roles: ['coordenador'],
    render() {
      return {
        html: `<div class="page-head"><div><h1>Turmas</h1><p>Grade curricular por turma (tabela associativa Turma_Disciplina).</p></div></div>
          <div class="grid g-2">${EC.turmas().map((t, i) => { const r = resumoTurma(t); return `
            <article class="card turma-card" style="animation:rise .4s ${i * 60}ms var(--ease) both">
              <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3>${esc(t.nome)}</h3><p class="muted" style="font-size:14px">${t.serie} · ${t.turno} · ${t.sala}</p></div>${r.risco ? EC.chip(r.risco + ' em risco', 'bad', 'warn') : EC.chip('Sem alertas', 'ok', 'check')}</div>
              <div class="row" style="gap:28px">
                <div><small class="muted">Alunos</small><div style="font-size:24px;font-weight:900;color:var(--ink)">${r.n}</div></div>
                <div><small class="muted">Média</small><div style="font-size:24px;font-weight:900;color:var(--ink)" class="tnum">${EC.fmtNota(r.media)}</div></div>
                <div><small class="muted">Frequência</small><div style="font-size:24px;font-weight:900;color:var(--ink)" class="tnum">${r.freq}%</div></div>
              </div>
              <div><small class="muted" style="font-weight:700">Grade curricular (${t.disciplinas.length})</small><div class="tags" style="margin-top:6px">${t.disciplinas.map((d) => `<span class="tag">${esc(EC.disc(d).curto)}</span>`).join('')}</div></div>
              <div class="row wrap" style="margin-top:4px"><button class="btn btn-primary btn-sm" data-grade="${t.id}">${I('edit', 'sm')} Editar grade</button><a class="btn btn-ghost btn-sm" href="#/alunos?t=${t.id}">${I('users', 'sm')} Ver alunos</a></div>
            </article>`; }).join('')}</div>`,
        after(root) {
          root.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
            const t = EC.turma(b.dataset.grade);
            EC.modal(`${EC.modalHead('Grade curricular · ' + t.nome, 'Marque as disciplinas ministradas nesta turma.')}
              <div class="modal-body"><div class="checks">${Object.values(D.DISCIPLINAS).map((d) => `<label><input type="checkbox" class="check" value="${d.id}" ${t.disciplinas.includes(d.id) ? 'checked' : ''}>${esc(d.nome)}</label>`).join('')}</div>
              <p class="msg" id="g-err" style="display:none;color:var(--bad);font-weight:700;font-size:13px;margin-top:12px">A turma precisa ter ao menos uma disciplina (RN-003).</p></div>
              <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="g-ok">Salvar grade</button></div>`, {
              wide: true,
              onMount(ov, close) {
                ov.querySelector('#g-ok').addEventListener('click', async () => {
                  const sel = [...ov.querySelectorAll('input:checked')].map((x) => x.value);
                  if (!sel.length) { ov.querySelector('#g-err').style.display = 'block'; return; }
                  S.grades[t.id] = sel; EC.save(); EC.log('Atualizou grade curricular: ' + t.nome);
                  close(); await EC.loading(450); EC.toast('Grade curricular atualizada'); EC.render();
                });
              },
            });
          }));
        },
      };
    },
  });

  /* ---------------- Disciplinas ---------------- */
  EC.route('/disciplinas', {
    title: 'Disciplinas', roles: ['coordenador'],
    render() {
      const rows = Object.values(D.DISCIPLINAS).map((d) => {
        const ts = EC.turmas().filter((t) => t.disciplinas.includes(d.id));
        const profs = [...new Set(ts.map((t) => EC.professorDe(t.id, d.id)).filter(Boolean).map((p) => p.nome))];
        return { d, ts, profs };
      });
      return {
        html: `<div class="page-head"><div><h1>Disciplinas</h1><p>Disciplinas, carga horária, turmas e professores responsáveis (Professor_Disciplina).</p></div></div>
          <div class="card"><div class="table-wrap"><table class="t">
            <thead><tr><th>Disciplina</th><th class="c">Carga horária</th><th>Turmas</th><th>Professores</th></tr></thead>
            <tbody>${rows.map(({ d, ts, profs }) => `<tr><td><span class="t-name"><span class="dd-ico" style="background:var(--navy-50);color:var(--navy-700)">${I('book', 'sm')}</span>${esc(d.nome)}</span></td><td class="c tnum">${d.ch} h</td>
              <td><div class="tags">${ts.map((t) => `<span class="tag">${esc(t.nome)}</span>`).join('') || '<span class="muted">Sem turmas</span>'}</div></td>
              <td style="font-weight:400">${profs.map(esc).join(', ') || '<span class="muted">A definir</span>'}</td></tr>`).join('')}</tbody>
          </table></div></div>`,
      };
    },
  });
})();
