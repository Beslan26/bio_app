from collections import defaultdict

from medical_assistant.services.xml_parser import csv_read
from datetime import datetime


def parse_sleep_data(csv_data_name):
    """
    Функция для получения данных о сне:
    :param csv_data_name: название таблицы CSV.
    :return: начало, конец и время сна.
    """

    data = csv_read(csv_data_name)
    result_data = []

    fmt = "%m/%d/%Y %H:%M"

    for row in data:
        start_datetime = datetime.strptime(row['start_datetime'], fmt)
        end_datetime = datetime.strptime(row['end_datetime'], fmt)

        duration = end_datetime - start_datetime
        total_seconds = int(duration.total_seconds())

        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        sleep_duration = f"{hours}:{minutes:02d}"

        result_data.append({
            "start_time": start_datetime,
            "end_time": end_datetime,
            "sleep_duration": sleep_duration
        })

    return result_data


def parse_step_data(csv_data_name):
    '''
    :param csv_data_name: на вход получаем название таблицы csv, чтобы передать в функцию csv_read
                         и получить данные из таблицы для работы с ними.
    :return: на выходе получаем словарь с датами и суммой шагов за день
    '''
    data = csv_read(csv_data_name)

    fmt = "%m/%d/%Y %H:%M"
    steps_dict = {}

    for row in data:
        dt = datetime.strptime(row['creation_datetime'], fmt)
        steps = int(row['value'])
        date = str(dt.date())
        if date in steps_dict:
            steps_dict[date] += steps
        else:
            steps_dict[date] = steps

    return steps_dict


def sum_step_month(csv_data_name):
    '''
    Функция для получения общего кол-ва шагов за месяц.
    :param csv_data_name: название таблицы
    :return: кол-во шагов в каждом месяце за весь период
    '''
    step_data = parse_step_data(csv_data_name)

    steps_sum = defaultdict(int)
    days_count = defaultdict(int)

    for date, steps in step_data.items():
        month = date[:7]
        steps_sum[month] += steps
        days_count[month] += 1

    print(steps_sum)
    print(days_count)

    result = {}
    for month in steps_sum:
        result[month] = {
            "Сумма шагов": steps_sum[month],
            "Кол-во дней": days_count[month],
            "Среднее в день": steps_sum[month] / days_count[month]
        }
    return result


def get_active_data(table_name):
    parse_data = csv_read(table_name)

    fmt = "%m/%d/%Y %H:%M"

    sum_callories = defaultdict(float)

    for row in parse_data:
        day = datetime.strptime(row["creation_datetime"], fmt)
        date = str(day.date())
        cal = float(row["value"])
        sum_callories[date] += cal

    return dict(sum_callories)





