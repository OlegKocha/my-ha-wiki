[mini-graph-card](https://github.com/kalkih/mini-graph-card) строит компактные графики показаний сенсоров. Здесь собраны примеры для отдельной комнаты и средних значений по дому.

## Карточки для температуры комнаты

### Необязательно: выделение ночного времени

1. Добавьте интеграцию **Солнце** через **Настройки → Устройства и службы**.
2. Откройте **Вспомогательные объекты → Создать → Template → Сенсор**.
3. Назовите сенсор `nightstate` и задайте шаблон состояния: `{% if is_state('sun.sun', 'below_horizon') %}1{% else %}0{% endif %}`.
4. Свяжите сенсор с устройством **Sun** и сохраните.

### Добавление карточки

На панели добавьте карточку с ручной настройкой. Укажите свои сенсоры температуры, влажности и ночного времени.

```YAML
type: custom:mini-graph-card
name: Комната
entities:
  - entity: sensor.temperature
    name: Температура # имя при наведение на график
    show_state: false
  - entity: sensor.humidity
    name: Влажность
    show_state: true
    show_graph: false # не показывать график
  - color: gray
    entity: sensor.nightstate # вспомогательный объект для фонового отображения ночи на графике
    name: Night
    show_legend: false
    show_line: false
    show_points: false
    y_axis: secondary # альтернативная ось y
color_thresholds: # цвет графика в зависимости от их значения
  - value: 24
    color: "#eb4d54"
  - value: 21
    color: "#6aa84f"
  - value: 18
    color: "#3a8df7"
font_size: 100
hours_to_show: 48 # показывать на график только 48 сколько часов
hour24: true
icon: mdi:thermometer # значок
points_per_hour: 0.5
smooth: true
line_width: 3 # толщина линии
decimals: 1 # показывать после запятой только одно значение, то есть если будет 27.45, то будет показывать только 27.4
show:
  extrema: true # показывать max и min
  fill: fade
  icon_adaptive_color: true
```

## Карточки для средней температуры/влажности в доме

### Подготовка средних значений

1. Откройте **Настройки → Устройства и службы → Вспомогательные объекты → Создать**.
2. Выберите **Объединение состояний сенсоров** и задайте название, например «Средняя температура».
3. Выберите датчики температуры и характеристику **Среднее арифметическое**. Укажите нужное округление.
4. При необходимости создайте такой же объект для влажности.

### Добавление карточки

Вставьте YAML в ручную настройку карточки и замените имена объектов на созданные выше.

```YAML
type: custom:mini-graph-card
name: Средняя температура / влажность в доме
align_state: center
entities:
  - entity: sensor.sredniaia_temperatura_v_dome
  - entity: sensor.sredniaia_vlazhnost_v_dome
    name: Влажность
    show_state: true
    show_graph: false
color_thresholds:
  - value: 23
    color: "#eb4d54"
  - value: 20
    color: "#6aa84f"
  - value: 18
    color: "#3a8df7"
hours_to_show: 336
font_size: 140
group_by: date
icon: mdi:thermometer
hour24: true
line_width: 2
```
