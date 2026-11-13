montarPagina().then(function (usuario) {
  if (usuario) {
    iniciarConfiguracoes(usuario);
  }
});

async function iniciarConfiguracoes(usuario) {
  var config = (await chamarApi('GET', '/api/config')).corpo;
  var parametros = (await chamarApi('GET', '/api/parametros')).corpo;

  preencherPerfil(usuario);
  pegar('btnSair').addEventListener('click', sair);
  pegar('hospital').value = config.hospital || 'NOME NÃO RECEBIDO';
  console.log('Hospital recebido:', config.hospital);

  var html = '';
  for (var n in parametros.classificacoes) {
    var c = parametros.classificacoes[n];
    html += '<tr>' +
      '<td><span class="chip" style="background:' + escapar(c.cor) + '">' + escapar(c.nome) + '</span></td>' +
      '<td><input type="text" data-nivel="' + n + '" data-campo="prioridade" value="' + escapar(c.prioridade) + '"></td>' +
      '<td><input type="text" data-nivel="' + n + '" data-campo="espera" value="' + escapar(c.espera) + '"></td>' +
      '</tr>';
  }
  pegar('tempos').innerHTML = html;

  if (usuario.perfil !== 'admin') {
    var campos = document.querySelectorAll('#tempos input');
    for (var i = 0; i < campos.length; i++) {
      campos[i].disabled = true;
    }

    pegar('hospital').disabled = true;
    pegar('salvar').hidden = true;
    pegar('aviso').hidden = false;
  }

  pegar('salvar').onclick = async function () {
    var campos = document.querySelectorAll('#tempos input');
    for (var i = 0; i < campos.length; i++) {
      var nivel = campos[i].getAttribute('data-nivel');
      var campo = campos[i].getAttribute('data-campo');
      parametros.classificacoes[nivel][campo] = campos[i].value.trim();
    }

    var r2 = await chamarApi('PUT', '/api/parametros', parametros);

   if (r2.ok) {
    pegar('ok').textContent = 'Configurações salvas.';
  } else {
    pegar('ok').textContent = r2.corpo.erro;
  }
    pegar('ok').hidden = false;
  };
}
