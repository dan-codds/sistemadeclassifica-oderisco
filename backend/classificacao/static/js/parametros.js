montarPagina().then(function (usuario) {
  if (usuario) {
    iniciarParametros(usuario);
  }
});

async function iniciarParametros(usuario) {
  var parametros = (await chamarApi('GET', '/api/parametros')).corpo;
  var form = pegar('form');
  var modal = pegar('modal');
  var vitais = ['temp', 'fc', 'fr', 'sat', 'pas', 'pad'];
  var regras = [];
  var idEdicao = null;

  montarLista('queixas', parametros.opcoes.queixas, 'checkbox', 'queixa');
  montarLista('estado', parametros.opcoes.estados, 'radio', 'estado');
  montarLista('sinais', parametros.opcoes.sinais, 'checkbox', 'sinal');

  var opcoesCor = '<option value="">Ex: Vermelho</option>';
  for (var n in parametros.classificacoes) {
    opcoesCor += '<option value="' + n + '">' + escapar(parametros.classificacoes[n].nome) + '</option>';
  }
  pegar('regraCor').innerHTML = opcoesCor;

  var opcoesFaixa = '<option value="">Todas as faixas etárias</option>';
  for (var i = 0; i < parametros.faixasEtarias.length; i++) {
    var faixa = parametros.faixasEtarias[i];
    opcoesFaixa += '<option value="' + faixa.id + '">' + escapar(faixa.nome) + '</option>';
  }
  pegar('regraFaixa').innerHTML = opcoesFaixa;

  await listarRegras();

  pegar('novaRegra').addEventListener('click', function () { abrirModal(null); });
  pegar('fecharModal').addEventListener('click', fecharModal);
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !modal.hidden) {
      fecharModal();
    }
  });
  pegar('regras').addEventListener('click', clicouNaLista);
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    salvar();
  });

  function dataDeHoje() {
    var hoje = new Date();
    var dia = String(hoje.getDate()).padStart(2, '0');
    var mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return dia + '/' + mes + '/' + hoje.getFullYear();
  }

  function resumirCondicoes(r) {
    var partes = r.queixas.concat(r.sinais);
    if (r.estado) {
      partes.push('Estado: ' + r.estado);
    }
    var nomes = { temp: 'Temp', fc: 'FC', fr: 'FR', sat: 'SpO₂', pas: 'PAS', pad: 'PAD' };
    for (var chave in r.vitais) {
      if (r.vitais[chave] !== '' && r.vitais[chave] !== null) {
        partes.push(nomes[chave] + ' ' + r.vitais[chave]);
      }
    }
    return partes.join(', ');
  }

  async function listarRegras() {
    regras = (await chamarApi('GET', '/api/regras')).corpo;

    if (regras.length === 0) {
      pegar('regras').innerHTML = '<p class="vazio">Nenhum parâmetro criado ainda. Use "Nova Regra".</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < regras.length; i++) {
      var r = regras[i];
      var cor = parametros.classificacoes[r.nivel];

      var faixa = 'Todas as faixas etárias';
      for (var j = 0; j < parametros.faixasEtarias.length; j++) {
        if (parametros.faixasEtarias[j].id === r.faixa) {
          faixa = parametros.faixasEtarias[j].nome;
        }
      }

      html += '<div class="regra">' +
        '<div class="nome"><b>' + escapar(r.nome) + '</b><span>' + escapar(faixa) + '</span></div>' +
        '<span class="def" title="' + escapar(resumirCondicoes(r)) + '">' + escapar(resumirCondicoes(r) || 'parâmetro definido') + '</span>' +
        '<div class="acoes">' +
          '<span class="etiq" style="--cor:' + escapar(cor.cor) + '">' + escapar(cor.nome) + '</span>' +
          '<input class="ativa" type="checkbox" checked disabled aria-label="Regra ativa">' +
          '<button type="button" class="icone" data-editar="' + r.id + '" aria-label="Editar">' + icone('lapis') + '</button>' +
          '<button type="button" class="icone" data-remover="' + r.id + '" aria-label="Remover">' + icone('lixeira') + '</button>' +
        '</div>' +
        '</div>';
    }
    pegar('regras').innerHTML = html;
  }

  async function clicouNaLista(evento) {
    var botao = evento.target.closest('button');
    if (!botao) {
      return;
    }

    var idEditar = botao.getAttribute('data-editar');
    var idRemover = botao.getAttribute('data-remover');

    if (idEditar !== null) {
      for (var i = 0; i < regras.length; i++) {
        if (String(regras[i].id) === idEditar) {
          abrirModal(regras[i]);
        }
      }
    }

    if (idRemover !== null && confirm('Remover este parâmetro?')) {
      await chamarApi('DELETE', '/api/regras/' + idRemover);
      listarRegras();
    }
  }

  function marcarOpcoes(nome, valores) {
    var campos = form.querySelectorAll('input[name="' + nome + '"]');
    for (var i = 0; i < campos.length; i++) {
      campos[i].checked = valores.indexOf(campos[i].value) >= 0;
    }
  }

  function abrirModal(r) {
    idEdicao = r ? r.id : null;
    form.reset();
    limparErros(form);
    pegar('aviso').hidden = true;

    pegar('tituloModal').textContent = r ? 'EDITAR PARÂMETRO DE CLASSIFICAÇÃO' : 'NOVO PARÂMETRO DE CLASSIFICAÇÃO';
    pegar('botaoSalvar').textContent = r ? 'SALVAR ALTERAÇÕES' : 'CRIAR PARÂMETRO DE CLASSIFICAÇÃO';

    if (r) {
      pegar('regraNome').value = r.nome;
      pegar('regraData').value = r.dataCriacao;
      pegar('regraProf').value = r.profissional;
      pegar('regraCor').value = r.nivel;
      pegar('regraFaixa').value = r.faixa;
      marcarOpcoes('queixa', r.queixas);
      marcarOpcoes('sinal', r.sinais);
      marcarOpcoes('estado', r.estado ? [r.estado] : []);
      for (var i = 0; i < vitais.length; i++) {
        pegar(vitais[i]).value = r.vitais[vitais[i]] || '';
      }
    } else {
      pegar('regraData').value = dataDeHoje();
      var nome = usuario.nome || usuario.usuario;
      pegar('regraProf').value = nome === 'Administrador' ? nome : nome + ' (Administrador)';
    }

    modal.hidden = false;
    modal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    pegar('regraNome').focus();
  }

  function fecharModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function lerFormulario() {
    var estado = valoresMarcados(form, 'estado');
    var dados = {
      nome: pegar('regraNome').value.trim(),
      dataCriacao: pegar('regraData').value.trim(),
      profissional: pegar('regraProf').value.trim(),
      nivel: pegar('regraCor').value,
      faixa: pegar('regraFaixa').value,
      queixas: valoresMarcados(form, 'queixa'),
      estado: estado.length > 0 ? estado[0] : '',
      sinais: valoresMarcados(form, 'sinal'),
      vitais: {}
    };

    for (var i = 0; i < vitais.length; i++) {
      dados.vitais[vitais[i]] = pegar(vitais[i]).value.trim();
    }
    return dados;
  }

  async function salvar() {
    var aviso = pegar('aviso');
    limparErros(form);

    var resposta;
    if (idEdicao) {
      resposta = await chamarApi('PUT', '/api/regras/' + idEdicao, lerFormulario());
    } else {
      resposta = await chamarApi('POST', '/api/regras', lerFormulario());
    }

    if (!resposta.ok) {
      mostrarErrosDoServidor(resposta.corpo, aviso);
      return;
    }

    fecharModal();
    listarRegras();
  }
}