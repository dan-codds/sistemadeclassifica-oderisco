from django.contrib import admin
from . import models

admin.site.register(models.Paciente)
admin.site.register(models.Atendimento)
admin.site.register(models.Classificacao)
admin.site.register(models.FaixaEtaria)
admin.site.register(models.Regra)
admin.site.register(models.ConfiguracaoSistema)
