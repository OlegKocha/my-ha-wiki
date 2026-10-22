## Подключение интеграции

1. Установите Яндекс Интернетметр через HACS.
2. Откройте **Настройки → Устройства и службы → Добавить интеграцию → Яндекс Интернетметр** и настройте интеграцию.

> [!note] Наблюдение о точности
> Пока неясно, действительно ли замеры выполняются каждые 30 минут и насколько точно используемая библиотека определяет скорость. Эти параметры стоит проверить отдельно.

## Карточка скорости интернета

Для графика используется [[mini-graph-card|карточка mini-graph-card]]. Установите её и добавьте следующую конфигурацию:

```YAML
type: custom:mini-graph-card
name: Скорость интернета
entities:
  - entity: sensor.yainternetometr_download
    name: Входящая
    show_state: false
  - entity: sensor.yainternetometr_upload
    name: Исходящая
    show_state: true
    show_graph: true
font_size: 100
hours_to_show: 48
hour24: true
icon: mdi:speedometer
points_per_hour: 0.5
smooth: true
line_width: 3
decimals: 1

```
