montarPagina().then(function (usuario) {
  if (usuario) {
    iniciarCadastro(usuario);
  }
});

async function iniciarCadastro(usuario) {
var parametros = (await chamarApi('GET', '/api/parametros')).corpo;
var form = pegar('form');
var campoClassificacao = pegar('classificacao');
var opcoesClassificacao = '<option value="">Selecione a classificação</option>';

for (var nivel in parametros.classificacoes) {
  var classificacao = parametros.classificacoes[nivel];

  opcoesClassificacao +=
    '<option value="' + escapar(classificacao.nivel) + '">' +
    escapar(classificacao.nome) +
    '</option>';
}

campoClassificacao.innerHTML = opcoesClassificacao;

montarLista('queixas', parametros.opcoes.queixas, 'checkbox', 'queixa');
montarLista('estado', parametros.opcoes.estados, 'checkbox', 'estado');
montarLista('sinais', parametros.opcoes.sinais, 'checkbox', 'sinal');

  pegar('profissional').value = usuario.nome;

  form.addEventListener('change', mostrarCampoOutros);

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    enviarCadastro();
  });

  function mostrarCampoOutros() {
    var sinais = valoresMarcados(form, 'sinal');
    pegar('outrosBox').hidden = sinais.indexOf('Outros') < 0;

    var sexo = valoresMarcados(form, 'sexo');
    pegar('sexoOutroBox').hidden = sexo.indexOf('Outro') < 0;
  }

  function lerFormulario() {
    var sexo = valoresMarcados(form, 'sexo');

    return {
      nome: pegar('nome').value.trim(),
      idade: pegar('idade').value,
      peso: pegar('peso').value,
      prontuario: pegar('prontuario').value.trim(),
      responsavel: pegar('responsavel').value.trim(),
      sexo: sexo.length > 0 ? sexo[0] : '',
      classificacaoNivel: pegar('classificacao').value,
      queixas: valoresMarcados(form, 'queixa'),
      estado: valoresMarcados(form, 'estado'),
      sinais: valoresMarcados(form, 'sinal'),
      outrosDescricao: pegar('outrosDesc').value.trim(),
      vitais: {
        temp: pegar('temp').value,
        fc: pegar('fc').value,
        fr: pegar('fr').value,
        sat: pegar('sat').value,
        pas: pegar('pas').value,
        pad: pegar('pad').value
      }
    };
  }

  async function enviarCadastro() {
    var aviso = pegar('aviso');

    limparErros(form);
    pegar('resultado').hidden = true;
    pegar('finalizado').hidden = true;

    var resposta = await chamarApi('POST', '/api/atendimentos', lerFormulario());

    if (!resposta.ok) {
      mostrarErrosDoServidor(resposta.corpo, aviso);
      return;
    }

    aviso.hidden = true;
    mostrarResultado(resposta.corpo);

    pegar('finalizado').hidden = false;

    form.reset();
    pegar('profissional').value = usuario.nome;
    mostrarCampoOutros();
  }

  function montarEscala(nivelAtual) {
    var html = '<ol class="escala">';

    for (var n = 1; n <= 5; n++) {
      var c = parametros.classificacoes[n];

      if (!c) {
        continue;
      }

      var classe = '';

      if (n === nivelAtual) {
        classe = 'atual';
      }

      html += '<li class="' + classe + '" style="background:' + escapar(c.cor) + '">' + escapar(c.nome) + '</li>';
    }

    return html + '</ol>';
  }

  function mostrarResultado(r) {
    var lista = '';

    for (var i = 0; i < r.fatores.length; i++) {
      lista += '<li>' + escapar(r.fatores[i]) + '</li>';
    }

    if (lista === '') {
      lista = '<li>Nenhum fator de risco informado</li>';
    }

    var caixa = pegar('resultado');

    caixa.innerHTML =
      '<h3 style="background:' + escapar(r.cor) + '">Classificação de risco: ' + escapar(r.classificacao) + '</h3>' +
      montarEscala(r.nivel) +
      '<dl>' +
        '<dt>Cor</dt><dd>' + escapar(r.classificacao) + '</dd>' +
        '<dt>Nível de prioridade</dt><dd>' + escapar(r.prioridade) + '</dd>' +
        '<dt>Tempo estimado de espera</dt><dd>' + escapar(r.tempoEspera) + '</dd>' +
        '<dt>Faixa etária</dt><dd>' + escapar(r.faixa) + '</dd>' +
      '</dl>' +
      '<h4>Fatores que influenciaram</h4>' +
      '<ul>' + lista + '</ul>' +
      '<p>Ferramenta de apoio: não substitui a avaliação e o julgamento do profissional de saúde. Atendimento registrado no histórico.</p>';

    caixa.hidden = false;
    caixa.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
