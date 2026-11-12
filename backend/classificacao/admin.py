from django.contrib import admin
from .models import (
    Paciente,
    Atendimento,
    Classificacao,
    FaixaEtaria,
    Regra,
    ConfiguracaoSistema
)

admin.site.register(Paciente)
admin.site.register(Atendimento)
admin.site.register(Classificacao)
admin.site.register(FaixaEtaria)
admin.site.register(Regra)
admin.site.register(ConfiguracaoSistema)
print("ADMIN.PY DA CLASSIFICACAO FOI CARREGADO")
