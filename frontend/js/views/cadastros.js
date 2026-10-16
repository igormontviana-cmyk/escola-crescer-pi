/* =========================================================
   Cadastros compartilhados (Professor, Coordenação e Gestor):
   criar turma (RF02, RN-003) e matricular aluno (RN-002)
   ========================================================= */
(function () {
  const D = EC.data, I = EC.icon, esc = EC.esc, S = EC.state;

  const SERIES = [
    ['6', 'EF', '6º Ano'], ['7', 'EF', '7º Ano'], ['8', 'EF', '8º Ano'], ['9', 'EF', '9º Ano'],
    ['1', 'EM', '1º Ano EM'], ['2', 'EM', '2º Ano EM'], ['3', 'EM', '3º Ano EM'],
  ];
  const nomeTurma = (n, nivel, letra) => (nivel === 'EM' ? `${n}ºEM - ${letra}` : `${n}º Ano - ${letra}`);

  /* ---------------- Nova turma ---------------- */
  EC.novaTurmaModal = (u, onDone) => {
    const discsDe = (nivel) => (nivel === 'EM' ? D.EM : D.EF);
    EC.modal(`${EC.modalHead('Nova turma', 'A turma aparece na lista de alunos, nas notas, na chamada e nas avaliações.')}
      <form class="modal-body form-grid" novalidate>
        <div class="field"><label for="nt-serie">Série</label><select id="nt-serie">${SERIES.map(([n, nv, l], i) => `<option value="${i}">${l}</option>`).join('')}</select></div>
        <div class="field"><label for="nt-letra">Turma</label><select id="nt-letra">${'ABCDEF'.split('').map((l) => `<option>${l}</option>`).join('')}</select><span class="msg" id="nt-dup">Essa turma já existe.</span></div>
        <div class="field"><label for="nt-turno">Turno</label><select id="nt-turno"><option>Matutino</option><option>Vespertino</option></select></div>
        <div class="field"><label for="nt-sala">Sala</label><input class="input" id="nt-sala" placeholder="Ex.: Sala 15" maxlength="20"></div>
        <div class="field full"><label>Grade curricular</label><div class="checks" id="nt-discs"></div><span class="msg" id="nt-grade">Marque ao menos uma disciplina (RN-003).</span></div>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="nt-ok">${I('plus', 'sm')} Criar turma</button></div>`, {
      wide: true,
      onMount(ov, close) {
        const $ = (s) => ov.querySelector(s);
        const grade = () => {
          const [, nivel] = SERIES[+$('#nt-serie').value];
          $('#nt-discs').innerHTML = Object.values(D.DISCIPLINAS).map((d) => `<label><input type="checkbox" class="check" value="${d.id}" ${discsDe(nivel).includes(d.id) ? 'checked' : ''}>${esc(d.nome)}</label>`).join('');
        };
        $('#nt-serie').addEventListener('change', grade);
        grade();
        $('#nt-ok').addEventListener('click', () => {
          const [n, nivel, rot] = SERIES[+$('#nt-serie').value];
          const letra = $('#nt-letra').value;
          const nome = nomeTurma(n, nivel, letra);
          const disciplinas = [...ov.querySelectorAll('#nt-discs input:checked')].map((x) => x.value);
          const dup = EC.turmas().some((t) => t.nome === nome);
          $('#nt-letra').closest('.field').classList.toggle('err', dup);
          $('#nt-discs').closest('.field').classList.toggle('err', !disciplinas.length);
          if (dup || !disciplinas.length) return;
          const id = 't' + Date.now().toString(36);
          S.turmasNovas.push({ id, nome, curto: `${n}° ano ${letra}`, serie: `${rot.replace(' EM', '')} ${nivel}`, turno: $('#nt-turno').value, sala: $('#nt-sala').value.trim() || 'A definir', disciplinas, criadaPor: u.nome });
          EC.save();
          EC.log(`Criou a turma ${nome}`);
          close();
          EC.toast(`Turma ${nome} criada. Agora é só matricular os alunos.`);
          if (onDone) onDone(id);
        });
      },
    });
  };

  /* ---------------- Matricular aluno ---------------- */
  let seq = 0;
  EC.novoAlunoModal = (u, turmaInicial, onDone) => {
    const ts = EC.turmas();
    EC.modal(`${EC.modalHead('Cadastrar aluno', 'O aluno entra na turma na hora: lista, notas, chamada e boletim. Senha inicial = CPF.')}
      <form class="modal-body form-grid" novalidate>
        <div class="field full"><label for="na-nome">Nome completo</label><input class="input" id="na-nome" maxlength="80" placeholder="Ex.: Maria Eduarda Santos" autocomplete="off"><span class="msg">Informe nome e sobrenome.</span></div>
        <div class="field"><label for="na-cpf">CPF</label><input class="input" id="na-cpf" inputmode="numeric" placeholder="000.000.000-00"><span class="msg" id="na-cpf-msg">CPF deve ter 11 dígitos.</span></div>
        <div class="field"><label for="na-nasc">Data de nascimento</label><input class="input" id="na-nasc" type="date"><span class="msg">Informe a data de nascimento.</span></div>
        <div class="field full"><label for="na-turma">Turma</label><select id="na-turma">${ts.map((t) => `<option value="${t.id}" ${t.id === turmaInicial ? 'selected' : ''}>${esc(t.nome)} · ${t.turno}</option>`).join('')}</select><span class="hint">Cada aluno fica em exatamente uma turma por período letivo (RN-002).</span></div>
        <div class="field full"><label for="na-resp">Responsável</label><input class="input" id="na-resp" maxlength="80" placeholder="Nome do pai, mãe ou responsável legal"><span class="msg">Informe o responsável (aluno menor de idade, LGPD Art. 14).</span></div>
      </form>
      <div class="modal-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="na-ok">${I('userPlus', 'sm')} Matricular</button></div>`, {
      onMount(ov, close) {
        const $ = (s) => ov.querySelector(s);
        $('#na-cpf').addEventListener('input', (e) => { e.target.value = EC.fmtCpf(e.target.value); });
        $('#na-ok').addEventListener('click', () => {
          const nome = $('#na-nome').value.trim().replace(/\s+/g, ' '), cpf = $('#na-cpf').value.replace(/\D/g, ''), nasc = $('#na-nasc').value, resp = $('#na-resp').value.trim(), turma = $('#na-turma').value;
          const cpfUsado = cpf.length === 11 && (EC.alunos().some((a) => a.cpf === cpf) || D.PROFESSORES.some((p) => p.cpf === cpf));
          $('#na-cpf-msg').textContent = cpfUsado ? 'Já existe um usuário com esse CPF.' : 'CPF deve ter 11 dígitos.';
          const errs = { '#na-nome': nome.split(' ').length < 2, '#na-cpf': cpf.length !== 11 || cpfUsado, '#na-nasc': !nasc, '#na-resp': resp.length < 3 };
          Object.entries(errs).forEach(([s, e]) => $(s).closest('.field').classList.toggle('err', e));
          if (Object.values(errs).some(Boolean)) return;
          const n = EC.alunosDaTurma(turma).length + 1 + seq++;
          const al = { id: 'n' + Date.now().toString(36), nome, turma, freq: 100, foto: null, cpf, nasc: nasc.split('-').reverse().join('/'), responsavel: resp, matricula: '2026' + String(90 + (Date.now() % 10)) + String(n).padStart(2, '0'), novo: true, criadoPor: u.nome };
          S.alunosNovos.push(al);
          EC.save();
          EC.log(`Matriculou ${nome} na turma ${EC.turma(turma).nome}`);
          close();
          EC.toast(`${nome.split(' ')[0]} matriculado(a) em ${EC.turma(turma).nome}`);
          if (onDone) onDone(al);
        });
      },
    });
  };
})();
