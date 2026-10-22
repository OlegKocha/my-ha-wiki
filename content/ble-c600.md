> [!note] Перед использованием примеров
> Адреса и имена устройств в примерах условные. Замените их значениями своей системы.

Сначала установите [[ble-c600-integration|интеграцию BLE-C600 из HACS]]. На её странице описаны установка и особенности обновления показаний.

## Карточка показателей воды

Карточка объединяет основные показатели воды, дополнительные измерения, температуру и заряд датчика. Ниже показан её внешний вид в Home Assistant, а затем приведена YAML-конфигурация.

![Карточка BLE-C600 с индикаторами состава воды, температуры и заряда](assets/images/ble-c600/dashboard.png "Пример карточки · состав воды, дополнительные показатели, температура и питание")

## Настройка карточки

Замените `sensor.c600_*` в примере на сущности своего устройства.

```YAML
type: vertical-stack
cards:
  - type: grid
    title: Состав воды
    columns: 3
    square: false
    cards:
      - type: gauge
        entity: sensor.c600_ph
        name: Кислотность
        unit: pH
        needle: true
        min: 0
        max: 14
        segments:
          - from: 0
            color: '#C63D32'
          - from: 5
            color: '#EF8C32'
          - from: 6.5
            color: '#5F9E4B'
          - from: 8.51
            color: '#8E6CBB'
      - type: gauge
        entity: sensor.c600_total_dissolved_solids
        name: Минерализация
        unit: ppm
        needle: true
        min: 0
        max: 15000
        segments:
          - from: 0
            color: '#4299D6'
          - from: 100
            color: '#5F9E4B'
          - from: 1000
            color: '#EF8C32'
          - from: 10000
            color: '#C63D32'
      - type: gauge
        entity: sensor.c600_electrical_conductivity
        name: Проводимость
        unit: µS/cm
        needle: true
        min: 0
        max: 2000
        segments:
          - from: 0
            color: '#8E6CBB'
          - from: 10
            color: '#F0C34D'
          - from: 200
            color: '#5F9E4B'
          - from: 801
            color: '#EF8C32'
  - type: grid
    title: Дополнительные показатели
    columns: 3
    square: false
    cards:
      - type: gauge
        entity: sensor.c600_free_chlorine
        name: Свободный хлор
        unit: ppm
        needle: true
        min: 0
        max: 6
        segments:
          - from: 0
            color: '#4299D6'
          - from: 0.2
            color: '#388E3C'
          - from: 1.1
            color: '#F0AD3D'
          - from: 5.1
            color: '#C63D32'
      - type: gauge
        entity: sensor.c600_oxidation_reduction_potential
        name: ОВП · ORP
        unit: mV
        needle: true
        min: -1000
        max: 1000
        segments:
          - from: -1000
            color: '#8E6CBB'
          - from: -200
            color: '#4299D6'
          - from: -50
            color: '#9E9E9E'
          - from: 0
            color: '#5F9E4B'
          - from: 150
            color: '#F0C34D'
          - from: 400
            color: '#EF8C32'
          - from: 650
            color: '#C63D32'
      - type: gauge
        entity: sensor.c600_salt
        name: Соль
        needle: true
        min: 0
        max: 1500
        segments:
          - from: 0
            color: '#4299D6'
          - from: 50
            color: '#8E6CBB'
          - from: 150
            color: '#5F9E4B'
          - from: 300
            color: '#F0C34D'
          - from: 600
            color: '#EF8C32'
          - from: 1000
            color: '#C63D32'
  - type: grid
    title: Температура и питание
    columns: 2
    square: false
    cards:
      - type: gauge
        entity: sensor.c600_temperature
        name: Температура воды
        needle: true
        min: 0
        max: 40
        segments:
          - from: 0
            color: '#4299D6'
          - from: 15
            color: '#8E6CBB'
          - from: 25
            color: '#F0AD3D'
      - type: gauge
        entity: sensor.c600_battery
        name: Заряд C600
        needle: true
        min: 0
        max: 100
        segments:
          - from: 0
            color: '#C63D32'
          - from: 20
            color: '#F0AD3D'
          - from: 50
            color: '#5F9E4B'

```
