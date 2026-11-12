function pegarCookie(nome) {
  var cookies = document.cookie.split(';');

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();

    if (cookie.startsWith(nome + '=')) {
      return decodeURIComponent(cookie.substring(nome.length + 1));
    }
  }

  return null;
}


async function chamarApi(metodo, url, dados) {
  var opcoes = {
    method: metodo,
    headers: {}
  };

  if (dados !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(metodo.toUpperCase()) >= 0) {
    var token = pegarCookie('csrftoken');

    if (token) {
      opcoes.headers['X-CSRFToken'] = token;
    }
  }

  var resposta = await fetch(url, opcoes);

  var corpo = {};

  try {
    corpo = await resposta.json();
  } catch (erro) {
    corpo = {};
  }

  return {
    ok: resposta.ok,
    status: resposta.status,
    corpo: corpo
  };
}
