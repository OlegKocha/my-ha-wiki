Speedtest RT.RU измеряет скорость подключения. Карточки ниже показывают текущие значения и историю за семь дней.

## Установка и интервал проверки

1. Установите интеграцию через HACS.
2. Откройте **Настройки → Устройства и службы → Добавить интеграцию → Speedtest RT.RU**.
3. Укажите интервал измерения. В исходной настройке использовались **1800 секунд — 30 минут**.

## Текущие значения

Добавьте карточку с ручной настройкой. Имена сенсоров в примерах замените на свои.

```YAML
type: entities
entities:
  - entity: sensor.upload
  - entity: sensor.download
  - entity: sensor.jitter
  - entity: sensor.isp
  - entity: sensor.server
```

## Скорость загрузки и отдачи

График показывает средние значения по часам за последние семь дней.

```YAML
chart_type: line
period: hour
type: statistics-graph
entities:
  - sensor.download
  - sensor.upload
stat_types:
  - mean
title: Internet (hour)
days_to_show: 7
```

## Задержка и джиттер

Отдельная карточка помогает сравнить изменение Ping и Jitter за тот же период.

```YAML
chart_type: line
period: hour
type: statistics-graph
entities:
  - sensor.ping
  - sensor.jitter
stat_types:
  - mean
title: Ping/Jitter
days_to_show: 7
```
