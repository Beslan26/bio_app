import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

# 1. Загружаем XML
tree = ET.parse("export.xml")
root = tree.getroot()

# 2. Собираем все записи о сне
sleep_records = []
for record in root.findall("Record"):
    if record.attrib.get("type") == "HKQuantityTypeIdentifierStepCount":
        start_str = record.attrib["startDate"]
        end_str = record.attrib["endDate"]

        # Преобразуем строки в datetime
        start = datetime.strptime(start_str.split(" +")[0], "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end_str.split(" +")[0], "%Y-%m-%d %H:%M:%S")

        # Добавляем запись
        sleep_records.append({
            "start": start,
            "end": end,
            "duration_hours": (end - start).total_seconds() / 3600
        })

# 3. Фильтруем последние 30 дней
now = datetime.now()
month_ago = now - timedelta(days=30)
sleep_last_month = [r for r in sleep_records if r["start"] >= month_ago]

# 4. Группируем по датам (чтобы понять, сколько спали в каждую ночь)
from collections import defaultdict

sleep_by_day = defaultdict(float)
for record in sleep_last_month:
    day = record["start"].date()
    sleep_by_day[day] += record["duration_hours"]

# 5. Выводим результат
print("Статистика кол-ва шагов за последние 30 дней:\n")
for day, hours in sorted(sleep_by_day.items()):
    print(f"{day}: {hours:.1f} ч")

# 6. Можно также вывести среднее значение
if sleep_by_day:
    avg_sleep = sum(sleep_by_day.values()) / len(sleep_by_day)
    print(f"\nСреднее кол-во шагов за месяц: {avg_sleep:.1f} ч/ночь")
else:
    print("Нет данных за последние 30 дней.")
