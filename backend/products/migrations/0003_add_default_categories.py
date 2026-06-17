from django.db import migrations


def create_default_categories(apps, schema_editor):
    Category = apps.get_model('products', 'Category')
    defaults = [
        ('Bluze', 'bluze'),
        ('Pantaloni', 'pantaloni'),
        ('Pantofi', 'pantofi'),
        ('Accesorii', 'accesorii'),
        ('Altele', 'altele'),
    ]
    for name, slug in defaults:
        Category.objects.get_or_create(slug=slug, defaults={'name': name})


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, reverse_code=migrations.RunPython.noop),
    ]
