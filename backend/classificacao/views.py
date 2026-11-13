import json

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import (
    Paciente,
    Atendimento,
    Classificacao,
    FaixaEtaria,
    Regra,
    ConfiguracaoSistema
)
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.utils import timezone

OPCOES_PARAMETROS = {
    'queixas': [
        'Febre',
        'Diarreia',
        'Trauma',
        'Dor de cabeça',
        'Acidente',
        'Tosse',
        'Queimadura',
        'Vômito',
        'Convulsão',
        'Dor no peito',
        'Dor abdominal',
        'Dificuldade para respirar',
        'Reação alérgica',
        'Intoxicação'
    ],
    'estados': [
        'Alerta',
        'Sonolento',
        'Inconsciente',
        'Irritado',
        'Prostrado'
    ],
    'sinais': [
        'Dor',
        'Cianose',
        'Petéquias',
        'Palidez',
        'Tiragem',
        'Recusa alimentação',
        'Desidratação',
        'Sangramento',
        'Sonolência excessiva',
        'Diminuição da diurese',
        'Rigidez de nuca',
        'Extremidades frias',
        'Gemência',
        'Vômitos persistentes',
        'Outros'
    ]
}

def eh_admin(usuario):
    return (
        usuario.is_superuser
        or usuario.groups.filter(name='Administrador').exists()
    )


def eh_enfermeiro(usuario):
    return usuario.groups.filter(name='Enfermeiro').exists()


def dados_sessao(usuario):
    admin = eh_admin(usuario)

    return {
        'id': usuario.id,
        'nome': usuario.get_full_name() or usuario.username,
        'usuario': usuario.username,
        'perfil': 'admin' if admin else 'enfermeiro',
        'cargo': 'Administrador' if admin else 'Enfermeiro',
    }


# api de usuarios

@require_http_methods(["GET", "POST"])
def api_usuarios(request):
    if not request.user.is_authenticated:
        return JsonResponse({'erro': 'Faça login novamente.'}, status=401)

    if not eh_admin(request.user):
        return JsonResponse(
            {'erro': 'Acesso permitido somente ao administrador.'},
            status=403
        )

    Usuario = get_user_model()

    
    if request.method == 'GET':
        usuarios = []

        for pessoa in Usuario.objects.all().order_by('first_name', 'username'):
            perfil = 'admin' if eh_admin(pessoa) else 'enfermeiro'

            usuarios.append({
                'id': pessoa.id,
                'nome': pessoa.get_full_name() or pessoa.username,
                'usuario': pessoa.username,
                'perfil': perfil,
            })

        return JsonResponse(usuarios, safe=False)

    
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    nome = dados.get('nome', '').strip()
    nome_usuario = dados.get('usuario', '').strip()
    senha = dados.get('senha', '')
    perfil = dados.get('perfil', '')

    if not nome or not nome_usuario or not senha:
        return JsonResponse(
            {'erro': 'Preencha nome, usuário e senha.'},
            status=400
        )

    if perfil not in ['admin', 'enfermeiro']:
        return JsonResponse({'erro': 'Perfil inválido.'}, status=400)

    if Usuario.objects.filter(username=nome_usuario).exists():
        return JsonResponse(
            {'erro': 'Esse nome de usuário já está em uso.'},
            status=400
        )

    grupo_nome = 'Administrador' if perfil == 'admin' else 'Enfermeiro'
    grupo = Group.objects.get(name=grupo_nome)

    pessoa = Usuario.objects.create_user(
        username=nome_usuario,
        password=senha,
        first_name=nome
    )

    pessoa.groups.add(grupo)

    return JsonResponse({
        'mensagem': 'Usuário cadastrado com sucesso.',
        'id': pessoa.id
    }, status=201)


#api de edição e exclusão de usuário

@require_http_methods(["PUT", "DELETE"])
def api_usuario(request, id):
    if not request.user.is_authenticated:
        return JsonResponse({'erro': 'Faça login novamente.'}, status=401)

    if not eh_admin(request.user):
        return JsonResponse(
            {'erro': 'Acesso permitido somente ao administrador.'},
            status=403
        )

    Usuario = get_user_model()

    try:
        pessoa = Usuario.objects.get(id=id)
    except Usuario.DoesNotExist:
        return JsonResponse(
            {'erro': 'Usuário não encontrado.'},
            status=404
        )

    # Excluir usuário
    if request.method == 'DELETE':
        if pessoa.id == request.user.id:
            return JsonResponse(
                {'erro': 'Você não pode excluir sua própria conta.'},
                status=400
            )

        if pessoa.is_superuser:
            return JsonResponse(
                {'erro': 'Não é permitido excluir um superusuário por esta tela.'},
                status=400
            )

        pessoa.delete()

        return JsonResponse({
            'mensagem': 'Usuário excluído com sucesso.'
        })

   #editar usuario

    if pessoa.is_superuser:
        return JsonResponse(
            {'erro': 'Não é permitido editar um superusuário por esta tela.'},
            status=400
    )

    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    nome = dados.get('nome', '').strip()
    nome_usuario = dados.get('usuario', '').strip()
    senha = dados.get('senha', '')
    perfil = dados.get('perfil', '')

    if not nome or not nome_usuario:
        return JsonResponse(
            {'erro': 'Nome e usuário são obrigatórios.'},
            status=400
        )

    if perfil not in ['admin', 'enfermeiro']:
        return JsonResponse({'erro': 'Perfil inválido.'}, status=400)

    if Usuario.objects.filter(username=nome_usuario).exclude(id=id).exists():
        return JsonResponse(
            {'erro': 'Esse nome de usuário já está em uso.'},
            status=400
        )

    if pessoa.id == request.user.id and perfil != 'admin':
        return JsonResponse(
            {'erro': 'Você não pode alterar seu próprio perfil de administrador.'},
            status=400
        )

    pessoa.first_name = nome
    pessoa.username = nome_usuario

    if senha:
        pessoa.set_password(senha)

    grupo_nome = 'Administrador' if perfil == 'admin' else 'Enfermeiro'
    grupo = Group.objects.get(name=grupo_nome)

    pessoa.groups.set([grupo])
    pessoa.save()

    return JsonResponse({
        'mensagem': 'Usuário atualizado com sucesso.'
    })


#login e sessão

@ensure_csrf_cookie
def inicio(request):
    if request.user.is_authenticated:
        if eh_admin(request.user):
            return redirect('/administrador/')
        if eh_enfermeiro(request.user):
            return redirect('/cadastro/')

    return render(request, 'classificacao/index.html')


@require_POST
def api_login(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    if not isinstance(dados, dict):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    usuario = dados.get('usuario', '').strip()
    senha = dados.get('senha', '')

    if not usuario or not senha:
        return JsonResponse(
            {'erro': 'Informe usuário e senha.'},
            status=400
        )

    pessoa = authenticate(
        request,
        username=usuario,
        password=senha
    )

    if pessoa is None:
        return JsonResponse(
            {'erro': 'Usuário ou senha incorretos.'},
            status=401
        )

    if not eh_admin(pessoa) and not eh_enfermeiro(pessoa):
        return JsonResponse(
            {'erro': 'Usuário sem perfil autorizado.'},
            status=403
        )

    login(request, pessoa)

    return JsonResponse(dados_sessao(pessoa))


@require_GET
def api_sessao(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {'erro': 'Usuário não autenticado.'},
            status=401
        )

    if not eh_admin(request.user) and not eh_enfermeiro(request.user):
        return JsonResponse(
            {'erro': 'Usuário sem perfil autorizado.'},
            status=403
        )

    return JsonResponse(dados_sessao(request.user))


@require_POST
@login_required(login_url='/')
def api_logout(request):
    logout(request)
    return JsonResponse({'mensagem': 'Sessão encerrada.'})


#paginas do sistema

@login_required(login_url='/')
@user_passes_test(eh_enfermeiro, login_url='/sem-usuario/')
def cadastro(request):
    return render(request, 'classificacao/cadastro.html')


@login_required(login_url='/')
@user_passes_test(
    lambda usuario: eh_admin(usuario) or eh_enfermeiro(usuario),
    login_url='/sem-usuario/'
)
def configuracoes(request):
    return render(request, 'classificacao/configuracoes.html')

@login_required(login_url='/')
@user_passes_test(
    lambda usuario: eh_enfermeiro(usuario) or eh_admin(usuario),
    login_url='/sem-usuario/'
)
def historico(request):
    return render(request, 'classificacao/historico.html')

@login_required(login_url='/')
@user_passes_test(eh_admin, login_url='/sem-usuario/')
def administrador(request):
    return render(request, 'classificacao/administrador.html')


@login_required(login_url='/')
@user_passes_test(eh_admin, login_url='/sem-usuario/')
def parametros(request):
    return render(request, 'classificacao/parametros.html')


def sem_usuario(request):
    return render(request, 'classificacao/sem-usuario.html')


@require_http_methods(["GET", "POST"])
@login_required
def api_atendimentos(request):
    if not (eh_enfermeiro(request.user) or eh_admin(request.user)):
        return JsonResponse({'erro': 'Acesso não autorizado.'}, status=403)

    
    if request.method == 'GET':
        atendimentos = Atendimento.objects.select_related(
            'paciente', 'enfermeiro'
        ).order_by('-data_hora')

        lista = []

        for atendimento in atendimentos:
            paciente = atendimento.paciente
            data_hora = timezone.localtime(atendimento.data_hora)

            lista.append({
                'id': atendimento.id,
                'paciente': paciente.nome,
                'data': data_hora.strftime('%Y-%m-%d'),
                'hora': data_hora.strftime('%H:%M'),
                'profissional': (
                    atendimento.enfermeiro.get_full_name()
                    or atendimento.enfermeiro.username
                ),
                'cor': atendimento.cor or '',
                'classificacao': atendimento.classificacao or '',
                'idade': atendimento.idade,
                'faixa': atendimento.faixa_etaria or '',
                'peso': str(atendimento.peso),
                'sexo': paciente.sexo,
                'responsavel': paciente.responsavel,
                'prontuario': paciente.prontuario,
                'queixas': atendimento.queixas or [],
                'sinaisVitais': {
                    'temp': str(atendimento.temperatura) if atendimento.temperatura is not None else '',
                    'fc': atendimento.frequencia_cardiaca or '',
                    'fr': atendimento.frequencia_respiratoria or '',
                    'sat': atendimento.saturacao or '',
                    'pas': atendimento.pressao_sistolica or '',
                    'pad': atendimento.pressao_diastolica or '',
                },
                'estadoGeral': atendimento.estado_geral or [],
                'outrosSinais': atendimento.sinais_clinicos or [],
                'outrosDescricao': atendimento.outros_descricao or '',
                'prioridade': atendimento.prioridade or '',
                'tempoEspera': atendimento.tempo_espera or '',
                'fatores': atendimento.fatores or [],
            })

        return JsonResponse(lista, safe=False)

    
    if not eh_enfermeiro(request.user):
        return JsonResponse(
            {'erro': 'Apenas enfermeiros podem cadastrar atendimentos.'},
            status=403
        )

    try:
        dados = json.loads(request.body)

        if not isinstance(dados, dict):
            raise ValueError()

    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'erro': 'Dados inválidos.'}, status=400)

    nome = dados.get('nome')
    prontuario = dados.get('prontuario')
    responsavel = dados.get('responsavel')
    sexo = dados.get('sexo')

    if not all(isinstance(campo, str) and campo.strip()
               for campo in [nome, prontuario, responsavel, sexo]):
        return JsonResponse(
            {'erro': 'Preencha nome, prontuário, responsável e sexo.'},
            status=400
        )

    if sexo not in ['Masculino', 'Feminino', 'Outro'] and not (
        isinstance(sexo, str) and sexo.strip()
    ):
        return JsonResponse({'erro': 'Sexo inválido.'}, status=400)

    try:
        idade = int(dados.get('idade'))
        peso = Decimal(str(dados.get('peso')).replace(',', '.'))

        if idade < 0 or idade > 14 or peso <= 0:
            raise ValueError()

    except (ValueError, TypeError, InvalidOperation):
        return JsonResponse(
            {'erro': 'A idade deve estar entre 0 e 14 anos e o peso deve ser maior que zero.'},
            status=400
        )

    vitais = dados.get('vitais') or {}

    if not isinstance(vitais, dict):
        return JsonResponse({'erro': 'Sinais vitais inválidos.'}, status=400)

    def converter_decimal(valor):
        if valor in [None, '']:
            return None
        return Decimal(str(valor).replace(',', '.'))

    def converter_inteiro(valor):
        if valor in [None, '']:
            return None
        return int(valor)

    try:
        temperatura = converter_decimal(vitais.get('temp'))
        fc = converter_inteiro(vitais.get('fc'))
        fr = converter_inteiro(vitais.get('fr'))
        sat = converter_inteiro(vitais.get('sat'))
        pas = converter_inteiro(vitais.get('pas'))
        pad = converter_inteiro(vitais.get('pad'))

    except (ValueError, TypeError, InvalidOperation):
        return JsonResponse(
            {'erro': 'Confira os valores dos sinais vitais.'},
            status=400
        )

    classificacao_nivel = dados.get('classificacaoNivel')

    try:
        classificacao_nivel = int(classificacao_nivel)
        classificacao = Classificacao.objects.get(nivel=classificacao_nivel)
    except (ValueError, TypeError, Classificacao.DoesNotExist):
        return JsonResponse(
            {'erro': 'Selecione uma classificação válida.'},
            status=400
        )

    queixas = dados.get('queixas') or []
    estado = dados.get('estado') or []
    sinais = dados.get('sinais') or []
    outros = dados.get('outrosDescricao') or ''

    if not all(isinstance(lista, list) for lista in [queixas, estado, sinais]):
        return JsonResponse({'erro': 'Opções do atendimento inválidas.'}, status=400)

    if not isinstance(outros, str):
        return JsonResponse({'erro': 'Descrição inválida.'}, status=400)

    try:
        with transaction.atomic():
            paciente, criado = Paciente.objects.get_or_create(
                prontuario=prontuario.strip(),
                defaults={
                    'nome': nome.strip(),
                    'responsavel': responsavel.strip(),
                    'sexo': sexo,
                }
            )

            atendimento = Atendimento.objects.create(
                paciente=paciente,
                enfermeiro=request.user,
                idade=idade,
                peso=peso,
                queixas=queixas,
                estado_geral=estado,
                sinais_clinicos=sinais,
                fatores=queixas + estado + sinais,
                outros_descricao=outros,
                temperatura=temperatura,
                frequencia_cardiaca=fc,
                frequencia_respiratoria=fr,
                saturacao=sat,
                pressao_sistolica=pas,
                pressao_diastolica=pad,
                classificacao=classificacao.nome,
                nivel=classificacao.nivel,
                cor=classificacao.cor,
                prioridade=classificacao.prioridade,
                tempo_espera=classificacao.espera,
                faixa_etaria='Pediátrica',
            )

    except Exception:
        return JsonResponse(
            {'erro': 'Não foi possível salvar o atendimento. Confira os dados.'},
            status=400
        )

    return JsonResponse({
        'mensagem': 'Atendimento cadastrado com sucesso!',
        'id': atendimento.id,
        'fatores': atendimento.fatores,
        'cor': atendimento.cor,
        'classificacao': atendimento.classificacao,
        'nivel': atendimento.nivel,
        'prioridade': atendimento.prioridade,
        'tempoEspera': atendimento.tempo_espera,
        'faixa': atendimento.faixa_etaria,
    }, status=201)

@require_http_methods(["GET", "PUT"])
@login_required
def api_config(request):

    if not (eh_admin(request.user) or eh_enfermeiro(request.user)):
        return JsonResponse(
            {'erro': 'Acesso não autorizado.'},
            status=403
        )

    configuracao = ConfiguracaoSistema.objects.first()

    if configuracao is None:
        configuracao = ConfiguracaoSistema.objects.create(
            hospital=''
        )

    if request.method == 'GET':
        return JsonResponse({
            'hospital': configuracao.hospital
        })

    return JsonResponse(
        {'erro': 'O nome do hospital não pode ser alterado.'},
        status=403
    )

    try:
        dados = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {'erro': 'Dados inválidos.'},
            status=400
        )

    hospital = dados.get('hospital', '').strip()

    if not hospital:
        return JsonResponse(
            {'erro': 'Informe o nome do hospital.'},
            status=400
        )

    configuracao.hospital = hospital
    configuracao.save()

    return JsonResponse({
        'mensagem': 'Configurações atualizadas com sucesso.',
        'hospital': configuracao.hospital
    })


@require_http_methods(["GET", "PUT"])
@login_required
def api_parametros(request):

    if not (eh_admin(request.user) or eh_enfermeiro(request.user)):
        return JsonResponse(
            {'erro': 'Acesso não autorizado.'},
            status=403
        )

    if request.method == 'PUT':

        if not eh_admin(request.user):
            return JsonResponse(
                {'erro': 'Somente o administrador pode alterar os parâmetros.'},
                status=403
            )

        try:
            dados = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'erro': 'Dados inválidos.'},
                status=400
            )

        classificacoes = dados.get('classificacoes', {})

        if not isinstance(classificacoes, dict):
            return JsonResponse(
                {'erro': 'Classificações inválidas.'},
                status=400
            )

        for nivel, valores in classificacoes.items():

            if not isinstance(valores, dict):
                return JsonResponse(
                    {'erro': 'Dados de classificação inválidos.'},
                    status=400
                )

            try:
                classificacao = Classificacao.objects.get(
                    nivel=int(nivel)
                )
            except (Classificacao.DoesNotExist, TypeError, ValueError):
                return JsonResponse(
                    {'erro': 'Classificação não encontrada.'},
                    status=400
                )

            prioridade = valores.get('prioridade')
            espera = valores.get('espera')

            if not isinstance(prioridade, str) or not isinstance(espera, str):
                return JsonResponse(
                    {'erro': 'Prioridade e espera devem ser textos.'},
                    status=400
                )

            if not prioridade.strip() or not espera.strip():
                return JsonResponse(
                    {'erro': 'Preencha todos os campos.'},
                    status=400
                )

            classificacao.prioridade = prioridade.strip()
            classificacao.espera = espera.strip()
            classificacao.save()

        return JsonResponse({
            'mensagem': 'Parâmetros atualizados com sucesso.'
        })

    classificacoes = {}

    for item in Classificacao.objects.all().order_by('nivel'):
        classificacoes[str(item.nivel)] = {
            'nivel': item.nivel,
            'nome': item.nome,
            'cor': item.cor,
            'prioridade': item.prioridade,
            'espera': item.espera
        }

    faixas_etarias = []

    for faixa in FaixaEtaria.objects.all().order_by('idade_minima'):
        faixas_etarias.append({
            'id': faixa.id,
            'nome': faixa.nome,
            'idadeMinima': faixa.idade_minima,
            'idadeMaxima': faixa.idade_maxima
        })

    return JsonResponse({
        'opcoes': OPCOES_PARAMETROS,
        'classificacoes': classificacoes,
        'faixasEtarias': faixas_etarias
    })


@require_http_methods(["GET", "POST"])
@login_required
def api_regras(request):

    if request.method == 'POST':
        return api_criar_regra(request)
    if not eh_admin(request.user):
        return JsonResponse(
            {'erro': 'Somente o administrador pode acessar as regras.'},
            status=403
        )

    regras = Regra.objects.select_related(
        'criado_por',
        'classificacao',
        'faixa_etaria'
    ).order_by('-id')

    resultado = []

    for regra in regras:
        nome_profissional = (
            regra.criado_por.get_full_name()
            or regra.criado_por.username
        )

        resultado.append({
            'id': regra.id,
            'nome': regra.nome,
            'dataCriacao': regra.data_criacao.strftime('%d/%m/%Y'),
            'profissional': nome_profissional,
            'nivel': regra.classificacao.nivel,
            'faixa': regra.faixa_etaria_id,
            'queixas': regra.queixas,
            'estado': regra.estado,
            'sinais': regra.sinais,
            'vitais': regra.vitais
        })

    return JsonResponse(resultado, safe=False)

@require_POST
@login_required
def api_criar_regra(request):

    if not eh_admin(request.user):
        return JsonResponse(
            {'erro': 'Somente o administrador pode criar regras.'},
            status=403
        )

    try:
        dados = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {'erro': 'Dados inválidos.'},
            status=400
        )

    nome = dados.get('nome', '').strip()
    nivel = dados.get('nivel')
    faixa_id = dados.get('faixa')
    queixas = dados.get('queixas', [])
    estado = dados.get('estado', '')
    sinais = dados.get('sinais', [])
    vitais = dados.get('vitais', {})

    if not nome:
        return JsonResponse(
            {'erro': 'Informe o nome do parâmetro.'},
            status=400
        )

    if not isinstance(queixas, list) or not isinstance(sinais, list):
        return JsonResponse(
            {'erro': 'As queixas e os sinais precisam ser listas.'},
            status=400
        )

    if not isinstance(vitais, dict):
        return JsonResponse(
            {'erro': 'Os sinais vitais estão em formato inválido.'},
            status=400
        )

    try:
        classificacao = Classificacao.objects.get(nivel=int(nivel))
    except (Classificacao.DoesNotExist, TypeError, ValueError):
        return JsonResponse(
            {'erro': 'Selecione uma classificação válida.'},
            status=400
        )

    faixa = None

    if faixa_id:
        try:
            faixa = FaixaEtaria.objects.get(id=int(faixa_id))
        except (FaixaEtaria.DoesNotExist, TypeError, ValueError):
            return JsonResponse(
                {'erro': 'Selecione uma faixa etária válida.'},
                status=400
            )

    regra = Regra.objects.create(
        nome=nome,
        criado_por=request.user,
        classificacao=classificacao,
        faixa_etaria=faixa,
        queixas=queixas,
        estado=estado,
        sinais=sinais,
        vitais=vitais
    )

    return JsonResponse({
        'mensagem': 'Parâmetro cadastrado com sucesso.',
        'id': regra.id
    }, status=201)

@require_http_methods(["PUT", "DELETE"])
@login_required
def api_regra(request, id):

    if not eh_admin(request.user):
        return JsonResponse(
            {'erro': 'Somente o administrador pode alterar regras.'},
            status=403
        )

    try:
        regra = Regra.objects.get(id=id)
    except Regra.DoesNotExist:
        return JsonResponse(
            {'erro': 'Parâmetro não encontrado.'},
            status=404
        )

    if request.method == 'DELETE':
        regra.delete()

        return JsonResponse({
            'mensagem': 'Parâmetro excluído com sucesso.'
        })

    try:
        dados = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {'erro': 'Dados inválidos.'},
            status=400
        )

    nome = dados.get('nome', '').strip()
    nivel = dados.get('nivel')
    faixa_id = dados.get('faixa')
    queixas = dados.get('queixas', [])
    estado = dados.get('estado', '')
    sinais = dados.get('sinais', [])
    vitais = dados.get('vitais', {})

    if not nome:
        return JsonResponse(
            {'erro': 'Informe o nome do parâmetro.'},
            status=400
        )

    if not isinstance(queixas, list) or not isinstance(sinais, list):
        return JsonResponse(
            {'erro': 'Queixas e sinais precisam ser listas.'},
            status=400
        )

    if not isinstance(vitais, dict):
        return JsonResponse(
            {'erro': 'Os sinais vitais estão em formato inválido.'},
            status=400
        )

    try:
        classificacao = Classificacao.objects.get(nivel=int(nivel))
    except (Classificacao.DoesNotExist, TypeError, ValueError):
        return JsonResponse(
            {'erro': 'Selecione uma classificação válida.'},
            status=400
        )

    faixa = None

    if faixa_id:
        try:
            faixa = FaixaEtaria.objects.get(id=int(faixa_id))
        except (FaixaEtaria.DoesNotExist, TypeError, ValueError):
            return JsonResponse(
                {'erro': 'Selecione uma faixa etária válida.'},
                status=400
            )

    regra.nome = nome
    regra.classificacao = classificacao
    regra.faixa_etaria = faixa
    regra.queixas = queixas
    regra.estado = estado
    regra.sinais = sinais
    regra.vitais = vitais

    regra.save()

    return JsonResponse({
        'mensagem': 'Parâmetro atualizado com sucesso.'
    })
