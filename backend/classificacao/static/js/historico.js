montarPagina().then(function (usuario) {
  if (usuario) {
    iniciarHistorico();
  }
});

async function iniciarHistorico() {
  var atendimentos = (await chamarApi('GET', '/api/atendimentos')).corpo;
  var parametros = (await chamarApi('GET', '/api/parametros')).corpo;
  var corpo = pegar('corpo');

  var opcoesCor = '<option value=""></option>';
  for (var n in parametros.classificacoes) {
    opcoesCor += '<option>' + escapar(parametros.classificacoes[n].nome) + '</option>';
  }
  pegar('fCor').innerHTML = opcoesCor;

  var filtros = ['fPaciente', 'fData', 'fCor', 'fProf'];
  for (var f = 0; f < filtros.length; f++) {
    pegar(filtros[f]).addEventListener('input', mostrarLista);
  }
  corpo.addEventListener('click', clicouNaLinha);
  corpo.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
      clicouNaLinha(evento);
    }
  });

  mostrarLista();

  function mesmaData(dataDoAtendimento, dataFiltro) {
    var p = dataFiltro.split('-');
    return dataDoAtendimento === p[2] + '/' + p[1] + '/' + p[0] || dataDoAtendimento === dataFiltro;
  }

  function mostrarLista() {
    var paciente = pegar('fPaciente').value.trim().toLowerCase();
    var data = pegar('fData').value;
    var cor = pegar('fCor').value;
    var prof = pegar('fProf').value.trim().toLowerCase();
    var lista = [];

    for (var i = 0; i < atendimentos.length; i++) {
      var a = atendimentos[i];

      if (paciente !== '' && a.paciente.toLowerCase().indexOf(paciente) < 0) {
        continue;
      }
      if (data !== '' && !mesmaData(a.data, data)) {
        continue;
      }
      if (cor !== '' && a.classificacao !== cor) {
        continue;
      }
      if (prof !== '' && a.profissional.toLowerCase().indexOf(prof) < 0) {
        continue;
      }
      lista.push(a);
    }

    lista.sort(function (a, b) {
      return b.id - a.id;
    });

    pegar('contador').textContent = lista.length;

    if (lista.length === 0) {
      corpo.innerHTML = '<p class="vazio">Nenhum atendimento encontrado.</p>';
      return;
    }

    var html = '';
    for (var j = 0; j < lista.length; j++) {
      var item = lista[j];
      html += '<div class="tr linha" data-id="' + item.id + '" tabindex="0" role="button" title="Ver detalhes">' +
        '<span class="c1">' + escapar(item.data) + '</span>' +
        '<span class="c2">' + escapar(item.hora) + '</span>' +
        '<span class="c3">' + escapar(item.paciente) + '</span>' +
        '<span class="c4">' + escapar(item.profissional) + '</span>' +
        '<span class="c5"><i class="pill" style="background:' + escapar(item.cor) + '" title="' + escapar(item.classificacao) + '"></i></span>' +
        '</div>';
    }
    corpo.innerHTML = html;
  }

  function clicouNaLinha(evento) {
    var linha = evento.target.closest('[data-id]');
    if (!linha) {
      return;
    }
    var id = linha.getAttribute('data-id');
    for (var i = 0; i < atendimentos.length; i++) {
      if (String(atendimentos[i].id) === id) {
        mostrarDetalhes(atendimentos[i]);
      }
    }
  }

  function linhaDetalhe(titulo, valor) {
    if (valor === '' || valor === undefined || valor === null) {
      valor = '—';
    }
    return '<dt>' + titulo + '</dt><dd>' + escapar(valor) + '</dd>';
  }

  function mostrarDetalhes(a) {
    var v = a.sinaisVitais || {};
    var vitais = 'Temp ' + (v.temp || '—') + ' °C · FC ' + (v.fc || '—') + ' · FR ' + (v.fr || '—') +
      ' · SpO₂ ' + (v.sat || '—') + '% · PA ' + (v.pas || '—') + '/' + (v.pad || '—');

    pegar('dlg').innerHTML =
      '<h2>' + escapar(a.paciente) + ' <span class="chip" style="background:' + escapar(a.cor) + '">' + escapar(a.classificacao) + '</span></h2>' +
      '<dl>' +
        linhaDetalhe('ID', a.id) +
        linhaDetalhe('Idade / faixa', a.idade + ' (' + a.faixa + ')') +
        linhaDetalhe('Peso', a.peso + ' kg') +
        linhaDetalhe('Sexo', a.sexo) +
        linhaDetalhe('Responsável', a.responsavel) +
        linhaDetalhe('Prontuário', a.prontuario) +
        linhaDetalhe('Profissional', a.profissional) +
        linhaDetalhe('Data / hora', a.data + ' ' + a.hora) +
        linhaDetalhe('Queixas', a.queixas.join(', ')) +
        linhaDetalhe('Sinais vitais', vitais) +
        linhaDetalhe('Estado geral', a.estadoGeral) +
        linhaDetalhe('Outros sinais', a.outrosSinais.join(', ')) +
        linhaDetalhe('Descrição de outros', a.outrosDescricao) +
        linhaDetalhe('Prioridade', a.prioridade) +
        linhaDetalhe('Tempo estimado', a.tempoEspera) +
        linhaDetalhe('Fatores', a.fatores.join('; ')) +
      '</dl>' +
      '<button class="btn peq" id="fechar">Fechar</button>';

    pegar('fechar').onclick = function () {
      pegar('dlg').close();
    };
    pegar('dlg').showModal();
  }
}