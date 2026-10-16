/* =========================================================
   Perfil Gestor: Dashboard de KPIs (RF08), Relatórios (RF07),
   Alunos em risco (RN-008) e Auditoria LGPD (RN-009)
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc, S = EC.state;
  EC._charts = EC._charts || [];

  const pearson = (xs, ys) => {
    const n = xs.length, mx = EC.avg(xs), my = EC.avg(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  };
  const desvio = (xs) => { const m = EC.avg(xs); return Math.sqrt(EC.avg(xs.map((x) => (x - m) ** 2))); };
  const fmt = (n, c = 1) => n.toFixed(c).replace('.', ',');

  // Estilo dos gráficos: série única na cor da marca, grade recessiva, texto em tinta neutra
  const INK = '#5a6a7e', GRID = '#e8edf3', BRAND = '#0c4a8a';
  function baseOpts(extra = {}) {
    return {
      responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0b2545', titleFont: { family: 'Lato', weight: '700' }, bodyFont: { family: 'Lato' }, padding: 10, cornerRadius: 8, displayColors: false },
      },
      scales: {
        x: { grid: { display: false }, border: { color: GRID }, ticks: { color: INK, font: { family: 'Lato', size: 12 } } },
        y: { grid: { color: GRID }, border: { display: false }, ticks: { color: INK, font: { family: 'Lato', size: 12 } } },
      },
      ...extra,
    };
  }
  // Linha de referência (limiar) desenhada como plugin, rotulada
  const refLine = (value, label, color) => ({
    id: 'ref' + label,
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales } = chart;
      const horizontal = chart.options.indexAxis === 'y';
      const px = horizontal ? scales.x.getPixelForValue(value) : scales.y.getPixelForValue(value);
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      if (horizontal) { ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); } else { ctx.moveTo(a.left, px); ctx.lineTo(a.right, px); }
      ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = '700 11px Lato';
      if (horizontal) ctx.fillText(label, px - ctx.measureText(label).width / 2, a.top - 6); else ctx.fillText(label, a.right - ctx.measureText(label).width, px - 6);
      ctx.restore();
    },
  });
  function chart(canvas, cfg) {
    if (!window.Chart) { canvas.parentElement.innerHTML = '<p class="muted" style="padding:24px">Gráfico indisponível sem conexão (Chart.js). Os dados estão na tabela de Relatórios.</p>'; return; }
    EC._charts.push(new Chart(canvas, cfg));
  }
  const killCharts = () => { EC._charts.forEach((c) => c.destroy()); EC._charts = []; };
  EC.killCharts = killCharts;

  function dadosDashboard(turma) {
    if (turma === 'todas') {
      return {
        k: D.KPIS,
        sit: [['Aprovados', 78, 'ok'], ['Recuperação', 10, 'warn'], ['Reprovados', 12, 'bad']],
        bars: D.ESTAT.map((e) => [e.disc, e.media]),
        line: D.FREQ_MENSAL,
        pts: D.DISPERSAO,
        risco: EC.alunos().filter((a) => a.ativo !== false && EC.emRisco(a.id)),
      };
    }
    const t = EC.turma(turma), al = EC.alunosDaTurma(turma);
    const n = al.length || 1;
    // Alunos recém-matriculados (sem nota) entram na frequência, mas não nas médias
    const comNota = al.map((a) => ({ a, m: EC.mediaGeral(a.id) })).filter((x) => x.m != null);
    const freqs = al.map((a) => a.freq);
    const sitc = (s) => Math.round((comNota.filter((x) => EC.situacao(x.m) === s).length / n) * 100);
    const fm = freqs.length ? EC.avg(freqs) : 0;
    const mediaDe = (d) => { const v = al.map((a) => EC.mediaDisc(a.id, d)).filter((m) => m != null); return v.length ? D.r1(EC.avg(v)) : 0; };
    return {
      k: { aprovacao: sitc('Aprovado'), frequencia: Math.round(fm), risco: Math.round((al.filter((a) => EC.emRisco(a.id)).length / n) * 100), correlacao: D.r1(pearson(comNota.map((x) => x.a.freq), comNota.map((x) => x.m)) * 10) / 10 },
      sit: [['Aprovados', sitc('Aprovado'), 'ok'], ['Recuperação', sitc('Recuperação'), 'warn'], ['Reprovados', sitc('Reprovado'), 'bad']],
      bars: t.disciplinas.map((d) => [EC.disc(d).curto, mediaDe(d)]),
      line: D.FREQ_MENSAL.map(([m, v]) => [m, Math.round(Math.max(0, Math.min(100, v + (fm - 83))))]),
      pts: comNota.map((x) => ({ x: x.a.freq, y: x.m, nome: x.a.nome })),
      risco: al.filter((a) => EC.emRisco(a.id)),
    };
  }

  /* ---------------- Dashboard ---------------- */
  EC.route('/dashboard', {
    title: 'Dashboard', roles: ['gestor'],
    render(p, u) {
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const turma = q.get('t') || 'todas';
      const x = dadosDashboard(turma);
      const k = x.k;
      const tone = { ap: k.aprovacao >= 70 ? 'ok' : 'bad', fr: k.frequencia >= 75 ? 'ok' : 'bad', ri: k.risco <= 10 ? 'ok' : 'warn' };
      const r = turma === 'todas' ? k.correlacao : pearson(x.pts.map((p) => p.x), x.pts.map((p) => p.y));
      return {
        html: `
          <div class="page-head"><div><h1>Dashboard estratégico</h1><p>Indicadores de aprovação e frequência para apoio à decisão pedagógica.</p></div>
            <div class="filters" style="margin:0">${EC.selectHtml('Turma', [['todas', 'Todas as turmas']].concat(EC.turmas().map((t) => [t.id, t.nome])), turma, 'light')}</div></div>
          ${k.risco > 10 ? `<div class="alert-banner">${I('warn')}<div><b>Alerta: ${k.risco}% dos alunos em risco</b>Frequência abaixo de 75% ou média abaixo de 5,0 (RN-008). <a href="#/risco">Ver alunos</a></div></div>` : ''}
          <div class="grid g-4" style="margin-bottom:24px">
            <div class="card kpi"><span class="ico">${I('check')}</span><span class="lab">Taxa de aprovação</span><span class="val">${k.aprovacao}<small>%</small></span><span class="foot">${EC.chip(tone.ap === 'ok' ? 'Acima do limiar de 70%' : 'Abaixo de 70%', tone.ap, tone.ap === 'ok' ? 'check' : 'warn')}</span></div>
            <div class="card kpi"><span class="ico">${I('clipboard')}</span><span class="lab">Frequência média geral</span><span class="val">${k.frequencia}<small>%</small></span><span class="foot">${EC.chip(tone.fr === 'ok' ? 'Acima de 75%' : 'Abaixo de 75%', tone.fr, tone.fr === 'ok' ? 'check' : 'warn')}</span></div>
            <div class="card kpi"><span class="ico">${I('warn')}</span><span class="lab">Alunos em risco</span><span class="val">${k.risco}<small>%</small></span><span class="foot">${EC.chip(tone.ri === 'ok' ? 'Dentro do esperado' : 'Alerta laranja', tone.ri, tone.ri === 'ok' ? 'check' : 'warn')}</span></div>
            <div class="card kpi"><span class="ico">${I('trend')}</span><span class="lab">Correlação frequência × nota</span><span class="val">r = ${fmt(r, 2)}</span><span class="foot">${EC.chip(Math.abs(r) >= .7 ? 'Correlação forte' : 'Correlação moderada', 'info', 'trend')}</span></div>
          </div>
          <div class="grid g-2" style="margin-bottom:24px">
            <section class="card"><div class="card-head"><div><h3>Média por disciplina</h3><span class="sub">Escala 0 a 10 · linha tracejada: limiar de alerta 5,0</span></div></div><div class="chart-box"><canvas id="c-bar" role="img" aria-label="Gráfico de barras: média por disciplina"></canvas></div></section>
            <section class="card"><div class="card-head"><div><h3>Frequência média mensal</h3><span class="sub">Percentual de presença · mínimo exigido 75%</span></div></div><div class="chart-box"><canvas id="c-line" role="img" aria-label="Gráfico de linha: frequência mensal"></canvas></div></section>
          </div>
          <div class="grid g-2">
            <section class="card"><div class="card-head"><div><h3>Frequência × nota</h3><span class="sub">Cada ponto é um aluno · r = ${fmt(r, 2)}: quem frequenta mais tende a ter notas melhores</span></div></div><div class="chart-box tall"><canvas id="c-sc" role="img" aria-label="Gráfico de dispersão: frequência por nota"></canvas></div></section>
            <section class="card">
              <div class="card-head"><div><h3>Situação dos alunos</h3><span class="sub">${turma === 'todas' ? 'Todas as turmas' : EC.turma(turma).nome}</span></div></div>
              <div style="padding:20px 24px" class="stack">
                ${x.sit.map(([l, v, t]) => `<div><div class="row" style="justify-content:space-between;font-size:14px;margin-bottom:6px"><span class="semaforo">${EC.chip(l, t)}</span><b class="tnum" style="color:var(--ink)">${v}%</b></div>
                  <div style="height:10px;border-radius:5px;background:var(--gray-100);overflow:hidden"><div class="bar-fill" data-w="${v}" style="height:100%;width:0;border-radius:5px;background:var(--${t});transition:width .9s var(--ease)"></div></div></div>`).join('')}
                <h4 style="margin-top:12px;font-size:15px">Alunos em risco ${EC.chip(String(x.risco.length), 'bad')}</h4>
                <div>${x.risco.slice(0, 5).map((a) => `<a class="dd-item" href="#/alunos/${a.id}">${EC.avatar(a, 32)}<span style="flex:1"><b style="color:var(--ink)">${esc(a.nome)}</b><small>${EC.turma(a.turma).nome} · freq. ${a.freq}% · média ${EC.fmtNota(EC.mediaGeral(a.id))}</small></span>${I('right', 'sm')}</a>`).join('')}</div>
                <a class="crumb" href="#/risco">Ver lista completa ${I('right', 'sm')}</a>
              </div>
            </section>
          </div>`,
        after(root) {
          killCharts();
          root.querySelector('#Turma').addEventListener('change', (e) => { location.hash = '/dashboard?t=' + e.target.value; });
          requestAnimationFrame(() => root.querySelectorAll('.bar-fill').forEach((b) => (b.style.width = b.dataset.w + '%')));
          chart(root.querySelector('#c-bar'), {
            type: 'bar',
            data: { labels: x.bars.map((b) => b[0]), datasets: [{ data: x.bars.map((b) => b[1]), backgroundColor: x.bars.map((b) => (b[1] < 5 ? '#d32f2f' : BRAND)), borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22, barPercentage: .7 }] },
            options: baseOpts({ indexAxis: 'y', layout: { padding: { top: 18 } }, scales: { x: { min: 0, max: 10, grid: { color: GRID }, border: { display: false }, ticks: { color: INK, stepSize: 2 } }, y: { grid: { display: false }, border: { color: GRID }, ticks: { color: '#1b2533', font: { family: 'Lato', size: 12, weight: '700' } } } }, plugins: { legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: (c) => 'Média ' + fmt(c.parsed.x) } } } }),
            plugins: [refLine(5, 'Alerta 5,0', '#d32f2f')],
          });
          chart(root.querySelector('#c-line'), {
            type: 'line',
            data: { labels: x.line.map((l) => l[0]), datasets: [{ data: x.line.map((l) => l[1]), borderColor: BRAND, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#fff', pointBorderColor: BRAND, pointBorderWidth: 2, tension: .35, fill: { target: 'origin' }, backgroundColor: 'rgba(12,74,138,.07)' }] },
            options: baseOpts({ interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, border: { color: GRID }, ticks: { color: INK } }, y: { min: 50, max: 100, grid: { color: GRID }, border: { display: false }, ticks: { color: INK, callback: (v) => v + '%' } } }, plugins: { legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: (c) => 'Frequência ' + c.parsed.y + '%' } } } }),
            plugins: [refLine(75, 'Mínimo 75%', '#d99a00')],
          });
          chart(root.querySelector('#c-sc'), {
            type: 'scatter',
            data: { datasets: [{ data: x.pts, pointRadius: turma === 'todas' ? 4 : 7, pointHoverRadius: 8, backgroundColor: 'rgba(12,74,138,.55)', borderColor: '#fff', borderWidth: 1.5 }] },
            options: baseOpts({ scales: { x: { min: 0, max: 100, title: { display: true, text: 'Frequência (%)', color: INK, font: { family: 'Lato', weight: '700' } }, grid: { color: GRID }, border: { display: false }, ticks: { color: INK } }, y: { min: 0, max: 10, title: { display: true, text: 'Média', color: INK, font: { family: 'Lato', weight: '700' } }, grid: { color: GRID }, border: { display: false }, ticks: { color: INK } } }, plugins: { legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: (c) => `${c.raw.nome ? c.raw.nome + ': ' : ''}frequência ${c.parsed.x}% · média ${fmt(c.parsed.y)}` } } } }),
          });
        },
      };
    },
  });

  /* ---------------- Relatórios (RF07) ---------------- */
  EC.route('/relatorios', {
    title: 'Relatórios', roles: ['gestor'],
    render() {
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const turma = q.get('t') || 'escola';
      let rows;
      if (turma === 'escola') rows = D.ESTAT.map((e) => [e.disc, e.media, e.dp, e.min, e.max, e.interp]);
      else {
        const t = EC.turma(turma), al = EC.alunosDaTurma(turma);
        rows = t.disciplinas.map((d) => {
          const ms = al.map((a) => EC.mediaDisc(a.id, d)).filter((x) => x != null);
          if (!ms.length) return [EC.disc(d).nome, 0, 0, 0, 0, 'Turma ainda sem notas lançadas.'];
          const m = EC.avg(ms), dp = desvio(ms);
          return [EC.disc(d).nome, D.r1(m), D.r1(dp), Math.min(...ms), Math.max(...ms), dp >= 2.5 ? 'Alta dispersão: turma heterogênea nesta disciplina.' : m < 6 ? 'Média abaixo de 6,0: avaliar reforço.' : 'Desempenho estável.'];
        });
      }
      const maxDp = Math.max(...rows.map((r) => r[2])), minDp = Math.min(...rows.map((r) => r[2]));
      return {
        html: `
          <div class="page-head"><div><h1>Relatórios</h1><p>Médias e desvio padrão por disciplina (RF07).</p></div>
            <div class="row wrap no-print"><button class="btn btn-ghost" id="csv">${I('download', 'sm')} Exportar CSV</button><button class="btn btn-ghost" id="print">${I('printer', 'sm')} Imprimir</button></div></div>
          <div class="filters no-print">${EC.selectHtml('Escopo', [['escola', 'Escola (consolidado)']].concat(EC.turmas().map((t) => [t.id, 'Turma ' + t.nome])), turma, 'light')}</div>
          <div class="card"><div class="table-wrap"><table class="t">
            <thead><tr><th>Disciplina</th><th class="c">Média</th><th class="c">Desvio padrão</th><th class="c">Mín / Máx</th><th>Interpretação</th></tr></thead>
            <tbody>${rows.map((r) => `<tr><td style="color:var(--ink)">${esc(r[0])}</td><td class="c tnum">${fmt(r[1])}</td>
              <td class="c tnum">${fmt(r[2])} ${r[2] === maxDp ? EC.chip('maior', 'warn') : r[2] === minDp ? EC.chip('menor', 'ok') : ''}</td>
              <td class="c tnum">${fmt(r[3])} / ${fmt(r[4])}</td><td style="font-weight:400;color:var(--muted)">${esc(r[5])}</td></tr>`).join('')}</tbody>
          </table></div></div>
          <div class="alert-banner info" style="margin-top:20px">${I('trend')}<div><b>Leitura estatística</b>${turma === 'escola' ? 'Português apresentou a maior consistência (desvio padrão 0,9), indicando turmas homogêneas; História mostrou a maior dispersão (1,5). A correlação entre frequência e nota foi r = 0,78: alunos mais presentes tendem a ter melhor desempenho.' : 'Valores calculados a partir das notas lançadas da turma (média aritmética dos quatro bimestres por aluno).'}</div></div>`,
        after(root) {
          root.querySelector('#Escopo').addEventListener('change', (e) => { location.hash = '/relatorios?t=' + e.target.value; });
          root.querySelector('#print').addEventListener('click', () => window.print());
          root.querySelector('#csv').addEventListener('click', () => {
            EC.downloadCsv(`relatorio-${turma}.csv`, [['Disciplina', 'Média', 'Desvio padrão', 'Mínimo', 'Máximo', 'Interpretação']].concat(rows.map((r) => [r[0], fmt(r[1]), fmt(r[2]), fmt(r[3]), fmt(r[4]), r[5]])));
            EC.log('Exportou relatório estatístico'); EC.toast('Relatório exportado em CSV', 'info');
          });
        },
      };
    },
  });

  /* ---------------- Alunos em risco (RN-008) ---------------- */
  EC.route('/risco', {
    title: 'Alunos em risco', roles: ['gestor'],
    render() {
      return {
        html: `
          <div class="page-head"><div><h1>Alunos em risco</h1><p>Sinalização automática: frequência abaixo de 75% ou média abaixo de 5,0 (RN-008).</p></div>
            <button class="btn btn-ghost" id="csv">${I('download', 'sm')} Exportar CSV</button></div>
          <div class="filters">${EC.selectHtml('Turma', [['', 'Todas as turmas']].concat(EC.turmas().map((t) => [t.id, t.nome])), '', 'light')}
            <div class="tabs" id="mot">${[['', 'Todos os motivos'], ['f', 'Frequência'], ['m', 'Média']].map(([v, l], i) => `<button data-m="${v}" class="${i === 0 ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="card"><div class="table-wrap"><table class="t" id="rt"></table></div></div>`,
        after(root) {
          let mot = '';
          const sel = root.querySelector('#Turma');
          const lista = () => EC.alunos().filter((a) => a.ativo !== false && EC.emRisco(a.id) && (!sel.value || a.turma === sel.value))
            .map((a) => { const m = EC.mediaGeral(a.id); return { a, m, f: a.freq < 75, n: m != null && m < 5 }; })
            .filter((x) => !mot || (mot === 'f' ? x.f : x.n))
            .sort((x, y) => x.a.freq - y.a.freq);
          function draw() {
            const L = lista();
            root.querySelector('#rt').innerHTML = `<thead><tr><th>Aluno</th><th>Turma</th><th class="c">Frequência</th><th class="c">Média</th><th>Motivo</th><th class="r"></th></tr></thead>
              <tbody>${L.map(({ a, m, f, n }) => `<tr><td><span class="t-name">${EC.avatar(a, 36)}${esc(a.nome)}</span></td><td>${EC.turma(a.turma).nome}</td>
                <td class="c">${EC.ring(a.freq, { size: 44, stroke: 6, tone: EC.toneFreq(a.freq), fs: 11 })}</td><td class="c tnum" style="color:${m != null && m < 5 ? 'var(--bad)' : 'inherit'}">${EC.fmtNota(m)}</td>
                <td>${f ? EC.chip('Frequência < 75%', 'bad', 'warn') : ''} ${n ? EC.chip('Média < 5,0', 'warn', 'alert') : ''}</td>
                <td class="r"><a class="btn btn-ghost btn-sm" href="#/alunos/${a.id}">Perfil</a></td></tr>`).join('') || `<tr><td colspan="6">${EC.empty('Nenhum aluno em risco com esses filtros.', 'check')}</td></tr>`}</tbody>`;
            EC.animateRings(root);
          }
          sel.addEventListener('change', draw);
          root.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mot = b.dataset.m; root.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
          root.querySelector('#csv').addEventListener('click', () => { EC.downloadCsv('alunos-em-risco.csv', [['Aluno', 'Turma', 'Frequência', 'Média', 'Motivo']].concat(lista().map(({ a, m, f, n }) => [a.nome, EC.turma(a.turma).nome, a.freq + '%', EC.fmtNota(m), [f && 'Frequência', n && 'Média'].filter(Boolean).join(' e ')]))); EC.toast('Lista exportada em CSV', 'info'); });
          draw();
        },
      };
    },
  });

  /* ---------------- Auditoria LGPD (RN-009, RNF06) ---------------- */
  EC.route('/auditoria', {
    title: 'Auditoria LGPD', roles: ['gestor'],
    render() {
      const hoje = EC.fmtDate(EC.dateAdd(EC.today(), -1)); // eventos simulados: dia anterior
      const logs = S.logs.map((l) => ({ h: l[0], u: l[1], p: l[2], a: l[3], t: l[4], d: new Date(l[5]).toLocaleDateString('pt-BR') }))
        .concat(D.LOGS.map((l) => ({ h: l[0], u: l[1], p: l[2], a: l[3], t: l[4], d: hoje })).reverse());
      const TT = { ok: ['Sucesso', 'ok'], warn: ['Acesso negado', 'warn'], bad: ['Falha', 'bad'] };
      return {
        html: `
          <div class="page-head"><div><h1>Auditoria LGPD</h1><p>Registro de acessos e operações para responsabilização (LGPD, Art. 37).</p></div></div>
          <div class="grid g-3" style="margin-bottom:24px">
            <div class="card kpi"><span class="ico">${I('activity')}</span><span class="lab">Eventos registrados</span><span class="val">${logs.length}</span><span class="foot">incluindo esta sessão</span></div>
            <div class="card kpi"><span class="ico">${I('lock')}</span><span class="lab">Acessos negados (RBAC)</span><span class="val">${logs.filter((l) => l.t === 'warn').length}</span><span class="foot">princípio do menor privilégio</span></div>
            <div class="card kpi"><span class="ico">${I('shield')}</span><span class="lab">Falhas de login</span><span class="val">${logs.filter((l) => l.t === 'bad').length}</span><span class="foot">senhas protegidas com bcrypt</span></div>
          </div>
          <div class="filters"><div class="tabs" id="lt">${[['', 'Todos'], ['ok', 'Sucesso'], ['warn', 'Acesso negado'], ['bad', 'Falha']].map(([v, l], i) => `<button data-t="${v}" class="${i === 0 ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="card"><div class="table-wrap"><table class="t" id="lg"></table></div></div>
          <p class="muted" style="font-size:12px;margin-top:12px">${I('shield', 'sm')} Os logs guardam apenas o necessário para auditoria e segurança (princípio da necessidade, LGPD Art. 6º, III).</p>`,
        after(root) {
          let f = '';
          const draw = () => {
            root.querySelector('#lg').innerHTML = `<thead><tr><th>Data</th><th>Hora</th><th>Usuário</th><th>Perfil</th><th>Ação</th><th>Resultado</th></tr></thead>
              <tbody>${logs.filter((l) => !f || l.t === f).map((l) => `<tr><td class="tnum">${l.d}</td><td class="tnum">${l.h}</td><td style="color:var(--ink)">${esc(l.u)}</td><td>${esc(l.p)}</td><td style="font-weight:400">${esc(l.a)}</td><td>${EC.chip(TT[l.t][0], TT[l.t][1])}</td></tr>`).join('')}</tbody>`;
          };
          root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { f = b.dataset.t; root.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
          draw();
        },
      };
    },
  });
})();
