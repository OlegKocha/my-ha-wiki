Настройка периодических измерений скорости и трёх графиков: загрузка, отдача и задержка.

## Сделать обновление раз в час

Сначала откройте **Настройки → Устройства и службы → Cloudflare Speed Test → Настроить** и проверьте интервал. Если уже указано **60 минут**, отдельная автоматизация для ежечасного запуска не нужна.

Если требуется запуск через автоматизацию:

1. Откройте **Настройки → Автоматизации → Создать автоматизацию**.
2. Добавьте триггер **Время и место → Временной цикл**. В поле часов укажите `/1`.
3. Добавьте действие **Home Assistant Core Integration: Обновить объект** и выберите объект обновления Cloudflare.

## Дашборды со статистикой

Откройте панель в режиме редактирования и добавьте карточки с ручной настройкой. Проверьте имена объектов перед сохранением.

### Скорость загрузки

```YAML
chart_type: line
period: day
type: statistics-graph
entities:
  - sensor.cloudflare_speed_test_90th_percentile_down
  - sensor.cloudflare_speed_test_25mb_down
  - sensor.cloudflare_speed_test_10mb_down
  - sensor.cloudflare_speed_test_1mb_down
  - sensor.cloudflare_speed_test_100kb_down
stat_types:
  - max
title: Download speed
```

### Скорость отдачи

```YAML
chart_type: line
period: day
type: statistics-graph
entities:
  - sensor.cloudflare_speed_test_90th_percentile_up
  - sensor.cloudflare_speed_test_10mb_up
  - sensor.cloudflare_speed_test_1mb_up
  - sensor.cloudflare_speed_test_100kb_up
stat_types:
  - max
title: Upload speed
```

### Задержка

```YAML
chart_type: line
period: day
type: statistics-graph
entities:
  - sensor.cloudflare_speed_test_latency
  - sensor.cloudflare_speed_test_jitter
stat_types:
  - min
title: Ping
```
