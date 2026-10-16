/* =========================================================
   Ouvidoria: o aluno envia reclamação, sugestão, elogio ou dúvida
   (pode ser anônima); Coordenação e Gestor respondem e mudam o status
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc, S = EC.state;

  const CATS = { 'Reclamação': ['bad', 'warn'], 'Sugestão': ['info', 'note'], 'Elogio': ['ok', 'check'], 'Dúvida': ['warn', 'helpChat'] };
  const STATUS = ['Aberto', 'Em análise', 'Respondido', 'Encerrado'];
  const STONE = { Aberto: 'warn', 'Em análise': 'info', Respondido: 'ok', Encerrado: 'neutral' };
  const equipe = (u) => u.perfil === 'coordenador' || u.perfil === 'gestor';

  // Manifestações = base simulada + criadas na demonstração; mensagens e status alterados ficam no estado
  EC.tickets = () => D.OUVIDORIA.concat(S.ouvidoria).map((t) => ({
    ...t,
    status: S.ouvStatus[t.id] || t.status,
    msgs: t.msgs.map((m) => ({ ...m, quando: m.em ? new Date(m.em) : dataRel(m) })).concat((S.ouvMsgs[t.id] || []).map((m) => ({ ...m, quando: new Date(m.em) }))),
  }));
  const dataRel = (m) => { const d = EC.dateAdd(EC.today(), m.dias || 0); const [h, mi] = (m.hora || '12:00').split(':').map(Number); d.setHours(h, mi); return d; };
  const fmtQuando = (d) => d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const quem = (t, u) => {
    if (u.perfil === 'aluno') return 'Você';
    if (t.anonimo) return 'Anônimo';
    const a = EC.aluno(t.alunoId);
    return a ? `${a.nome} · ${EC.turma(a.turma)?.nome || ''}` : 'Aluno';
  };
  const catChip = (c) => EC.chip(c, CATS[c][0], CATS[c][1]);
  const stChip = (s) => EC.chip(s, STONE[s], s === 'Encerrado' ? 'check' : s === 'Aberto' ? 'clock' : s === 'Respondido' ? 'send' : 'activity');
  EC.ouvAbertas = () => EC.tickets().filter((t) => t.status === 'Aberto').length;

  function ticketCard(t, u, i) {
    const ult = t.msgs[t.msgs.length - 1];
    return `<a class="card ticket" href="#/ouvidoria/${t.id}" style="animation-delay:${i * 40}ms">
      <div class="row wrap" style="gap:8px">${catChip(t.categoria)}${stChip(t.status)}<span class="spacer"></span><small class="muted tnum">${t.protocolo}</small></div>
      <h4>${esc(t.assunto)}</h4>
      <p class="muted">${ult.de === 'escola' ? '<b>Escola:</b> ' : ''}${esc(ult.texto)}</p>
      <div class="row" style="gap:8px;font-size:12px;color:var(--muted)">${t.anonimo && equipe(u) ? I('lock', 'sm') : I('user', 'sm')}<span>${esc(quem(t, u))}</span><span>·</span><span>${fmtQuando(ult.quando)}</span><span>·</span><span>${t.msgs.length} mensagem(ns)</span></div>
    </a>`;
  }

  /* ---------------- Lista (aluno) / Caixa de entrada (equipe) ---------------- */
  EC.route('/ouvidoria', {
    title: 'Ouvidoria', roles: ['aluno', 'coordenador', 'gestor'],
    render(p, u) {
      if (u.perfil === 'aluno') {
        const meus = EC.tickets().filter((t) => t.alunoId === u.id).sort((a, b) => b.msgs[b.msgs.length - 1].quando - a.msgs[a.msgs.length - 1].quando);
        return {
          html: `
            <div class="page-head"><div><h1>Ouvidoria</h1><p>Fale com a coordenação: reclamações, sugestões, elogios e dúvidas. Você pode enviar de forma anônima.</p></div>
              <button class="btn btn-primary" id="nova-man">${I('plus', 'sm')} Nova manifestação</button></div>
            <div class="stack" style="max-width:860px">${meus.map((t, i) => ticketCard(t, u, i)).join('') || EC.empty('Você ainda não enviou nenhuma manifestação.', 'chat')}</div>`,
          after(root) { root.querySelector('#nova-man').addEventListener('click', () => novaManifestacao(u)); },
        };
      }
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      const f = q.get('s') || '';
      const todos = EC.tickets().sort((a, b) => b.msgs[b.msgs.length - 1].quando - a.msgs[a.msgs.length - 1].quando);
      const lista = todos.filter((t) => !f || t.status === f);
      const cnt = (s) => todos.filter((t) => t.status === s).length;
      return {
        html: `
          <div class="page-head"><div><h1>Ouvidoria</h1><p>Manifestações enviadas pelos alunos. Responda e acompanhe o status de cada uma.</p></div></div>
          <div class="grid g-4" style="margin-bottom:24px">${STATUS.map((s) => `<a class="card kpi" href="#/ouvidoria?s=${encodeURIComponent(s)}" style="text-decoration:none"><span class="lab">${s}</span><span class="val">${cnt(s)}</span><span class="foot">${stChip(s)}</span></a>`).join('')}</div>
          <div class="filters"><div class="tabs">${[['', 'Todas']].concat(STATUS.map((s) => [s, s])).map(([v, l]) => `<button data-s="${esc(v)}" class="${f === v ? 'on' : ''}">${l}<span class="n">${v ? cnt(v) : todos.length}</span></button>`).join('')}</div></div>
          <div class="stack" style="max-width:960px">${lista.map((t, i) => ticketCard(t, u, i)).join('') || EC.empty('Nenhuma manifestação com esse status.', 'chat')}</div>`,
        after(root) { root.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { location.hash = '/ouvidoria' + (b.dataset.s ? '?s=' + encodeURIComponent(b.dataset.s) : ''); })); },
      };
    },
  });

  /* ---------------- Conversa ---------------- */
  EC.route('/ouvidoria/:id', {
    title: 'Ouvidoria', roles: ['aluno', 'coordenador', 'gestor'], nav: '/ouvidoria',
    render(p, u) {
      const t = EC.tickets().find((x) => x.id === p.id);
      if (!t || (u.perfil === 'aluno' && t.alunoId !== u.id)) return { html: EC.empty('Manifestação não encontrada.', 'chat') };
      const encerrado = t.status === 'Encerrado';
      return {
        title: t.assunto,
        html: `
          <a class="crumb" href="#/ouvidoria">${I('arrowLeft', 'sm')} Ouvidoria</a>
          <div class="page-head"><div><h1 style="font-size:26px">${esc(t.assunto)}</h1>
            <div class="row wrap" style="gap:8px;margin-top:10px">${catChip(t.categoria)}${stChip(t.status)}<span class="muted" style="font-size:13px">Protocolo ${t.protocolo} · ${equipe(u) ? esc(quem(t, u)) : t.anonimo ? 'enviada de forma anônima' : 'enviada com seu nome'}</span></div></div>
            ${equipe(u) ? EC.selectHtml('Status', STATUS.map((s) => [s, s]), t.status, 'light') : ''}</div>
          ${t.anonimo && equipe(u) ? `<div class="alert-banner info">${I('lock')}<div><b>Manifestação anônima</b>O nome do aluno não é exibido para a equipe. Responda por aqui: a resposta chega só para quem enviou.</div></div>` : ''}
          <div class="chat" id="chat">${t.msgs.map((m) => {
            const minha = (u.perfil === 'aluno') === (m.de === 'aluno');
            return `<div class="msg ${minha ? 'mine' : ''}"><div class="bubble">${esc(m.texto)}</div><small>${m.de === 'escola' ? esc(m.autor || 'Coordenação') : u.perfil === 'aluno' ? 'Você' : t.anonimo ? 'Anônimo' : esc((EC.aluno(t.alunoId) || {}).nome || 'Aluno')} · ${fmtQuando(m.quando)}</small></div>`;
          }).join('')}</div>
          ${encerrado ? `<p class="muted" style="margin-top:16px;text-align:center">${I('check', 'sm')} Manifestação encerrada.${equipe(u) ? ' Mude o status para reabrir.' : ''}</p>`
            : `<form class="composer card" id="cmp"><label class="sr-only" for="cmp-t">Mensagem</label><textarea id="cmp-t" maxlength="1000" placeholder="${equipe(u) ? 'Escreva a resposta para o aluno...' : 'Escreva uma mensagem...'}"></textarea><div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">${I('send', 'sm')} Enviar</button></div></form>`}`,
        after(root) {
          const chat = root.querySelector('#chat');
          chat.lastElementChild?.scrollIntoView({ block: 'nearest' });
          root.querySelector('#Status')?.addEventListener('change', (e) => {
            S.ouvStatus[t.id] = e.target.value;
            EC.save();
            EC.log(`Mudou o status da manifestação ${t.protocolo} para ${e.target.value}`);
            EC.toast('Status atualizado: ' + e.target.value);
            EC.render();
          });
          root.querySelector('#cmp')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const txt = root.querySelector('#cmp-t').value.trim();
            if (!txt) { EC.toast('Escreva a mensagem antes de enviar.', 'err'); return; }
            S.ouvMsgs[t.id] = (S.ouvMsgs[t.id] || []).concat([{ de: equipe(u) ? 'escola' : 'aluno', autor: equipe(u) ? u.nome : undefined, texto: txt, em: new Date().toISOString() }]);
            // Resposta da equipe marca como Respondido; nova mensagem do aluno reabre
            S.ouvStatus[t.id] = equipe(u) ? 'Respondido' : 'Aberto';
            EC.save();
            EC.log(`${equipe(u) ? 'Respondeu' : 'Enviou mensagem na'} manifestação ${t.protocolo}`);
            EC.toast(equipe(u) ? 'Resposta enviada ao aluno' : 'Mensagem enviada');
            EC.render();
          });
        },
      };
    },
  });

  function novaManifestacao(u) {
    EC.modal(`${EC.modalHead('Nova manifestação', 'A coordenação responde por aqui, e você acompanha pelo protocolo.')}
      <form class="modal-body stack" novalidate>
        <div class="field"><label>Tipo</label><div class="types-row" role="radiogroup" aria-label="Tipo">${Object.keys(CATS).map((c, i) => `<label class="type-pill"><input type="radio" name="cat" value="${c}" ${i === 0 ? 'checked' : ''}>${I(CATS[c][1], 'sm')}${c}</label>`).join('')}</div></div>
        <div class="field"><label for="om-a">Assunto</label><input class="input" id="om-a" maxlength="80" placeholder="Ex.: Bebedouro do bloco B quebrado"><span class="msg">Informe o assunto.</span></div>
        <div class="field"><label for="om-t">Mensagem</label><textarea id="om-t" maxlength="1000" placeholder="Conte o que aconteceu, onde e quando."></textarea><span class="msg">Escreva a mensagem.</span></div>
        <label class="anon"><input type="checkbox" class="check" id="om-anon"><span><b>Enviar de forma anônima</b><small>A coordenação não verá seu nome. Indicado para assuntos sensíveis.</small></span></label>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="om-ok">${I('send', 'sm')} Enviar</button></div>`, {
      onMount(ov, close) {
        ov.querySelector('#om-ok').addEventListener('click', () => {
          const a = ov.querySelector('#om-a'), tx = ov.querySelector('#om-t');
          a.closest('.field').classList.toggle('err', !a.value.trim());
          tx.closest('.field').classList.toggle('err', !tx.value.trim());
          if (!a.value.trim() || !tx.value.trim()) return;
          const id = 'u' + Date.now().toString(36);
          const protocolo = 'OUV-2026-' + String(46 + S.ouvidoria.length).padStart(4, '0');
          S.ouvidoria.push({ id, protocolo, alunoId: u.id, categoria: ov.querySelector('[name=cat]:checked').value, assunto: a.value.trim(), anonimo: ov.querySelector('#om-anon').checked, status: 'Aberto', msgs: [{ de: 'aluno', texto: tx.value.trim(), em: new Date().toISOString() }] });
          EC.save();
          EC.log(`Enviou manifestação à ouvidoria (${protocolo})`);
          close();
          EC.toast('Manifestação enviada. Protocolo ' + protocolo);
          location.hash = '/ouvidoria/' + id;
        });
      },
    });
  }
})();
