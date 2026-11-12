// pagina do administrador 

montarPagina().then(function (usuario) {
  if (usuario) {
    iniciarAdministrador(usuario);
  }
});

async function iniciarAdministrador(admin) {
  var form = pegar('fUser');
  var tabela = pegar('usuarios');
  var mensagem = pegar('msgUser');
  var usuarios = [];

  preencherPerfil(admin);
  pegar('btnSair').addEventListener('click', sair);

  async function listarUsuarios() {
    var resposta = await chamarApi('GET', '/api/usuarios');

    if (!resposta.ok) {
      alert(resposta.corpo.erro || 'Não foi possível carregar os usuários.');
      return;
    }

    usuarios = resposta.corpo;

    tabela.innerHTML = '';

    usuarios.forEach(function (usuario) {
      var linha = document.createElement('tr');

      linha.innerHTML = `
        <td>${escapar(usuario.nome)}</td>
        <td>${escapar(usuario.usuario)}</td>
        <td>${usuario.perfil === 'admin' ? 'Administrador' : 'Enfermeiro'}</td>
        <td>
          <button type="button" data-editar="${usuario.id}">Editar</button>
          <button type="button" data-remover="${usuario.id}">Excluir</button>
        </td>
      `;

      tabela.appendChild(linha);
    });
  }

  function escapar(valor) {
    var elemento = document.createElement('span');
    elemento.textContent = valor || '';
    return elemento.innerHTML;
  }

  async function clicouNaTabela(evento) {
    var botao = evento.target.closest('button');

    if (!botao) {
      return;
  }

    var idEditar = botao.getAttribute('data-editar');
    var idRemover = botao.getAttribute('data-remover');

    if (idEditar !== null) {
      var usuario = usuarios.find(function (item) {
        return String(item.id) === idEditar;
      });

      if (usuario) {
        form.elements.id.value = usuario.id;
        form.elements.nome.value = usuario.nome;
        form.elements.usuario.value = usuario.usuario;
        form.elements.perfil.value = usuario.perfil;
        form.elements.senha.value = '';
        form.elements.senha.placeholder = 'Vazio = manter';
      }
    }

    if (idRemover !== null && confirm('Remover este usuário?')) {
      var resposta = await chamarApi(
        'DELETE',
        '/api/usuarios/' + idRemover
      );

      if (!resposta.ok) {
        alert(resposta.corpo.erro || 'Não foi possível excluir.');
        return;
      }

      await listarUsuarios();
      mensagem.textContent = 'Usuário excluído com sucesso.';
      mensagem.hidden = false;
    }
  }

  async function salvarFormulario(evento) {
    evento.preventDefault();

    var campos = form.elements;
    var id = campos.id.value;

    var dados = {
      nome: campos.nome.value.trim(),
      usuario: campos.usuario.value.trim(),
      perfil: campos.perfil.value,
      senha: campos.senha.value
    };

    var resposta;

    if (id === '') {
      resposta = await chamarApi('POST', '/api/usuarios', dados);
    } else {
      resposta = await chamarApi('PUT', '/api/usuarios/' + id, dados);
    }

    if (!resposta.ok) {
      mensagem.textContent = resposta.corpo.erro || 'Não foi possível salvar.';
      mensagem.hidden = false;
      return;
    }

    form.reset();
    campos.id.value = '';
    campos.senha.placeholder = '';

    await listarUsuarios();

    mensagem.textContent = id === ''
      ? 'Usuário cadastrado com sucesso!'
      : 'Usuário atualizado com sucesso!';

    mensagem.hidden = false;
  }

  tabela.addEventListener('click', clicouNaTabela);
  form.addEventListener('submit', salvarFormulario);

  await listarUsuarios();
}
