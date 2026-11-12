var configSistema = {};

function icone(nome) {
  return '<i class="i i-' + nome + '"></i>';
}

function pegar(id) {
  return document.getElementById(id);
}

function escapar(texto) {
  return String(texto === undefined || texto === null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function atualizarRelogio() {
  var meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  var agora = new Date();

  pegar('hora').textContent = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  pegar('data').textContent = agora.getDate() + ' de ' +
    meses[agora.getMonth()] + ' de ' + agora.getFullYear();
}

function montarLista(idLista, opcoes, tipo, nome) {
  var html = '';

  for (var i = 0; i < opcoes.length; i++) {
    html += '<label class="opc">' +
      '<input class="cx" type="' + tipo + '" name="' + nome +
      '" value="' + escapar(opcoes[i]) + '">' +
      escapar(opcoes[i]) + '</label>';
  }

  pegar(idLista).innerHTML = html;
}

function valoresMarcados(form, nome) {
  var campos = form.querySelectorAll('input[name="' + nome + '"]:checked');
  var valores = [];

  for (var i = 0; i < campos.length; i++) {
    valores.push(campos[i].value);
  }

  return valores;
}

function mostrarErro(idCampo, mensagem) {
  var elemento = pegar(idCampo);
  var campo = elemento ? elemento.closest('.campo') : null;

  if (!campo) {
    return;
  }

  campo.classList.add('erro');

  var msg = campo.querySelector('.msg');

  if (msg) {
    msg.textContent = mensagem;
  }
}

function limparErros(form) {
  var campos = form.querySelectorAll('.campo.erro');

  for (var i = 0; i < campos.length; i++) {
    campos[i].classList.remove('erro');
  }
}

function mostrarErrosDoServidor(corpo, aviso) {
  var erros = corpo.erros;

  if (!erros) {
    erros = [{
      campo: null,
      mensagem: corpo.erro || 'Não foi possível salvar.'
    }];
  }

  var textos = [];

  for (var i = 0; i < erros.length; i++) {
    if (erros[i].campo) {
      mostrarErro(erros[i].campo, erros[i].mensagem);
    }

    textos.push(erros[i].mensagem);
  }

  aviso.textContent = 'Corrija os campos destacados: ' + textos.join(' ');
  aviso.hidden = false;

  var primeiro = erros[0].campo ? pegar(erros[0].campo) : null;

  if (primeiro) {
    primeiro.scrollIntoView({ block: 'center' });
  }
}


async function sair() {
  var resposta = await chamarApi('POST', '/api/logout');

  if (resposta.ok) {
    window.location.href = '/';
  } else {
    alert('Não foi possível encerrar a sessão. Tente novamente.');
  }
}


function preencherPerfil(sessao) {
  var nome = sessao.nome || sessao.usuario || '';

  var partes = nome.split(' ').filter(function (p) {
    return p !== '';
  });

  var iniciais = partes.length > 1
    ? partes[0][0] + partes[partes.length - 1][0]
    : nome.slice(0, 2);

  pegar('perfilAvatar').textContent = iniciais.toUpperCase();
  pegar('perfilNome').textContent = nome;

  pegar('perfilCargo').textContent = sessao.cargo ||
    (sessao.perfil === 'admin' ? 'Administrador' : 'Enfermeiro');

  pegar('perfilUsuario').textContent = sessao.usuario || '—';
  pegar('perfilInst').textContent = configSistema.hospital || '—';

  pegar('perfilDepto').textContent = sessao.departamento ||
    (sessao.perfil === 'admin' ? 'Administração' : 'Atendimento');
}


async function montarPagina() {
  var pagina = document.body.getAttribute('data-pagina');

  var resposta = await chamarApi('GET', '/api/sessao');

  if (!resposta.ok) {
    window.location.href = '/';
    return null;
  }

  var sessao = resposta.corpo;
  var admin = sessao.perfil === 'admin';

  if (!admin && sessao.perfil !== 'enfermeiro') {
    window.location.href = '/';
    return null;
  }

  var itens;

  if (admin) {
    itens = [
      {
        pagina: 'administrador',
        href: '/administrador/',
        texto: 'Administrador',
        icone: 'usuario-config'
      },
      {
        pagina: 'parametros',
        href: '/parametros/',
        texto: 'Novos parâmetros',
        icone: 'usuario-config'
      },
      {
        pagina: 'historico',
        href: '/historico/',
        texto: 'Histórico de atendimentos',
        icone: 'prancheta'
      }
    ];
  } else {
    itens = [
      {
        pagina: 'cadastro',
        href: '/cadastro/',
        texto: 'Cadastro de paciente',
        icone: 'usuario'
      },
      {
        pagina: 'historico',
        href: '/historico/',
        texto: 'Histórico de atendimentos',
        icone: 'prancheta'
      },
      {
        pagina: 'configuracoes',
        href: '/configuracoes/',
        texto: 'Configurações',
        icone: 'engrenagem'
      }
    ];
  }

  var menu = '';

  for (var j = 0; j < itens.length; j++) {
    var classe = itens[j].pagina === pagina ? 'ativo' : '';

    menu += '<a href="' + itens[j].href + '" class="' + classe + '">' +
      icone(itens[j].icone) + itens[j].texto + '</a>';
  }

  pegar('menu').innerHTML = menu;

  configSistema = {
    hospital: 'Hospital Municipal Getúlio Vargas Filho'
  };

  pegar('topo').innerHTML =
    '<button type="button" id="menuBtn" aria-label="Menu">☰</button>' +
    icone('predio') +
    '<span class="hosp">' + escapar(configSistema.hospital) + '</span>' +
    '<div class="hora"><b>' + icone('relogio') +
    '<span id="hora"></span></b><small id="data"></small></div>';

  pegar('menuBtn').onclick = function () {
    pegar('menu').classList.toggle('aberta');
  };

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  return sessao;
}
