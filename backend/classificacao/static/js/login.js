function destinoDe(sessao) {
  return sessao.perfil === 'admin'
    ? '/administrador/'
    : '/cadastro/';
}


async function verificarSessao() {
  var resposta = await chamarApi('GET', '/api/sessao');

  if (resposta.ok) {
    window.location.href = destinoDe(resposta.corpo);
  }
}


pegar('verSenha').addEventListener('click', function () {
  var campo = pegar('senha');

  campo.type = campo.type === 'password'
    ? 'text'
    : 'password';
});


pegar('fLogin').addEventListener('submit', async function (evento) {
  evento.preventDefault();

  var mensagem = pegar('erroLogin');
  var botao = evento.submitter;
  var usuario = pegar('usuario').value.trim();
  var senha = pegar('senha').value;

  mensagem.hidden = true;

  if (usuario === '' || senha === '') {
    mensagem.textContent = 'Informe usuário e senha.';
    mensagem.hidden = false;
    return;
  }

  if (botao) {
    botao.disabled = true;
  }

  var resposta = await chamarApi('POST', '/api/login', {
    usuario: usuario,
    senha: senha
  });

  if (!resposta.ok) {
    mensagem.textContent = resposta.corpo.erro || 'Não foi possível entrar.';
    mensagem.hidden = false;

    if (botao) {
      botao.disabled = false;
    }

    return;
  }

  window.location.href = destinoDe(resposta.corpo);
});


verificarSessao();