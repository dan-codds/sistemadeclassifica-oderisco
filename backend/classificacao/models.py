from django.db import models
from django.conf import settings


class Paciente(models.Model):
    SEXO_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Feminino', 'Feminino'),
        ('Outro', 'Outro'),
    ]

    nome = models.CharField(max_length=150)
    prontuario = models.CharField(max_length=30, unique=True)
    responsavel = models.CharField(max_length=150)
    sexo = models.CharField(max_length=100)
    def __str__(self):
        return self.nome


class Atendimento(models.Model):
    paciente = models.ForeignKey(
        Paciente,
        on_delete=models.PROTECT,
        related_name='atendimentos'
    )

    enfermeiro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='atendimentos'
    )

    data_hora = models.DateTimeField(auto_now_add=True)

    idade = models.PositiveSmallIntegerField()
    peso = models.DecimalField(max_digits=5, decimal_places=2)

    queixas = models.JSONField(default=list)
    estado_geral = models.JSONField(default=list)
    sinais_clinicos = models.JSONField(default=list)
    outros_descricao = models.TextField(blank=True)

    temperatura = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    frequencia_cardiaca = models.PositiveSmallIntegerField(null=True, blank=True)
    frequencia_respiratoria = models.PositiveSmallIntegerField(null=True, blank=True)
    saturacao = models.PositiveSmallIntegerField(null=True, blank=True)
    pressao_sistolica = models.PositiveSmallIntegerField(null=True, blank=True)
    pressao_diastolica = models.PositiveSmallIntegerField(null=True, blank=True)

    classificacao = models.CharField(max_length=50, blank=True)
    nivel = models.PositiveSmallIntegerField(null=True, blank=True)
    cor = models.CharField(max_length=30, blank=True)
    prioridade = models.CharField(max_length=50, blank=True)
    tempo_espera = models.CharField(max_length=50, blank=True)
    faixa_etaria = models.CharField(max_length=50, blank=True)
    fatores = models.JSONField(default=list)

    def __str__(self):
        return f'{self.paciente.nome} - {self.data_hora:%d/%m/%Y %H:%M}'


class Classificacao(models.Model):
    nivel = models.PositiveSmallIntegerField(unique=True)
    nome = models.CharField(max_length=50)
    cor = models.CharField(max_length=30)
    prioridade = models.CharField(max_length=50)
    espera = models.CharField(max_length=50)

    def __str__(self):
        return self.nome


class FaixaEtaria(models.Model):
    nome = models.CharField(max_length=80)
    idade_minima = models.PositiveSmallIntegerField()
    idade_maxima = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        return self.nome


class Regra(models.Model):
    nome = models.CharField(max_length=150)

    data_criacao = models.DateField(auto_now_add=True)

    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='regras_criadas'
    )

    classificacao = models.ForeignKey(
        Classificacao,
        on_delete=models.PROTECT,
        related_name='regras'
    )

    faixa_etaria = models.ForeignKey(
        FaixaEtaria,
        on_delete=models.PROTECT,
        related_name='regras',
        null=True,
        blank=True
    )

    queixas = models.JSONField(default=list)
    estado = models.CharField(max_length=50, blank=True)
    sinais = models.JSONField(default=list)
    vitais = models.JSONField(default=dict)

    ativa = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class ConfiguracaoSistema(models.Model):
    hospital = models.CharField(max_length=150)

    def __str__(self):
        return self.hospital
