import asyncio
import csv
from sqlalchemy import insert

from medical_assistant.database.session import AsyncSessionLocal
from medical_assistant.models.nutrition.food import FoodProducts


def import_food_data_from_csv() -> list[dict]:
    """Считывает данные из CSV-файла и возвращает список сырых словарей."""
    with open('medical_assistant/food_database_with_gi.csv', 'r', encoding='utf-8-sig') as file:
        csv_reader = csv.DictReader(file)
        return list(csv_reader)


async def db_record(raw_data: list[dict]):
    """Очищает данные, приводит типы под модель и делает массовую запись в БД."""
    prepared_data = []

    for item in raw_data:
        prepared_data.append({
            'category': item['Категория'],
            'name': item['Название продукта'],
            'calories': int(item['Калории (ккал)']),
            'protein': float(item['Белки (г)']),
            'fats': float(item['Жиры (г)']),
            'carbohydrates': float(item['Углеводы (г)']),
            'glycemic_index': int(item['Гликемический индекс (ГИ)']),
        })

    # Открываем асинcontextную сессию и отправляем данные в базу одним пакетом
    async with AsyncSessionLocal() as session:
        statement = insert(FoodProducts).values(prepared_data)
        await session.execute(statement)
        await session.commit()


async def main():
    """Главная управляющая функция."""
    print("Старт импорта...")
    
    # 1. Получаем грязные данные из файла
    data = import_food_data_from_csv()
    
    # 2. Обрабатываем и записываем их в БД
    await db_record(data)
    
    print("Импорт завершен успешно!")


if __name__ == "__main__":
    # Запуск асинхронного цикла событий Python
    asyncio.run(main())

