from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('classificacao', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='paciente',
            name='sexo',
            field=models.CharField(max_length=100),
        ),
    ]
