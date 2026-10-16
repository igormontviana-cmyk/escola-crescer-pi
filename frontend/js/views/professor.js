/* =========================================================
   Perfil Professor (telas do protótipo Figma de alta fidelidade)
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc, S = EC.state;

  const turmasDoProf = (u) => (u.perfil === 'professor' ? [...new Set(D.PROFESSORES.find((p) => p.id === u.id).disc.map(([t]) => t))] : D.TURMAS.map((t) => t.id));
  const podeEditar = (u, t, d) => u.perfil === 'professor' && EC.lecionaProf(u.id, t, d);

  /* ---------------- Calendário + Próximos eventos (Figma) ---------------- */
  EC.calendarHtml = () => `<div><div class="cal" id="cal"></div><section class="events" id="events" aria-live="polite"></section></div>`;
  EC.mountCalendar = (root, u) => {
    const today = EC.today();
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    const equipe = u.perfil !== 'aluno';
    const evs = D.EVENTOS.filter((e) => equipe || e.publico === 'todos').map((e) => ({ ...e, date: new Date(base.getFullYear(), base.getMonth() + e.m, e.d) })).sort((a, b) => a.date - b.date);
    const dias = [...new Set(evs.map((e) => EC.iso(e.date)))];
    let view = new Date(base);
    let sel = dias.find((d) => EC.fromIso(d) >= today) || dias[dias.length - 1];
    const COR = { navy: 'var(--ev-navy)', green: 'var(--ev-green)', red: 'var(--ev-red)', yellow: 'var(--ev-yellow)' };

    function draw() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1).getDay();
      const n = new Date(y, m + 1, 0).getDate();
      let cells = '';
      for (let i = 0; i < first; i++) cells += '<span></span>';
      for (let d = 1; d <= n; d++) {
        const dt = new Date(y, m, d), iso = EC.iso(dt);
        const de = evs.filter((e) => EC.iso(e.date) === iso);
        const isToday = iso === EC.iso(today);
        cells += `<button class="cal-day ${isToday ? 'today' : ''} ${iso === sel ? 'sel' : ''}" data-d="${iso}" aria-label="${d} de ${EC.MESES[m]}${de.length ? ', ' + de.length + ' evento(s)' : ''}" ${isToday ? 'aria-current="date"' : ''}>${d}${de.length ? `<span class="dots">${de.map((e) => `<i style="background:${COR[e.cor]}"></i>`).join('')}</span>` : ''}</button>`;
      }
      root.querySelector('#cal').innerHTML = `
        <div class="cal-head"><h3>${EC.cap(EC.MESES[m])} ${y}</h3>
          <div class="nav-arrows"><button class="arrow-btn" data-mv="-1" aria-label="Mês anterior">${I('left')}</button><button class="arrow-btn" data-mv="1" aria-label="Próximo mês">${I('right')}</button></div></div>
        <div class="cal-grid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x) => `<span class="dow">${x}</span>`).join('')}${cells}</div>`;
      const de = evs.filter((e) => EC.iso(e.date) === sel);
      const sd = sel ? EC.fromIso(sel) : today;
      root.querySelector('#events').innerHTML = `
        <h2>Próximos Eventos</h2>
        <div class="events-nav"><b>${sd.getDate()} ${EC.cap(EC.MESES[sd.getMonth()].slice(0, 3))}</b><span class="ln"></span>
          <button class="arrow-btn" data-ev="-1" aria-label="Data anterior com eventos">${I('left', 'sm')}</button><button class="arrow-btn" data-ev="1" aria-label="Próxima data com eventos">${I('right', 'sm')}</button></div>
        ${de.length ? de.map((e, i) => `<div class="event" style="border-color:${COR[e.cor]};color:${e.cor === 'navy' ? 'var(--ink)' : e.cor === 'yellow' ? '#e0b000' : COR[e.cor]};animation-delay:${i * 50}ms"><h4>${esc(e.titulo)}</h4><p>${esc(e.texto)}</p></div>`).join('') : '<p class="events-empty">Nenhum evento nesta data.</p>'}`;
    }
    root.addEventListener('click', (e) => {
      const mv = e.target.closest('[data-mv]'), d = e.target.closest('[data-d]'), ev = e.target.closest('[data-ev]');
      if (mv) { view = new Date(view.getFullYear(), view.getMonth() + +mv.dataset.mv, 1); draw(); }
      if (d) { sel = d.dataset.d; draw(); }
      if (ev) {
        const i = dias.indexOf(sel) + +ev.dataset.ev;
        if (i >= 0 && i < dias.length) { sel = dias[i]; const x = EC.fromIso(sel); view = new Date(x.getFullYear(), x.getMonth(), 1); draw(); }
      }
    });
    draw();
  };

  /* ---------------- Página Principal ---------------- */
  EC.avisosHtml = (u, lim = 5) => {
    const lidos = S.lidos[u.id] || {};
    const list = EC.avisosPara(u).sort((a, b) => EC.avisoData(b) - EC.avisoData(a)).slice(0, lim);
    return list.map((a, i) => `
      <article class="aviso ${lidos[a.id] ? 'read' : ''}" style="animation-delay:${i * 50}ms">
        <span class="bang" aria-hidden="true">!</span>
        <h3>${esc(a.titulo)}</h3>
        <input type="checkbox" class="check" data-lido="${a.id}" ${lidos[a.id] ? 'checked' : ''} aria-label="Marcar '${esc(a.titulo)}' como lido">
        <p>${esc(a.texto)}</p>
        <div class="meta">${esc(a.autor)} · ${EC.fmtDate(EC.avisoData(a))} ${EC.chip(EC.publicoNome(a.publico), 'neutral')}</div>
      </article>`).join('') || EC.empty('Sem avisos no momento.', 'megaphone');
  };
  EC.wireAvisos = (root, u) => {
    root.querySelectorAll('[data-lido]').forEach((c) => c.addEventListener('change', () => {
      S.lidos[u.id] = S.lidos[u.id] || {};
      S.lidos[u.id][c.dataset.lido] = c.checked;
      EC.save();
      c.closest('.aviso').classList.toggle('read', c.checked);
    }));
  };

  EC.views.inicio_professor = (p, u) => ({
    title: 'Página Principal',
    html: `
      <div class="grid g-home">
        <div>
          <div class="quick">
            <a class="btn btn-primary" href="#/chamada">${I('clipboard')} Chamada</a>
            <a class="btn btn-primary" href="#/notas">${I('chart')} Notas</a>
            <a class="btn btn-primary" href="#/avaliacoes">${I('fileCheck')} Avaliações</a>
          </div>
          <div class="row" style="justify-content:space-between;margin-bottom:12px">
            <h2 class="section-title" style="margin:0">Avisos</h2>
            <button class="btn btn-soft btn-sm" id="novo-aviso">${I('plus', 'sm')} Publicar aviso</button>
          </div>
          <div class="avisos" id="avisos">${EC.avisosHtml(u, 3)}</div>
          <a class="crumb" href="#/mural" style="margin-top:12px">Ver todos os avisos do mural ${I('right', 'sm')}</a>
        </div>
        ${EC.calendarHtml()}
      </div>`,
    after(root) {
      EC.mountCalendar(root, u);
      EC.wireAvisos(root, u);
      root.querySelector('#novo-aviso').addEventListener('click', () => EC.publicarAviso(u, EC.render));
    },
  });
  EC.route('/inicio', { title: 'Início', render: (p, u) => EC.views['inicio_' + u.perfil](p, u) });

  /* ---------------- Lista de Alunos ---------------- */
  EC.route('/alunos', {
    title: 'Lista de Alunos', roles: ['professor', 'coordenador', 'gestor'],
    render(p, u) {
      const ts = turmasDoProf(u);
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const turma = q.get('t') && ts.includes(q.get('t')) ? q.get('t') : ts[0];
      return {
        html: `
          <div class="page-head flat"><h1>Lista de Alunos</h1></div>
          <div class="filterbar">
            ${EC.selectHtml('Série', ts.map((t) => [t, EC.turma(t).nome]), turma)}
            ${EC.selectHtml('Turno', [['', 'Turno'], ['Matutino', 'Matutino'], ['Vespertino', 'Vespertino']], '')}
            <div class="search">${I('search')}<label class="sr-only" for="fq">Filtrar alunos</label><input id="fq" type="search" placeholder="Filtrar por nome ou matrícula"></div>
          </div>
          <div class="students" id="students"></div>`,
        after(root) {
          const selT = root.querySelector('#Série'), selTurno = root.querySelector('#Turno'), fq = root.querySelector('#fq');
          function draw() {
            const turno = selTurno.value;
            // Turno filtra as séries disponíveis
            [...selT.options].forEach((o) => { o.hidden = !!turno && EC.turma(o.value).turno !== turno; });
            if (selT.selectedOptions[0]?.hidden) { const f = [...selT.options].find((o) => !o.hidden); if (f) selT.value = f.value; }
            const t = selT.value;
            const v = fq.value.trim().toLowerCase();
            const alunos = (turno && EC.turma(t).turno !== turno ? [] : EC.alunosDaTurma(t)).filter((a) => !v || a.nome.toLowerCase().includes(v) || a.matricula.includes(v));
            root.querySelector('#students').innerHTML = alunos.map((a, i) => {
              const media = EC.mediaGeral(a.id), sit = EC.situacao(media);
              return `<div class="st-row" style="animation-delay:${i * 30}ms">
                ${EC.avatar(a, 76, { ring: true, placeholder: true })}
                <div class="pill" title="${esc(a.nome)}">${esc(a.nome)}${EC.emRisco(a.id) ? `<span class="flag" title="RN-008: frequência abaixo de 75% ou média abaixo de 5,0">${I('warn', 'sm')}</span>` : ''}</div>
                <div class="pill center status" title="Média geral ${EC.fmtNota(media)}">${sit}</div>
                <a class="pill center perfil" href="#/alunos/${a.id}" style="text-decoration:none">Perfil</a>
                <a href="#/alunos/${a.id}" aria-label="Frequência de ${esc(a.nome)}: ${a.freq}%. Abrir perfil" style="text-decoration:none">${EC.ring(a.freq, { size: 72, stroke: 9, tone: EC.sitClass(sit) === 'neutral' ? 'ok' : EC.sitClass(sit), fs: 15 })}</a>
              </div>`;
            }).join('') || EC.empty('Nenhum aluno encontrado com esses filtros.');
            EC.animateRings(root);
          }
          selT.addEventListener('change', draw);
          selTurno.addEventListener('change', draw);
          fq.addEventListener('input', EC.debounce(draw, 120));
          draw();
        },
      };
    },
  });

  /* ---------------- Detalhes e info do aluno ---------------- */
  function atividade(a) {
    if (D.ATIVIDADE[a.id]) return D.ATIVIDADE[a.id];
    const t = EC.turma(a.turma), nome = a.nome.split(' ')[0];
    const horas = ['07:45', '08:45', '10:45', '11:45', '18:37', '20:37'];
    return t.disciplinas.slice(0, 6).map((d, i) => {
      const pres = EC.freqDisc(a.id, d) >= 60;
      return i < 4 ? `[${horas[i]}] ${nome} ${pres ? 'marcou presença' : 'faltou'} em ${EC.disc(d).nome}` : `[${horas[i]}] ${nome} ${pres ? 'enviou uma atividade' : 'não entregou a atividade'} de ${EC.disc(d).nome}`;
    });
  }
  EC.route('/alunos/:id', {
    title: 'Detalhes do aluno', roles: ['professor', 'coordenador', 'gestor'], nav: '/alunos',
    render(p, u) {
      const a = EC.aluno(p.id);
      if (!a) return { html: EC.empty('Aluno não encontrado.') };
      const t = EC.turma(a.turma);
      if (u.perfil === 'professor' && !turmasDoProf(u).includes(a.turma)) {
        return { html: `<div class="denied"><div class="big">${I('lock')}</div><h2>Acesso restrito</h2><p>Você só visualiza alunos das turmas em que leciona (RN-007).</p><a class="btn btn-primary" href="#/alunos">Voltar</a></div>` };
      }
      const media = EC.mediaGeral(a.id);
      const occ = S.ocorrencias[a.id] || [];
      return {
        title: a.nome,
        html: `
          <a class="crumb" href="#/alunos?t=${a.turma}">${I('arrowLeft', 'sm')} Lista de Alunos</a>
          <div class="grid g-detail">
            <div class="stack">
              ${EC.photo(a)}
              <div class="box-pill" style="margin-top:8px"><span>${esc(a.nome)}</span>${I('user')}</div>
              <div class="row" style="gap:16px">
                <div class="box-pill" style="flex:1.7"><span>${t.turno}</span>${I('clock')}</div>
                <div class="box-pill" style="flex:none;justify-content:center;padding:0 16px">${esc(t.nome)}</div>
              </div>
              <div class="activity" aria-label="Atividade recente">
                ${atividade(a).map((x) => `<div title="${esc(x)}">${esc(x)}</div>`).join('')}
                <span class="end">(sem mais registros...)</span>
              </div>
              <div class="card card-pad" style="padding:16px 18px">
                <div class="row" style="justify-content:space-between"><b style="color:var(--ink)">Dados do aluno</b>${EC.chip('LGPD', 'info', 'shield')}</div>
                <div style="font-size:14px;color:var(--muted);margin-top:8px;line-height:1.8">
                  Matrícula <b style="color:var(--text)">${a.matricula}</b><br>CPF <b style="color:var(--text)">${EC.maskCpf(a.cpf)}</b><br>Nascimento <b style="color:var(--text)">${a.nasc}</b><br>${esc(a.responsavel)}
                </div>
              </div>
            </div>
            <div>
              <div class="subj-search"><label class="sr-only" for="sq">Pesquisar matérias</label><input id="sq" type="search" placeholder="Pesquisar matérias..."></div>
              <div class="subj-table">
                <div class="subj-head"><span>Matéria</span><span>Faltas</span><span>Notas</span></div>
                <div id="subj-rows"></div>
              </div>
              <div id="occ-box">${occ.length ? `<h3 style="margin:32px 0 4px;font-size:18px">Ocorrências registradas</h3><div class="occ-list">${occ.map((o) => `<div class="occ" style="border-left-color:${o.tipo === 'Elogio' ? 'var(--ok)' : o.tipo === 'Advertência' ? 'var(--bad)' : 'var(--warn)'}"><small>${esc(o.tipo)} · ${esc(o.data)} · ${esc(o.autor)}</small>${esc(o.texto)}</div>`).join('')}</div>` : ''}</div>
            </div>
            <div class="side-metrics">
              <div class="stack" style="align-items:center;gap:12px">
                <div class="metric-label">Frequência</div>
                ${EC.ring(a.freq, { size: 136, stroke: 22, tone: EC.toneFreq(a.freq), fs: 22 })}
              </div>
              <div class="stack" style="align-items:center;gap:12px">
                <div class="metric-label">Média</div>
                ${EC.ring(media * 10, { size: 136, stroke: 22, tone: EC.toneNota(media), label: EC.fmtNota(media), fs: 22 })}
              </div>
              <div class="stack" style="align-items:center;gap:10px;margin-top:8px">
                ${EC.sitChip(EC.situacao(media))}
                ${EC.emRisco(a.id) ? EC.chip('Em risco (RN-008)', 'bad', 'warn') : ''}
              </div>
              ${u.perfil !== 'gestor' ? `<button class="btn btn-grad btn-lg" id="occ-btn" style="margin-top:auto;font-family:var(--font-data)">Ocorrências</button>` : ''}
            </div>
          </div>`,
        after(root) {
          const sq = root.querySelector('#sq');
          function draw() {
            const v = sq.value.trim().toLowerCase();
            const ds = t.disciplinas.filter((d) => EC.disc(d).nome.toLowerCase().includes(v));
            root.querySelector('#subj-rows').innerHTML = ds.map((d, i) => {
              const m = EC.mediaDisc(a.id, d);
              return `<div class="subj-row" style="animation-delay:${i * 35}ms"><div title="${esc(EC.disc(d).nome)}">${esc(EC.disc(d).nome)}</div><div>${EC.faltas(a.id, d)}</div><div class="${m < 5 ? 'low' : ''}">${EC.fmtNota(m)}</div></div>`;
            }).join('') || `<p class="muted" style="padding:24px;text-align:center">Nenhuma matéria encontrada.</p>`;
          }
          sq.addEventListener('input', draw);
          draw();
          root.querySelector('#occ-btn')?.addEventListener('click', () => ocorrenciaModal(a, u));
        },
      };
    },
  });

  // Pop-up de ocorrência (Figma: Ocorrencia / POP-UP Advertências)
  function ocorrenciaModal(a, u) {
    const t = EC.turma(a.turma);
    EC.modal(`
      <div class="occ-modal" role="dialog" aria-modal="true" aria-label="Registrar ocorrência para ${esc(a.nome)}">
        <button class="close-dot" data-close aria-label="Fechar">${I('x', 'sm')}</button>
        <div class="occ-top">
          ${a.fotoHi ? `<div class="photo" style="width:184px;border-radius:50%;background-image:url('${a.fotoHi.src}');border-width:3px" data-f='${JSON.stringify(a.fotoHi)}'></div>` : EC.avatar(a, 184, { placeholder: !a.foto })}
          <div class="pills">
            <div class="box-pill full"><span>${esc(a.nome)}</span>${I('user')}</div>
            <div class="box-pill"><span>${t.turno}</span>${I('clock')}</div>
            <div class="box-pill" style="padding:0 14px">${esc(t.nome)}</div>
          </div>
        </div>
        <div class="types" role="radiogroup" aria-label="Tipo de ocorrência">
          ${['Observação', 'Advertência', 'Elogio'].map((x, i) => `<label><input type="radio" name="tipo" value="${x}" ${i === 0 ? 'checked' : ''}>${x}</label>`).join('')}
        </div>
        <div class="occ-area"><label class="sr-only" for="occ-t">Ocorrência</label><textarea id="occ-t" placeholder="Digite a sua ocorrência..." maxlength="500"></textarea></div>
        <button class="btn btn-grad apply" id="occ-ok">Aplicar</button>
      </div>`, {
      raw: true,
      onMount(ov, close) {
        EC.fitPhotos(ov);
        ov.querySelector('#occ-ok').addEventListener('click', async () => {
          const txt = ov.querySelector('#occ-t').value.trim();
          if (!txt) { EC.toast('Digite a ocorrência antes de aplicar.', 'err'); ov.querySelector('#occ-t').focus(); return; }
          const tipo = ov.querySelector('[name=tipo]:checked').value;
          S.ocorrencias[a.id] = [{ tipo, texto: txt, autor: u.nome, data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }].concat(S.ocorrencias[a.id] || []);
          EC.save();
          EC.log(`Registrou ocorrência (${tipo}) para ${a.nome}`);
          close();
          await EC.loading(450);
          EC.toast('Ocorrência registrada com sucesso');
          EC.render();
        });
      },
    });
  }

  /* ---------------- Notas: escolha de turma e matéria (Figma: Matérias) ---------------- */
  EC.route('/notas', {
    title: 'Notas', roles: ['professor', 'coordenador'],
    render(p, u) {
      const ts = turmasDoProf(u);
      let idx = Math.max(0, ts.indexOf(sessionStorage.getItem('ec-notas-t') || ts[0]));
      return {
        html: `<h1 class="sr-only">Notas</h1><div class="class-switch">
            <button class="tri" data-dir="-1" aria-label="Turma anterior"><svg viewBox="0 0 40 60"><path d="M36 4 6 30l30 26c2 2 4 1 4-2V6c0-3-2-4-4-2z"/></svg></button>
            <div class="class-name" id="cn" aria-live="polite"></div>
            <button class="tri" data-dir="1" aria-label="Próxima turma"><svg viewBox="0 0 40 60"><path d="M4 4l30 26L4 56c-2 2-4 1-4-2V6c0-3 2-4 4-2z"/></svg></button>
          </div>
          <div class="subjects" id="subjects"></div>
          <div class="legend-line">${u.perfil === 'professor' ? `<span>${I('edit', 'sm')} Disciplinas que você leciona: edição liberada</span><span>${I('lock', 'sm')} Outras disciplinas: somente leitura</span>` : `<span>${I('lock', 'sm')} Coordenação: visualização das notas de todas as turmas</span>`}</div>`,
        after(root) {
          function draw() {
            const t = EC.turma(ts[idx]);
            try { sessionStorage.setItem('ec-notas-t', t.id); } catch (e) {}
            root.querySelector('#cn').innerHTML = `<span>${esc(t.nome)}<small>${t.turno}</small></span>`;
            root.querySelector('#subjects').innerHTML = t.disciplinas.map((d, i) => `<a class="subject-btn" href="#/notas/${t.id}/${d}" style="animation-delay:${i * 35}ms;text-decoration:none"><span>${esc(EC.disc(d).nome)}</span>${podeEditar(u, t.id, d) ? '' : I('lock')}</a>`).join('');
          }
          root.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => { idx = (idx + +b.dataset.dir + ts.length) % ts.length; draw(); }));
          draw();
        },
      };
    },
  });

  /* ---------------- Notas da disciplina (Figma: Notas de Matemática Avançada) ---------------- */
  EC.route('/notas/:t/:d', {
    title: 'Notas', roles: ['professor', 'coordenador'], nav: '/notas',
    render(p, u) {
      const t = EC.turma(p.t), d = EC.disc(p.d);
      if (!t || !d) return { html: EC.empty('Turma ou disciplina não encontrada.') };
      const edit = podeEditar(u, p.t, p.d);
      const alunos = EC.alunosDaTurma(p.t);
      const prof = EC.professorDe(p.t, p.d);
      return {
        title: 'Notas de ' + d.nome,
        html: `
          <a class="crumb" href="#/notas">${I('arrowLeft', 'sm')} Matérias de ${esc(t.nome)}</a>
          <div class="page-head flat" style="margin-bottom:28px">
            <div><h1>Notas de ${esc(d.nome)}</h1><p>${esc(t.nome)} · ${t.turno} · Prof. ${esc(prof ? prof.nome : '-')}</p></div>
            <div class="row wrap" id="actions"></div>
          </div>
          <div class="table-wrap grades" id="grades"></div>
          <div class="legend-line" style="justify-content:flex-start;margin-top:16px">
            <span>Média ≥ 6,0: Aprovado</span><span>4,0 a 5,9: Recuperação</span><span>&lt; 4,0: Reprovado</span>
          </div>`,
        after(root) {
          let editing = false;
          const B = ['1º BIM', '2º BIM', '3º BIM', '4º BIM'];
          function draw() {
            root.querySelector('#actions').innerHTML = editing
              ? `<button class="btn btn-ghost" id="cancel">Cancelar</button><button class="btn btn-primary" id="save">${I('check', 'sm')} Salvar notas</button>`
              : `<button class="btn btn-ghost" id="csv">${I('download', 'sm')} Exportar CSV</button>${edit ? `<button class="btn btn-primary" id="edit">${I('edit', 'sm')} Editar notas</button>` : EC.chip('Somente leitura', 'neutral', 'lock')}`;
            root.querySelector('#grades').innerHTML = `<table>
              <thead><tr><th scope="col">Alunos</th>${B.map((b) => `<th scope="col">${b}</th>`).join('')}<th scope="col">Média</th><th scope="col" style="font-size:16px">Situação</th></tr></thead>
              <tbody>${alunos.map((a) => {
                const n = EC.notas(a.id, p.d), m = EC.mediaDisc(a.id, p.d);
                return `<tr><td>${esc(a.nome)}</td>${n.map((x, i) => editing ? `<td><input inputmode="decimal" data-a="${a.id}" data-i="${i}" value="${EC.fmtNota(x)}" aria-label="${esc(a.nome)}, ${B[i]}"></td>` : `<td class="num ${x < 4 ? 'low' : x < 6 ? 'mid' : ''}">${EC.fmtNota(x)}</td>`).join('')}
                  <td class="num" style="font-weight:700">${EC.fmtNota(m)}</td><td style="font-family:var(--font)">${EC.sitChip(EC.situacao(m))}</td></tr>`;
              }).join('')}</tbody></table>`;
            wire();
          }
          function wire() {
            root.querySelector('#edit')?.addEventListener('click', () => { editing = true; draw(); root.querySelector('#grades input')?.focus(); });
            root.querySelector('#cancel')?.addEventListener('click', () => { editing = false; draw(); });
            root.querySelector('#csv')?.addEventListener('click', () => {
              EC.downloadCsv(`notas-${t.nome}-${d.nome}.csv`.replace(/\s+/g, '_'), [['Aluno', ...B, 'Média', 'Situação']].concat(alunos.map((a) => { const m = EC.mediaDisc(a.id, p.d); return [a.nome, ...EC.notas(a.id, p.d).map(EC.fmtNota), EC.fmtNota(m), EC.situacao(m)]; })));
              EC.toast('Arquivo CSV gerado', 'info');
            });
            root.querySelectorAll('#grades input').forEach((inp) => inp.addEventListener('input', () => {
              const v = parseFloat(inp.value.replace(',', '.'));
              inp.classList.toggle('invalid', isNaN(v) || v < 0 || v > 10);
            }));
            root.querySelector('#save')?.addEventListener('click', async () => {
              const inputs = [...root.querySelectorAll('#grades input')];
              const bad = inputs.filter((i) => { const v = parseFloat(i.value.replace(',', '.')); return isNaN(v) || v < 0 || v > 10; });
              inputs.forEach((i) => i.classList.toggle('invalid', bad.includes(i)));
              // Validação antes de gravar (aprendizado da PoC 2)
              if (bad.length) { EC.toast(`Corrija ${bad.length} nota(s): use valores de 0 a 10.`, 'err'); bad[0].focus(); return; }
              if (!(await EC.confirm({ title: 'Confirmar lançamento?', text: `As notas de ${d.nome} da turma ${t.nome} serão atualizadas no boletim dos alunos.`, ok: 'Salvar notas' }))) return;
              alunos.forEach((a) => {
                const arr = EC.notas(a.id, p.d);
                inputs.filter((i) => i.dataset.a === a.id).forEach((i) => { arr[+i.dataset.i] = D.r1(parseFloat(i.value.replace(',', '.'))); });
                EC.setNotas(a.id, p.d, arr);
              });
              EC.log(`Editou notas: ${d.nome}, ${t.nome}`);
              await EC.loading(600);
              editing = false;
              draw();
              EC.toast('Notas salvas com sucesso');
            });
          }
          draw();
        },
      };
    },
  });

  /* ---------------- Chamada (Figma: Chamada) ---------------- */
  const aulasDoDia = (u, dt) => (u.perfil === 'professor' ? D.HORARIO[dt.getDay()] || [] : []);
  const chaveCh = (t, d, iso) => `${t}|${d}|${iso}`;
  EC.chamadaStatus = (t, d, iso) => {
    if (S.chamadas[chaveCh(t, d, iso)]) return 'Registrada';
    const today = EC.iso(EC.today());
    return iso < today ? 'Registrada' : iso === today ? 'Pendente' : 'Agendada';
  };
  // Presença simulada para aulas passadas, proporcional à frequência do aluno
  const presencaSimulada = (a, d, iso) => (D.hash(a.id + d + iso) % 100) < EC.freqDisc(a.id, d);
  EC.presentes = (t, d, iso) => {
    const s = S.chamadas[chaveCh(t, d, iso)];
    if (s) return new Set(s.presentes);
    if (iso < EC.iso(EC.today())) return new Set(EC.alunosDaTurma(t).filter((a) => presencaSimulada(a, d, iso)).map((a) => a.id));
    return new Set(); // nova chamada: todos começam "Ausente" (Figma)
  };

  EC.route('/chamada', {
    title: 'Chamada', roles: ['professor'],
    render(p, u) {
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const today = EC.today();
      const view = q.get('m') ? EC.fromIso(q.get('m') + '-01') : new Date(today.getFullYear(), today.getMonth(), 1);
      const y = view.getFullYear(), m = view.getMonth();
      const n = new Date(y, m + 1, 0).getDate();
      const days = [];
      for (let i = 1; i <= n; i++) { const dt = new Date(y, m, i); const aulas = aulasDoDia(u, dt); if (aulas.length) days.push([dt, aulas]); }
      const mk = (k) => { const x = new Date(y, m + k, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
      const statusTone = { Registrada: 'ok', Pendente: 'warn', Agendada: 'neutral' };
      return {
        html: `
          <div class="page-head"><h1>Chamada</h1></div>
          <h2 style="font-size:24px;font-weight:700;margin:0 0 24px 8px">Suas matérias</h2>
          <div class="month-bar">
            <button data-m="${mk(-1)}">${I('left', 'sm')} Mês anterior</button>
            <b>${EC.MESES[m]} ${y}</b>
            <button data-m="${mk(1)}">Próximo mês ${I('right', 'sm')}</button>
          </div>
          ${days.map(([dt, aulas], k) => {
            const iso = EC.iso(dt);
            const isToday = iso === EC.iso(today);
            const pend = aulas.filter(([t, d]) => EC.chamadaStatus(t, d, iso) === 'Pendente').length;
            return `<section class="day-card" ${isToday ? 'id="hoje"' : ''} style="animation-delay:${Math.min(k, 8) * 35}ms">
              <h4>${EC.fmtLong(dt)}${isToday ? EC.chip('Hoje', 'info', 'calendar') : ''}${pend ? EC.chip(pend + ' pendente(s)', 'warn', 'clock') : ''}</h4>
              <div class="lessons">${aulas.map(([t, d]) => {
                const st = EC.chamadaStatus(t, d, iso), T = EC.turma(t);
                return `<div class="lesson">
                  <span class="done">${EC.chip(st, statusTone[st], st === 'Registrada' ? 'check' : st === 'Pendente' ? 'clock' : 'calendar')}</span>
                  <h5>${EC.disc(d).curto} - ${T.curto}</h5><div class="turno">${T.turno}</div>
                  ${st === 'Agendada' ? `<button class="btn btn-primary" disabled title="A chamada fica disponível no dia da aula">Lista de presença</button>` : `<a class="btn btn-primary" href="#/chamada/${t}/${d}/${iso}">Lista de presença</a>`}
                </div>`;
              }).join('')}</div>
            </section>`;
          }).join('') || EC.empty('Nenhuma aula neste mês.', 'calendar')}`,
        after(root) {
          root.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { location.hash = '/chamada?m=' + b.dataset.m; }));
          const h = root.querySelector('#hoje');
          if (h) requestAnimationFrame(() => window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 96));
        },
      };
    },
  });

  /* ---------------- Lista de presença (Figma: Chamada 2) ---------------- */
  EC.route('/chamada/:t/:d/:date', {
    title: 'Chamada', roles: ['professor'], nav: '/chamada',
    render(p, u) {
      const t = EC.turma(p.t), d = EC.disc(p.d);
      if (!t || !d || !EC.lecionaProf(u.id, p.t, p.d)) return { html: `<div class="denied"><div class="big">${I('lock')}</div><h2>Acesso restrito</h2><p>Você só registra chamada das disciplinas que leciona (RN-007).</p><a class="btn btn-primary" href="#/chamada">Voltar</a></div>` };
      const dt = EC.fromIso(p.date);
      const alunos = EC.alunosDaTurma(p.t);
      const pres = EC.presentes(p.t, p.d, p.date);
      const st = EC.chamadaStatus(p.t, p.d, p.date);
      return {
        html: `
          <a class="crumb" href="#/chamada?m=${p.date.slice(0, 7)}">${I('arrowLeft', 'sm')} Suas matérias</a>
          <div class="page-head"><div><h1>Chamada</h1><p>${esc(d.nome)} · ${esc(t.nome)} · ${t.turno} · ${EC.fmtLong(dt)}</p></div>${EC.chip(st === 'Registrada' ? 'Chamada registrada' : 'Chamada pendente', st === 'Registrada' ? 'ok' : 'warn', st === 'Registrada' ? 'check' : 'clock')}</div>
          <div class="att-tools">
            <div class="date-field"><label for="dt">Data</label><input id="dt" type="date" value="${p.date}" max="${EC.iso(EC.today())}"></div>
            <button class="btn btn-primary" id="gerar">Gerar chamada</button>
            <span class="spacer"></span>
            <div class="att-summary" id="sum"></div>
          </div>
          <div class="table-wrap">
            <table class="t att">
              <thead><tr><th style="width:52px"><input type="checkbox" class="check round" id="all" aria-label="Marcar todos como presentes"></th><th style="width:60px">#</th><th>Nome do aluno</th><th>Matrícula</th><th>Status</th></tr></thead>
              <tbody>${alunos.map((a, i) => `<tr data-row="${a.id}">
                <td><input type="checkbox" class="check round" data-a="${a.id}" ${pres.has(a.id) ? 'checked' : ''} aria-label="Presença de ${esc(a.nome)}"></td>
                <td>${i + 1}</td>
                <td><span class="t-name" style="font-weight:700;color:#5b6573">${EC.avatar(a, 30)}${esc(a.nome)}</span></td>
                <td>#${a.matricula}</td>
                <td class="st-cell"></td></tr>`).join('')}</tbody>
            </table>
          </div>
          <div style="margin:40px 0 0" class="row wrap save-bar">
            <button class="btn btn-primary btn-lg" id="salvar">Salvar</button>
            <span class="muted" style="font-size:13px">Registro por disciplina, turma e data (RN-004).</span>
          </div>`,
        after(root) {
          const boxes = [...root.querySelectorAll('[data-a]')];
          const all = root.querySelector('#all');
          function sync() {
            let np = 0;
            boxes.forEach((b) => {
              const tr = b.closest('tr');
              tr.classList.toggle('present', b.checked);
              tr.querySelector('.st-cell').innerHTML = b.checked ? `<span class="st p">${I('check', 'sm')} Presente</span>` : '<span class="st">Ausente</span>';
              if (b.checked) np++;
            });
            all.checked = np === boxes.length;
            all.indeterminate = np > 0 && np < boxes.length;
            root.querySelector('#sum').innerHTML = `${EC.chip(np + ' presentes', 'ok')} ${EC.chip(boxes.length - np + ' ausentes', 'neutral')}`;
          }
          boxes.forEach((b) => b.addEventListener('change', sync));
          // Tocar em qualquer parte da linha alterna a presença (alvo grande no celular)
          root.querySelectorAll('tbody tr[data-row]').forEach((tr) => tr.addEventListener('click', (e) => {
            if (e.target.closest('input')) return;
            const b = tr.querySelector('[data-a]');
            b.checked = !b.checked;
            sync();
          }));
          all.addEventListener('change', () => { boxes.forEach((b) => (b.checked = all.checked)); sync(); });
          root.querySelector('#gerar').addEventListener('click', () => {
            const v = root.querySelector('#dt').value;
            if (!v) return;
            if (v > EC.iso(EC.today())) { EC.toast('Não é possível gerar chamada para uma data futura.', 'err'); return; }
            location.hash = `/chamada/${p.t}/${p.d}/${v}`;
          });
          root.querySelector('#salvar').addEventListener('click', async () => {
            const presentes = boxes.filter((b) => b.checked).map((b) => b.dataset.a);
            if (!(await EC.confirm({ title: 'Salvar chamada?', text: `${presentes.length} presentes e ${boxes.length - presentes.length} ausentes em ${d.nome} (${t.nome}), ${EC.fmtDate(dt)}.`, ok: 'Salvar chamada' }))) return;
            S.chamadas[chaveCh(p.t, p.d, p.date)] = { presentes, em: new Date().toISOString() };
            EC.save();
            EC.log(`Registrou chamada: ${d.nome}, ${t.nome} (${EC.fmtDate(dt)})`);
            await EC.loading(650);
            EC.toast('Chamada salva com sucesso');
            EC.render();
          });
          sync();
        },
      };
    },
  });

  /* ---------------- Avaliações (RF03, RN-005) ---------------- */
  const TIPOS = { Prova: 0, Trabalho: 0.4, Lista: -0.6 };
  EC.avaliacoes = (t, d) => {
    const y = EC.today().getFullYear();
    const base = [];
    [[1, 2, 10], [2, 5, 9], [3, 8, 15], [4, 9, 6]].forEach(([b, mes, dia]) => {
      base.push({ id: `${t}-${d}-b${b}-l`, bim: b, nome: 'Lista de exercícios', tipo: 'Lista', peso: 2, data: EC.iso(new Date(y, mes, dia)) });
      base.push({ id: `${t}-${d}-b${b}-t`, bim: b, nome: 'Trabalho em grupo', tipo: 'Trabalho', peso: 3, data: EC.iso(new Date(y, mes, dia + 7)) });
      base.push({ id: `${t}-${d}-b${b}-p`, bim: b, nome: 'Prova bimestral', tipo: 'Prova', peso: 5, data: EC.iso(new Date(y, b === 4 ? 10 : mes + 1, b === 4 ? 24 : 2)) });
    });
    return base.concat((S.avaliacoes[t + '|' + d] || []));
  };
  EC.notaAv = (a, av, d) => {
    const k = 'av|' + av.id + '|' + a.id;
    if (S.notas[k] != null) return S.notas[k];
    if (av.custom) return null;
    if (av.bim === 4 && av.tipo === 'Prova') return null; // ainda não aplicada
    const b = EC.notas(a.id, d)[av.bim - 1];
    return b === 0 ? 0 : D.r1(D.clamp(b + TIPOS[av.tipo]));
  };
  EC.statusAv = (t, d, av) => {
    if (av.bim < EC.bimestreAtual() || S.publicadas[`${t}|${d}|${av.bim}`]) return 'Publicada';
    const alunos = EC.alunosDaTurma(t);
    return alunos.every((a) => EC.notaAv(a, av, d) != null) ? 'Lançada' : 'Pendente';
  };
  const AV_TONE = { Publicada: 'ok', 'Lançada': 'info', Pendente: 'warn' };

  EC.route('/avaliacoes', {
    title: 'Avaliações', roles: ['professor'],
    render(p, u) {
      const pares = D.PROFESSORES.find((x) => x.id === u.id).disc;
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const sel = q.get('k') || pares[0].join('|');
      const [t, d] = sel.split('|');
      const bim = +(q.get('b') || EC.bimestreAtual());
      const avs = EC.avaliacoes(t, d).filter((a) => a.bim === bim);
      const alunos = EC.alunosDaTurma(t);
      const pesoTotal = avs.reduce((s, a) => s + a.peso, 0);
      const todasLancadas = avs.length && avs.every((a) => EC.statusAv(t, d, a) !== 'Pendente');
      const publicada = bim < EC.bimestreAtual() || S.publicadas[`${t}|${d}|${bim}`];
      return {
        html: `
          <div class="page-head"><div><h1>Avaliações</h1><p>Cada avaliação pertence a uma disciplina e tem peso definido (RN-005).</p></div>
            <button class="btn btn-primary" id="nova">${I('plus', 'sm')} Nova avaliação</button></div>
          <div class="filters">
            ${EC.selectHtml('Turma e disciplina', pares.map(([tt, dd]) => [tt + '|' + dd, `${EC.disc(dd).nome} · ${EC.turma(tt).nome}`]), sel, 'light')}
            <div class="tabs" role="tablist">${[1, 2, 3, 4].map((b) => `<button role="tab" data-b="${b}" class="${b === bim ? 'on' : ''}" aria-selected="${b === bim}">${b}º Bimestre</button>`).join('')}</div>
          </div>
          ${publicada ? `<div class="alert-banner info">${I('check')}<div><b>Notas do ${bim}º bimestre publicadas no boletim</b>A média ponderada das avaliações já está disponível para os alunos.</div></div>`
            : todasLancadas ? `<div class="alert-banner info">${I('fileCheck')}<div style="flex:1"><b>Todas as avaliações foram lançadas</b>Publique a média ponderada no boletim do ${bim}º bimestre.</div><button class="btn btn-primary btn-sm" id="publicar">Publicar no boletim</button></div>`
            : `<div class="alert-banner">${I('clock')}<div><b>Há avaliações pendentes neste bimestre</b>Lance as notas de todas as avaliações para publicar a média no boletim.</div></div>`}
          <div class="card">
            <div class="table-wrap"><table class="t">
              <thead><tr><th>Avaliação</th><th>Data</th><th class="c">Peso</th><th class="c">Média da turma</th><th>Status</th><th class="r">Ações</th></tr></thead>
              <tbody>${avs.map((av) => {
                const st = EC.statusAv(t, d, av);
                const ns = alunos.map((a) => EC.notaAv(a, av, d)).filter((x) => x != null);
                return `<tr><td><span class="t-name"><span class="dd-ico" style="background:var(--navy-50);color:var(--navy-700)">${I(av.tipo === 'Prova' ? 'fileText' : av.tipo === 'Trabalho' ? 'users' : 'note', 'sm')}</span><span>${esc(av.nome)}<small class="muted" style="display:block;font-weight:400;font-size:12px">${esc(av.tipo)}</small></span></span></td>
                  <td>${EC.fmtDate(EC.fromIso(av.data))}</td><td class="c">${av.peso}</td>
                  <td class="c tnum">${ns.length ? EC.fmtNota(EC.avg(ns)) : '–'}</td>
                  <td>${EC.chip(st, AV_TONE[st], st === 'Publicada' ? 'check' : st === 'Pendente' ? 'clock' : 'fileCheck')}</td>
                  <td class="r"><a class="btn ${st === 'Pendente' ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#/avaliacoes/${encodeURIComponent(av.id)}?k=${encodeURIComponent(sel)}">${st === 'Publicada' ? 'Ver notas' : st === 'Pendente' ? 'Lançar notas' : 'Editar notas'}</a></td></tr>`;
              }).join('')}</tbody>
              <tfoot><tr><td colspan="2" style="border:0;color:var(--muted)">Peso total do bimestre</td><td class="c" style="border:0;color:${pesoTotal === 10 ? 'var(--ok)' : 'var(--warn)'}">${pesoTotal}</td><td colspan="3" style="border:0"></td></tr></tfoot>
            </table></div>
          </div>`,
        after(root) {
          const nav = (k, b) => { location.hash = `/avaliacoes?k=${encodeURIComponent(k)}&b=${b}`; };
          root.querySelector('select').addEventListener('change', (e) => nav(e.target.value, bim));
          root.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => nav(sel, b.dataset.b)));
          root.querySelector('#publicar')?.addEventListener('click', async () => {
            if (!(await EC.confirm({ title: 'Publicar no boletim?', text: `A média ponderada das ${avs.length} avaliações substituirá a nota do ${bim}º bimestre de ${EC.disc(d).nome} (${EC.turma(t).nome}).`, ok: 'Publicar' }))) return;
            alunos.forEach((a) => {
              let sp = 0, sw = 0;
              avs.forEach((av) => { const n = EC.notaAv(a, av, d); if (n != null) { sp += n * av.peso; sw += av.peso; } });
              const arr = EC.notas(a.id, d);
              arr[bim - 1] = sw ? D.r1(sp / sw) : 0;
              EC.setNotas(a.id, d, arr);
            });
            S.publicadas[`${t}|${d}|${bim}`] = true;
            EC.save();
            EC.log(`Publicou notas do ${bim}º bimestre: ${EC.disc(d).nome}, ${EC.turma(t).nome}`);
            await EC.loading(700);
            EC.toast('Notas publicadas no boletim');
            EC.render();
          });
          root.querySelector('#nova').addEventListener('click', () => {
            EC.modal(`${EC.modalHead('Nova avaliação', `${EC.disc(d).nome} · ${EC.turma(t).nome} · ${bim}º bimestre`)}
              <form class="modal-body form-grid" id="nf" novalidate>
                <div class="field full"><label for="n-nome">Nome</label><input class="input" id="n-nome" placeholder="Ex.: Seminário de Ondulatória" maxlength="60"><span class="msg">Informe o nome.</span></div>
                <div class="field"><label for="n-tipo">Tipo</label><select id="n-tipo"><option>Prova</option><option>Trabalho</option><option>Lista</option></select></div>
                <div class="field"><label for="n-peso">Peso</label><input class="input" id="n-peso" type="number" min="1" max="10" value="2"><span class="msg">Peso entre 1 e 10.</span></div>
                <div class="field full"><label for="n-data">Data</label><input class="input" id="n-data" type="date" value="${EC.iso(EC.today())}"></div>
              </form>
              <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="n-ok">Criar avaliação</button></div>`, {
              onMount(ov, close) {
                ov.querySelector('#n-ok').addEventListener('click', () => {
                  const nome = ov.querySelector('#n-nome'), peso = ov.querySelector('#n-peso');
                  const okN = !!nome.value.trim(), okP = +peso.value >= 1 && +peso.value <= 10;
                  nome.parentElement.classList.toggle('err', !okN);
                  peso.parentElement.classList.toggle('err', !okP);
                  if (!okN || !okP) return;
                  const k = t + '|' + d;
                  S.avaliacoes[k] = (S.avaliacoes[k] || []).concat([{ id: `${t}-${d}-c${Date.now()}`, bim, nome: nome.value.trim(), tipo: ov.querySelector('#n-tipo').value, peso: +peso.value, data: ov.querySelector('#n-data').value || EC.iso(EC.today()), custom: true }]);
                  delete S.publicadas[`${t}|${d}|${bim}`];
                  EC.save();
                  EC.log(`Criou avaliação "${nome.value.trim()}" (${EC.disc(d).nome})`);
                  close();
                  EC.toast('Avaliação criada');
                  EC.render();
                });
              },
            });
          });
        },
      };
    },
  });

  EC.route('/avaliacoes/:id', {
    title: 'Lançar notas', roles: ['professor'], nav: '/avaliacoes',
    render(p, u) {
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const [t, d] = (q.get('k') || '').split('|');
      const av = t && d ? EC.avaliacoes(t, d).find((x) => x.id === p.id) : null;
      if (!av || !EC.lecionaProf(u.id, t, d)) return { html: EC.empty('Avaliação não encontrada.') };
      const st = EC.statusAv(t, d, av);
      const ro = st === 'Publicada';
      const alunos = EC.alunosDaTurma(t);
      return {
        title: av.nome,
        html: `
          <a class="crumb" href="#/avaliacoes?k=${encodeURIComponent(t + '|' + d)}&b=${av.bim}">${I('arrowLeft', 'sm')} Avaliações</a>
          <div class="page-head"><div><h1>${esc(av.nome)}</h1><p>${esc(EC.disc(d).nome)} · ${esc(EC.turma(t).nome)} · ${av.bim}º bimestre · peso ${av.peso} · ${EC.fmtDate(EC.fromIso(av.data))}</p></div>${EC.chip(st, AV_TONE[st])}</div>
          <div class="card"><div class="table-wrap"><table class="t">
            <thead><tr><th>#</th><th>Aluno</th><th>Matrícula</th><th class="c">Nota (0 a 10)</th></tr></thead>
            <tbody>${alunos.map((a, i) => { const n = EC.notaAv(a, av, d); return `<tr><td>${i + 1}</td><td><span class="t-name">${EC.avatar(a, 30)}${esc(a.nome)}</span></td><td>#${a.matricula}</td>
              <td class="c">${ro ? `<b class="tnum">${n == null ? '–' : EC.fmtNota(n)}</b>` : `<input class="input tnum" style="width:96px;text-align:center;height:38px" inputmode="decimal" data-a="${a.id}" value="${n == null ? '' : EC.fmtNota(n)}" placeholder="–" aria-label="Nota de ${esc(a.nome)}">`}</td></tr>`; }).join('')}</tbody>
          </table></div></div>
          ${ro ? '' : `<div class="row" style="margin-top:24px"><button class="btn btn-primary btn-lg" id="save">Salvar notas</button><span class="muted" style="font-size:13px">Campos vazios ficam como pendentes.</span></div>`}`,
        after(root) {
          const inputs = [...root.querySelectorAll('[data-a]')];
          const valid = (i) => { if (!i.value.trim()) return true; const v = parseFloat(i.value.replace(',', '.')); return !isNaN(v) && v >= 0 && v <= 10; };
          inputs.forEach((i) => i.addEventListener('input', () => { i.style.borderColor = valid(i) ? '' : 'var(--bad)'; i.style.background = valid(i) ? '' : 'var(--bad-bg)'; }));
          root.querySelector('#save')?.addEventListener('click', async () => {
            const bad = inputs.filter((i) => !valid(i));
            if (bad.length) { EC.toast(`Corrija ${bad.length} nota(s): use valores de 0 a 10.`, 'err'); bad[0].focus(); return; }
            if (!(await EC.confirm({ title: 'Confirmar lançamento?', text: `Salvar as notas de "${av.nome}" para ${inputs.filter((i) => i.value.trim()).length} aluno(s).`, ok: 'Salvar notas' }))) return;
            inputs.forEach((i) => { const k = 'av|' + av.id + '|' + i.dataset.a; if (i.value.trim()) S.notas[k] = D.r1(parseFloat(i.value.replace(',', '.'))); else delete S.notas[k]; });
            EC.save();
            EC.log(`Lançou notas: ${av.nome} (${EC.disc(d).nome}, ${EC.turma(t).nome})`);
            await EC.loading(600);
            EC.toast('Notas lançadas com sucesso');
            location.hash = `/avaliacoes?k=${encodeURIComponent(t + '|' + d)}&b=${av.bim}`;
          });
        },
      };
    },
  });
})();
