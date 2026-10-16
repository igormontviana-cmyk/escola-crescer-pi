/* =========================================================
   Perfil Aluno: Portal do Aluno (RF05)
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc;

  function proximaAvaliacao(a) {
    const t = EC.turma(a.turma);
    const hoje = EC.iso(EC.today());
    const prox = t.disciplinas.flatMap((d) => EC.avaliacoes(a.turma, d).map((av) => ({ ...av, d }))).filter((av) => av.data >= hoje).sort((x, y) => (x.data < y.data ? -1 : 1))[0];
    return prox;
  }

  EC.views.inicio_aluno = (p, u) => {
    const a = EC.aluno(u.id), t = EC.turma(a.turma);
    const media = EC.mediaGeral(a.id), sit = EC.situacao(media);
    const prox = proximaAvaliacao(a);
    const melhor = t.disciplinas.slice().sort((x, y) => EC.mediaDisc(a.id, y) - EC.mediaDisc(a.id, x));
    return {
      title: 'Início',
      html: `
        <div class="grid g-home">
          <div class="stack" style="gap:24px">
            <section class="hero">
              ${EC.ring(media * 10, { size: 104, stroke: 12, tone: 'white', label: EC.fmtNota(media), fs: 26 })}
              <div style="flex:1">
                <h2>Olá, ${esc(a.nome.split(' ')[0])}!</h2>
                <p>${esc(t.nome)} · ${t.turno} · Matrícula ${a.matricula}</p>
                <div class="row wrap" style="margin-top:14px">${EC.sitChip(sit)}<span class="chip" style="background:rgba(255,255,255,.12);color:#fff">${I('calendar')}${EC.bimestreAtual()}º bimestre</span></div>
              </div>
              ${EC.kids()}
            </section>
            <div class="grid g-3">
              <div class="card kpi"><span class="ico">${I('chart')}</span><span class="lab">Média geral</span><span class="val">${EC.fmtNota(media)}</span><span class="foot">Melhor: ${esc(EC.disc(melhor[0]).curto)} (${EC.fmtNota(EC.mediaDisc(a.id, melhor[0]))})</span></div>
              <div class="card kpi"><span class="ico">${I('clipboard')}</span><span class="lab">Frequência</span><span class="val">${a.freq}<small>%</small></span><span class="foot">${a.freq >= 75 ? EC.chip('Acima do mínimo de 75%', 'ok', 'check') : EC.chip('Abaixo de 75%', 'bad', 'warn')}</span></div>
              <div class="card kpi"><span class="ico">${I('fileCheck')}</span><span class="lab">Próxima avaliação</span><span class="val" style="font-size:22px;line-height:1.25;margin-top:6px">${prox ? esc(EC.disc(prox.d).curto) : '–'}</span><span class="foot">${prox ? `${esc(prox.nome)} · ${EC.fmtDate(EC.fromIso(prox.data))}` : 'Nenhuma agendada'}</span></div>
            </div>
            <div>
              <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 class="section-title" style="margin:0">Avisos</h2><a class="crumb" href="#/mural" style="margin:0">Ver mural ${I('right', 'sm')}</a></div>
              <div class="avisos" style="min-height:0">${EC.avisosHtml(u, 3)}</div>
            </div>
          </div>
          ${EC.calendarHtml()}
        </div>`,
      after(root) { EC.mountCalendar(root, u); EC.wireAvisos(root, u); },
    };
  };

  /* Boletim */
  EC.route('/boletim', {
    title: 'Boletim', roles: ['aluno'],
    render(p, u) {
      const a = EC.aluno(u.id), t = EC.turma(a.turma);
      const B = ['1º BIM', '2º BIM', '3º BIM', '4º BIM'];
      const media = EC.mediaGeral(a.id);
      return {
        html: `
          <div class="page-head"><div><h1>Boletim</h1><p>${esc(a.nome)} · ${esc(t.nome)} · ${t.turno} · ano letivo ${EC.today().getFullYear()}</p></div>
            <div class="row no-print"><button class="btn btn-ghost" id="print">${I('printer', 'sm')} Imprimir</button></div></div>
          <div class="grid g-3" style="margin-bottom:24px">
            <div class="card kpi"><span class="lab">Média geral</span><span class="val">${EC.fmtNota(media)}</span><span class="foot">${EC.sitChip(EC.situacao(media))}</span></div>
            <div class="card kpi"><span class="lab">Frequência geral</span><span class="val">${a.freq}<small>%</small></span><span class="foot">Mínimo exigido: 75%</span></div>
            <div class="card kpi"><span class="lab">Disciplinas</span><span class="val">${t.disciplinas.length}</span><span class="foot">${t.disciplinas.filter((d) => EC.mediaDisc(a.id, d) >= 6).length} com média ≥ 6,0</span></div>
          </div>
          <div class="table-wrap grades desk-only">
            <table>
              <thead><tr><th>Disciplina</th>${B.map((b) => `<th>${b}</th>`).join('')}<th>Média</th><th>Faltas</th><th style="font-size:16px">Situação</th></tr></thead>
              <tbody>${t.disciplinas.map((d) => {
                const n = EC.notas(a.id, d), m = EC.mediaDisc(a.id, d);
                return `<tr><td>${esc(EC.disc(d).nome)}</td>${n.map((x) => `<td class="num ${x < 4 ? 'low' : x < 6 ? 'mid' : ''}">${EC.fmtNota(x)}</td>`).join('')}<td class="num" style="font-weight:700">${EC.fmtNota(m)}</td><td class="num">${EC.faltas(a.id, d)}</td><td style="font-family:var(--font)">${EC.sitChip(EC.situacao(m))}</td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
          <div class="m-cards">${t.disciplinas.map((d) => {
            const n = EC.notas(a.id, d), m = EC.mediaDisc(a.id, d);
            return `<article class="card m-card"><header><b>${esc(EC.disc(d).nome)}</b>${EC.sitChip(EC.situacao(m))}</header>
              <div class="m-bims">${n.map((x, i) => `<span><small>${i + 1}º bim</small><b class="${x < 4 ? 'low' : ''}">${EC.fmtNota(x)}</b></span>`).join('')}</div>
              <footer><span>Média <b>${EC.fmtNota(m)}</b></span><span>Faltas <b>${EC.faltas(a.id, d)}</b></span></footer></article>`;
          }).join('')}</div>
          <p class="muted" style="font-size:13px;margin-top:16px">Média ≥ 6,0: aprovado · 4,0 a 5,9: recuperação · abaixo de 4,0: reprovado.</p>`,
        after(root) { root.querySelector('#print').addEventListener('click', () => window.print()); },
      };
    },
  });

  /* Frequência por disciplina */
  EC.route('/frequencia', {
    title: 'Frequência', roles: ['aluno'],
    render(p, u) {
      const a = EC.aluno(u.id), t = EC.turma(a.turma);
      const baixas = t.disciplinas.filter((d) => EC.freqDisc(a.id, d) < 75);
      return {
        html: `
          <div class="page-head"><div><h1>Frequência</h1><p>Presença por disciplina no ano letivo. O mínimo exigido é 75%.</p></div></div>
          ${baixas.length ? `<div class="alert-banner bad">${I('warn')}<div><b>Atenção à frequência</b>Você está abaixo de 75% em ${baixas.map((d) => EC.disc(d).curto).join(', ')}. A coordenação acompanha esses casos (RN-008).</div></div>`
            : `<div class="alert-banner info">${I('check')}<div><b>Frequência em dia</b>Você está acima do mínimo em todas as disciplinas. Continue assim!</div></div>`}
          <div class="grid g-3">${t.disciplinas.map((d) => {
            const f = EC.freqDisc(a.id, d), aulas = EC.aulasDadas(d), fal = EC.faltas(a.id, d);
            return `<article class="card freq-card">${EC.ring(f, { size: 76, stroke: 10, tone: EC.toneFreq(f), fs: 16 })}
              <div><h4>${esc(EC.disc(d).nome)}</h4><p>${aulas - fal} presenças · ${fal} faltas de ${aulas} aulas</p><p>Prof. ${esc((EC.professorDe(a.turma, d) || {}).nome || '-')}</p></div></article>`;
          }).join('')}</div>`,
      };
    },
  });
})();
