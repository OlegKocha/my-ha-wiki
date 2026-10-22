Настройте отправку отчёта о состоянии дома по почте и автоматический запуск при длительной недоступности выбранных интернет-ресурсов.

## Как устроен сценарий

1. Ping проверяет контрольный адрес `8.8.8.8` и несколько сайтов.
2. После 15 минут недоступности контрольного адреса автоматизация сравнивает состояния остальных проверок.
3. Если условия совпали, скрипт отправляет HTML-отчёт. Цикл повторяет отправку **раз в час**, пока контрольный адрес остаётся недоступен.

Совпадение этих условий показывает характер сбоя, но само по себе не доказывает причину ограничения доступа. Для отправки письма SMTP-сервер должен оставаться доступным.

## Шаг 1: Настройка почтового агента (SMTP)

Откройте `configuration.yaml` и добавьте настройки почты. В примере используется SMTP Яндекса.

```YAML
notify:
- name: email_alerts
  platform: smtp
  server: smtp.yandex.ru
  port: 465
  encryption: tls
  username: !secret smtp_username
  password: !secret smtp_password
  sender: !secret smtp_sender
  recipient: !secret smtp_recipient
```

В `secrets.yaml` задайте свои значения `smtp_username`, `smtp_password`, `smtp_sender` и `smtp_recipient`. Используйте пароль приложения, если этого требует почтовый сервис.

Проверьте конфигурацию в **Панели разработчика → YAML** и перезапустите Home Assistant. Для отправки писем будет использоваться `notify.email_alerts`.

## Шаг 2: Создание Ping-сенсоров

Добавьте адреса через **Настройки → Устройства и службы → Добавить интеграцию → Ping (ICMP)**. Проверьте фактические имена созданных объектов: в примере используются следующие.

| Назначение | Адрес | Объект в примере |
|---|---|---|
| Контрольный адрес | `8.8.8.8` | `binary_sensor.8_8_8_8` |
| Дополнительная проверка | `wikipedia.org` | `binary_sensor.wikipedia_org` |
| Дополнительная проверка | `steampowered.com` | `binary_sensor.steampowered_com` |
| Сравнение доступности | `vk.com` | `binary_sensor.vk_com` |
| Сравнение доступности | `rutube.ru` | `binary_sensor.rutube_ru` |
| Сравнение доступности | `dzen.ru` | `binary_sensor.dzen_ru` |
| Сравнение доступности | `gosuslugi.ru` | `binary_sensor.gosuslugi_ru` |

## Шаг 3: Скрипт сборки данных и генерации HTML-отчета

Скрипт собирает показания температуры, ресурсов сервера, ИБП и сетевых проверок. Добавьте его в `scripts.yaml` и замените имена сенсоров на свои.

```yaml
send_house_status_email:
alias: "Отправка отчета о состоянии дома по Email"
sequence:
  - service: notify.email_alerts
    data:
      title: "📋 Отчет о состоянии умного дома (Режим: Белый список)"
      message: "Сработали белые списки. Подробная информация о доме доступна в HTML-версии письма."
      data:
        html: >
          <html>
          <head>
            <style>
              table { font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px; }
               td, th { border: 1px solid #dddddd; text-align: left; padding: 8px; }
               tr:nth-child(even) { background-color: #f9f9f9; }
              th { background-color: #0288D1; color: white; }
              .header { background-color: #f5f5f5; padding: 10px; border-left: 5px solid #0288D1; margin-bottom: 15px; }
               .floor-title { background-color: #E1F5FE; font-weight: bold; text-align: center; color: #0288D1; }
            </style>
           </head>
           <body>
             <div class="header">
               <h2>📊 Сводный отчет системы умного дома</h2>
               <p>Выгрузка сформирована автоматически. Режим сети: <b>Ограниченный (Белые списки)</b>.<br>
               Дата и время сбора: {{ now().strftime('%Y-%m-%d %H:%M:%S') }}</p>
             </div>
             
             <h3>🌡️ Климатические условия</h3>
             <table>
               <tr><th>Параметр / Комната</th><th>Показание</th></tr>
               <tr><td>Комната 1</td><td>{{ states('sensor.room_1_temperature') }} °C</td></tr>
               <tr><td>Комната 2</td><td>{{ states('sensor.room_2_temperature') }} °C</td></tr>
             </table>

            <h3>🖥️ Ресурсы сервера</h3>
            <table>
               <tr><th>Компонент</th><th>Загрузка / Емкость</th></tr>
               <tr><td>Использование процессора (CPU)</td><td>{{ states('sensor.system_monitor_processor_use') }}%</td></tr>
               <tr><td>Занято оперативной памяти (RAM)</td><td>{{ states('sensor.system_monitor_memory_use') | float | round(1) }} %</td></tr>
               <tr><td>Занято памяти на диске (SSD)</td><td>{{ states('sensor.system_monitor_disk_use') | float | round(1) }} GB</td></tr>
             </table>
             
             <h3>🔋 Состояние ИБП ExeGate (NUT)</h3>
             <table>
               <tr><th>Параметр ИБП</th><th>Текущее значение</th></tr>
               <tr><td>Источник питания (Статус)</td><td><b>{{ states('sensor.ups_status') }}</b></td></tr>
               <tr><td>Уровень заряда батареи</td><td>{{ states('sensor.ups_battery_charge') }}%</td></tr>
               <tr><td>Входное напряжение сети</td><td>{{ states('sensor.ups_input_voltage') }} В</td></tr>
             </table>
             
             <h3>🌐 Диагностика сетевых ресурсов (Ping)</h3>
             <table>
               <tr><th>Адрес ресурса</th><th>Тип фильтрации</th><th>Статус доступности</th></tr>
               <tr><td>google.com</td><td>⛔ Черный список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.8_8_8_8', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.8_8_8_8', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>wikipedia.org</td><td>⛔ Черный список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.wikipedia_org', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.wikipedia_org', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>steampowered.com</td><td>⛔ Черный список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.steampowered_com', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.steampowered_com', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>vk.com</td><td>✅ Белый список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.vk_com', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.vk_com', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>rutube.ru</td><td>✅ Белый список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.rutube_ru', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.rutube_ru', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>dzen.ru</td><td>✅ Белый список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.dzen_ru', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.dzen_ru', 'on') else 'Заблокирован' }}</span></td></tr>
               <tr><td>gosuslugi.ru</td><td>✅ Белый список</td><td><span class="{{ 'status-ok' if is_state('binary_sensor.gosuslugi_ru', 'on') else 'status-blocked' }}">{{ 'Доступен' if is_state('binary_sensor.gosuslugi_ru', 'on') else 'Заблокирован' }}</span></td></tr>
             </table>
           </body>
           </html>
```

## Шаг 4: Настройка автоматизации циклического контроля

Откройте **Настройки → Автоматизации и сцены → Создать автоматизацию** и перейдите к редактированию YAML.

```yaml
alias: (Email) Состояние дома при белых списках
description: Проверяет включения белых списков и шлет отчеты на почту раз 1 час
triggers:
 - entity_id:
     - binary_sensor.8_8_8_8
   to:
     - "off"
     - unavailable
    - unknown
  for:
    minutes: 15
   trigger: state
conditions:
 - condition: state
   entity_id: binary_sensor.wikipedia_org
   state:
     - "off"
- condition: state
   entity_id: binary_sensor.steampowered_com
   state:
     - "off"
 - condition: state
   entity_id: binary_sensor.vk_com
   state:
     - "on"
- condition: state
   entity_id: binary_sensor.rutube_ru
   state:
     - "on"
 - condition: state
   entity_id: binary_sensor.dzen_ru
   state:
     - "on"
 - condition: state
   entity_id: binary_sensor.gosuslugi_ru
   state:
     - "on"
actions:
 - repeat:
     while:
       - condition: state
         entity_id: binary_sensor.8_8_8_8
         state:
           - "off"
     sequence:
       - action: script.send_house_status_email
       - delay:
           hours: 1
           minutes: 0
           seconds: 0
           milliseconds: 0
mode: single
```

Интервал между письмами задаётся в `delay`: в примере это **1 час**. Условия внутри `repeat` проверяются перед следующей итерацией.

## Шаг 5: Проверка работоспособности системы

1. В **Панели разработчика → Действия** запустите `script.send_house_status_email`.
2. Проверьте доставку письма и значения датчиков в таблице.
3. При первом срабатывании автоматизации откройте её трассировку и проверьте, какие условия выполнены.
