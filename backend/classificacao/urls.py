from django.urls import path
from . import views

urlpatterns = [
    path('', views.inicio, name='inicio'),

    # autenticação
    path('api/login', views.api_login, name='api_login'),
    path('api/sessao', views.api_sessao, name='api_sessao'),
    path('api/logout', views.api_logout, name='api_logout'),

    # gerenciamento de usuarios
    path('api/usuarios', views.api_usuarios, name='api_usuarios'),
    path('api/usuarios/<int:id>', views.api_usuario, name='api_usuario'),
    path('api/atendimentos', views.api_atendimentos, name='api_atendimentos'),
    path('api/config', views.api_config, name='api_config'),
    path('api/parametros', views.api_parametros, name='api_parametros'),
    path('api/regras', views.api_regras, name='api_regras'),
    path('api/regras/<int:id>', views.api_regra, name='api_regra'),

    # paginas
    path('cadastro/', views.cadastro, name='cadastro'),
    path('configuracoes/', views.configuracoes, name='configuracoes'),
    path('historico/', views.historico, name='historico'),
    path('administrador/', views.administrador, name='administrador'),
    path('parametros/', views.parametros, name='parametros'),
    path('sem-usuario/', views.sem_usuario, name='sem_usuario'),
]