/* =========================================================
   Núcleo: estado, sessão, regras de negócio e componentes de UI
   ========================================================= */
window.EC = window.EC || {};

(function () {
  const D = EC.data;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  EC.esc = esc;

  /* ---------------- Persistência local (apenas demonstração) ---------------- */
  const KEY = 'ec-escola-crescer-v1';
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  const def = { notas: {}, chamadas: {}, avisos: [], lidos: {}, ocorrencias: {}, usuarios: [], grades: {}, avaliacoes: {}, publicadas: {}, logs: [] };
  Object.keys(def).forEach((k) => { if (!S[k]) S[k] = def[k]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* armazenamento indisponível: segue em memória */ } }
  EC.state = S;
  EC.save = save;
  EC.resetDemo = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };

  /* ---------------- Sessão ---------------- */
  EC.session = {
    get() { try { return JSON.parse(sessionStorage.getItem('ec-session')); } catch (e) { return EC._mem || null; } },
    set(u) { EC._mem = u; try { sessionStorage.setItem('ec-session', JSON.stringify(u)); } catch (e) {} },
    clear() { EC._mem = null; try { sessionStorage.removeItem('ec-session'); } catch (e) {} },
  };
  EC.log = (acao, tipo = 'ok') => {
    const u = EC.session.get();
    const now = new Date();
    S.logs.unshift([now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), u ? u.nome : 'desconhecido', u ? EC.perfilNome(u.perfil) : '-', acao, tipo, now.toISOString()]);
    S.logs = S.logs.slice(0, 60);
    save();
  };
  EC.perfilNome = (p) => ({ aluno: 'Aluno', professor: 'Professor', coordenador: 'Coordenador', gestor: 'Gestor' }[p] || p);

  /* ---------------- Datas ---------------- */
  EC.today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  EC.iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  EC.fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  EC.MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  EC.DIAS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  EC.fmtDate = (d) => d.toLocaleDateString('pt-BR');
  EC.fmtLong = (d) => `${EC.DIAS[d.getDay()]}, ${d.getDate()} de ${EC.MESES[d.getMonth()]}`;
  EC.cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  EC.dateAdd = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  EC.bimestreAtual = () => { const m = EC.today().getMonth(); return m < 4 ? 1 : m < 6 ? 2 : m < 9 ? 3 : 4; };

  /* ---------------- Consultas ---------------- */
  EC.turma = (id) => D.TURMAS.map((t) => (S.grades[t.id] ? { ...t, disciplinas: S.grades[t.id] } : t)).find((t) => t.id === id);
  EC.turmas = () => D.TURMAS.map((t) => EC.turma(t.id));
  EC.disc = (id) => D.DISCIPLINAS[id];
  EC.aluno = (id) => D.ALUNOS.find((a) => a.id === id);
  EC.alunosDaTurma = (t) => D.ALUNOS.filter((a) => a.turma === t);
  EC.professorDe = (turma, disc) => D.PROFESSORES.find((p) => p.disc.some(([t, d]) => t === turma && d === disc));
  EC.lecionaProf = (profId, turma, disc) => { const p = D.PROFESSORES.find((x) => x.id === profId); return !!p && p.disc.some(([t, d]) => t === turma && d === disc); };

  EC.notas = (alunoId, disc) => {
    const o = S.notas[alunoId + '|' + disc];
    const base = (D.NOTAS[alunoId] && D.NOTAS[alunoId][disc]) || [0, 0, 0, 0];
    return o ? o.slice() : base.slice();
  };
  EC.setNotas = (alunoId, disc, arr) => { S.notas[alunoId + '|' + disc] = arr; save(); };
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  EC.avg = avg;
  EC.mediaDisc = (alunoId, disc) => D.r1(avg(EC.notas(alunoId, disc)));
  EC.mediaGeral = (alunoId) => { const a = EC.aluno(alunoId); const t = EC.turma(a.turma); return D.r1(avg(t.disciplinas.map((d) => EC.mediaDisc(alunoId, d)))); };
  EC.freqDisc = (alunoId, disc) => { const f = D.FREQ[alunoId]; return f && f[disc] != null ? f[disc] : EC.aluno(alunoId).freq; };
  EC.aulasDadas = (disc) => Math.round((D.DISCIPLINAS[disc].ch || 80) * 0.78);
  EC.faltas = (alunoId, disc) => Math.round((1 - EC.freqDisc(alunoId, disc) / 100) * EC.aulasDadas(disc));

  // Situação: média ≥ 6 aprovado; ≥ 4 recuperação; abaixo disso reprovado
  EC.situacao = (media) => (media >= 6 ? 'Aprovado' : media >= 4 ? 'Recuperação' : 'Reprovado');
  EC.sitClass = (s) => ({ Aprovado: 'ok', 'Recuperação': 'warn', Reprovado: 'bad' }[s] || 'neutral');
  // RN-008: frequência < 75% ou média < 5,0 gera alerta
  EC.emRisco = (alunoId) => EC.aluno(alunoId).freq < 75 || EC.mediaGeral(alunoId) < 5;

  /* ---------------- Componentes ---------------- */
  EC.initials = (n) => n.split(' ').filter(Boolean).filter((w, i, a) => i === 0 || i === a.length - 1).map((w) => w[0]).join('').toUpperCase();
  const TINTS = [['#dce6f2', '#0a3d73'], ['#e3efe6', '#1f6b3a'], ['#f4e9d8', '#7a4f12'], ['#ece4f3', '#5a3a83'], ['#f6e2e2', '#8c2a2a'], ['#dff0f2', '#145c66']];

  // Avatar: recorta a foto do sprite do Figma; sem foto, placeholder igual ao protótipo
  EC.avatar = (p, size = 48, opts = {}) => {
    const f = p && p.foto;
    const cls = `avatar ${opts.ring ? 'ring' : ''} ${opts.cls || ''}`;
    if (f) {
      const k = size / f.d;
      return `<span class="${cls}" style="width:${size}px;height:${size}px;background-image:url('${f.src}');background-size:${f.w * k}px ${f.h * k}px;background-position:${-(f.cx - f.d / 2) * k}px ${-(f.cy - f.d / 2) * k}px" role="img" aria-label="${esc(p.nome)}"></span>`;
    }
    if (opts.placeholder) return `<span class="${cls} ph" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(p ? p.nome : '')}">${EC.personSvg}</span>`;
    const t = TINTS[D.hash(p ? p.nome : '') % TINTS.length];
    return `<span class="${cls}" style="width:${size}px;height:${size}px;background:${t[0]};color:${t[1]};font-size:${Math.round(size * .36)}px" role="img" aria-label="${esc(p ? p.nome : '')}">${esc(EC.initials(p ? p.nome : '?'))}</span>`;
  };

  // Foto grande (detalhes do aluno)
  EC.photo = (a) => {
    if (a.fotoHi) {
      const f = a.fotoHi;
      return `<div class="photo" data-hi style="background-image:url('${f.src}')" data-f='${JSON.stringify(f)}' role="img" aria-label="Foto de ${esc(a.nome)}"></div>`;
    }
    if (a.foto) {
      const f = a.foto;
      return `<div class="photo" data-lo style="background-image:url('${f.src}')" data-f='${JSON.stringify(f)}' role="img" aria-label="Foto de ${esc(a.nome)}"></div>`;
    }
    return `<div class="photo"><span class="initials">${esc(EC.initials(a.nome))}</span></div>`;
  };
  // Ajusta o recorte da foto grande ao tamanho real do elemento (responsivo)
  EC.fitPhotos = (root = document) => {
    root.querySelectorAll('.photo[data-f]').forEach((el) => {
      const f = JSON.parse(el.dataset.f);
      const size = el.clientWidth;
      const s = f.s || f.d;
      const x = f.x != null ? f.x : f.cx - f.d / 2;
      const y = f.y != null ? f.y : f.cy - f.d / 2;
      const k = size / s;
      el.style.backgroundSize = `${f.w * k}px ${f.h * k}px`;
      el.style.backgroundPosition = `${-x * k}px ${-y * k}px`;
    });
  };

  const RING = { ok: ['#3ad43a', '#0f9a1e'], warn: ['#f7d046', '#d9a300'], bad: ['#e53935', '#a3141b'], navy: ['#2a78c8', '#0a3d73'], white: ['#ffffff', '#cfe0f5'] };
  let ringN = 0;
  // Anel de progresso (Figma: indicador de frequência na Lista de Alunos)
  EC.ring = (pct, { size = 64, stroke = 9, tone = 'ok', label, fs } = {}) => {
    const id = 'rg' + ++ringN;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, pct));
    const [a, b] = RING[tone] || RING.ok;
    const fontSize = fs || Math.round(size * .24);
    return `<span class="ring-wrap" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(label ?? pct + '%')}">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
        <circle class="bar" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - p / 100)}"/>
      </svg>
      <span class="val" style="font-size:${fontSize}px">${esc(label ?? Math.round(pct) + '%')}</span>
    </span>`;
  };
  // Anima os anéis depois de inseridos no DOM
  EC.animateRings = (root = document) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll('.ring-wrap .bar[data-off]').forEach((el) => { el.style.strokeDashoffset = el.dataset.off; });
    }));
  };
  EC.toneFreq = (f) => (f >= 75 ? 'ok' : f >= 50 ? 'warn' : 'bad');
  EC.toneNota = (n) => (n >= 6 ? 'ok' : n >= 4 ? 'warn' : 'bad');

  EC.chip = (txt, tone = 'neutral', icon) => `<span class="chip ${tone}">${icon ? EC.icon(icon) : ''}${esc(txt)}</span>`;
  EC.sitChip = (s) => EC.chip(s, EC.sitClass(s), s === 'Aprovado' ? 'check' : s === 'Reprovado' ? 'x' : 'alert');
  EC.fmtNota = (n) => n.toFixed(1).replace('.', ',');

  /* ---------------- Toast (Figma: Confirmação) ---------------- */
  EC.toast = (msg, tone = 'ok') => {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (tone === 'ok' ? '' : tone);
    t.innerHTML = `<span class="ti">${EC.icon(tone === 'err' ? 'x' : tone === 'info' ? 'alert' : 'check')}</span><span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3200);
  };

  /* ---------------- Carregando (Figma: Carregando) ---------------- */
  EC.loading = (ms = 650) => new Promise((res) => {
    const l = document.createElement('div');
    l.className = 'loader';
    l.innerHTML = '<div class="spinner" role="progressbar" aria-label="Carregando"></div>';
    document.body.appendChild(l);
    setTimeout(() => { l.remove(); res(); }, ms);
  });

  /* ---------------- Modal ---------------- */
  EC.modal = (html, { raw = false, wide = false, onMount, onClose } = {}) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = raw ? html : `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    const prevFocus = document.activeElement;
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    ov.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
    const first = ov.querySelector('input, textarea, select, button:not([data-close])');
    if (first) setTimeout(() => first.focus(), 30);
    if (onMount) onMount(ov, close);
    return close;
  };
  EC.modalHead = (title, sub) => `<div class="modal-head"><div><h3>${esc(title)}</h3>${sub ? `<p>${esc(sub)}</p>` : ''}</div><button class="x" data-close aria-label="Fechar">${EC.icon('x', 'sm')}</button></div>`;

  // Confirmação antes de gravar (ajuste vindo da PoC 3)
  EC.confirm = ({ title, text, ok = 'Confirmar', tone = 'primary' }) => new Promise((res) => {
    let done = false;
    EC.modal(`${EC.modalHead(title)}<div class="modal-body"><p class="muted">${esc(text)}</p></div>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-${tone}" data-ok>${esc(ok)}</button></div>`, {
      onMount(ov, close) { ov.querySelector('[data-ok]').addEventListener('click', () => { done = true; close(); res(true); }); },
      onClose() { if (!done) res(false); },
    });
  });

  /* ---------------- Helpers de UI ---------------- */
  EC.selectHtml = (id, opts, val, cls = '') => `<label class="select ${cls}"><span class="sr-only">${esc(id)}</span><select id="${esc(id.replace(/\s+/g, '-'))}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${EC.icon('down', 'sm')}</label>`;
  EC.empty = (txt, icon = 'search') => `<div class="list-empty">${EC.icon(icon)}<p>${esc(txt)}</p></div>`;
  EC.maskCpf = (c) => `${c.slice(0, 3)}.***.***-${c.slice(9)}`; // LGPD: minimização na exibição
  EC.fmtCpf = (c) => c.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  EC.debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  EC.downloadCsv = (name, rows) => {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
})();
