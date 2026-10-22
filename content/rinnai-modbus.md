> [!note] Перед использованием примеров
> Адреса и имена устройств в примерах условные. Замените их значениями своей системы.


Примеры конфигурации Modbus для чтения параметров котла Rinnai и управления через EctoControl. Настройка подключения оборудования описана в [пошаговой инструкции](rinnai-field.html).

---

# Интеграция котла Rinnai RB-367RMF в Home Assistant (локально, без интернета)

## Цель
Полностью локальное управление и мониторинг котла через Home Assistant:
- Чтение температуры подачи, ГВС, давления, расхода, модуляции, ошибок.
- Управление уставкой температуры отопления и ГВС.
- Включение/выключение контуров отопления и ГВС.
- Сброс ошибок.
- Без облака, без интернета, без зависимости от сторонних сервисов.

---

## Что купить

| № | Наименование | Зачем | Рекомендации |
|---|--------------|-------|--------------|
| 1 | **Адаптер цифровой шины Rinnai EctoControl**<br>Модель: `ES-BRRI-01` | Подключается между котлом и пультом, предоставляет доступ к цифровой шине и выдаёт данные по **RS-485 (Modbus RTU)**. | Совместимость подтверждена для RB-207/257/307/**367RMF**.<br>Цена: ~3 500–4 500 ₽.<br>Где купить: [santech.ru](https://www.santech.ru/catalog/495/506/i1446/), [ectocontrol.ru](https://ectocontrol.ru/heating-control/adapter-rinnai), Ozon. |
| 2 | **Modbus TCP-шлюз: RS-485 → Wi-Fi/Ethernet** | Преобразует Modbus RTU (по RS-485) в Modbus TCP по локальной сети. | **Рекомендуется**: **USR-W610** (~5 700–6 400 ₽)<br>Альтернатива (дешевле, но сложнее): ESP32 + модуль MAX485 (~800 ₽), но требует прошивки. |
| 3 | **Блок питания 12–24 В, 1 А** *(если нет свободных клемм на котле)* | Для питания адаптера EctoControl и, возможно, шлюза USR-W610. | Многие котлы Rinnai имеют свободные клеммы 12–24 В — проверьте. Если есть — блок питания не нужен. |
| 4 | **Провода и клеммы** | Для подключения RS-485 (витая пара рекомендуется), питания и разрыва шины пульта. | Обычные монтажные провода 0.5–0.75 мм², желательно экранированная витая пара для RS-485. |

---

## Пошаговое подключение (без интернета)

### Шаг 1. Подключение EctoControl между котлом и пультом
1. Отключите питание котла (220 В).
2. Найдите 4-жильный кабель от котла к пульту.
3. Разрежьте его (или используйте T-разветвитель).
4. Подключите:
   - Котёл → вход EctoControl (`K+`, `K-`, `GND`, `+12V`)
   - Выход EctoControl → пульт
5. Питание адаптера:
   - Подключите `+12V` и `GND` к клеммам котла **или** к внешнему блоку питания.
6. Убедитесь, что пульт продолжает работать — это означает, что шина не нарушена.

> ⚠️ Адаптер **не заменяет пульт**, а работает в разрыве его шины. Пульт остаётся активным.

### Шаг 2. Подключение к Modbus-шлюзу (USR-W610)
- `A` адаптера → `A` шлюза  
- `B` адаптера → `B` шлюза  
- Общий провод (GND) — по желанию, но рекомендуется.
- Подключите USR-W610 к питанию (8–36 В).

### Шаг 3. Настройка USR-W610
1. Зайдите в веб-интерфейс шлюза (IP из роутера).
2. Установите:
   - **Режим работы**: `TCP Server`
   - **Порт**: `502`
   - **Serial Settings**:
     - Baudrate: **19200**
     - Data bits: **8**
     - Parity: **None**
     - Stop bits: **1**
     - Flow control: **None**
3. Сохраните и перезагрузите.

> ✅ После этого шлюз будет принимать Modbus TCP-запросы и пересылать их по RS-485 к EctoControl.

---

## Настройка Home Assistant

### Шаг 4. Добавление интеграции Modbus
- **Settings → Devices & Services → + Add Integration → Modbus**
- **Type**: `TCP`
- **Host**: `IP-адрес USR-W610` (например, `192.0.2.88`)
- **Port**: `502`
- Нажмите **Submit**

> ⚠️ **Важно**: Slave ID (адрес устройства) по умолчанию — **240** (`0xF0`).

---

## Шаг 5. Конфигурация сенсоров и управления

Добавьте в `configuration.yaml`:

```yaml
modbus:
  - name: rinnai_modbus
    type: tcp
    host: 192.0.2.88  # IP USR-W610
    port: 502

sensor:
  - platform: modbus
    scan_interval: 10
    registers:
      - name: "Rinnai Температура подачи"
        hub: rinnai_modbus
        slave: 240
        register: 24   # 0x0018
        register_type: input
        data_type: int16
        scale: 0.1
        unit_of_measurement: "°C"
        device_class: temperature
        state_class: measurement

      - name: "Rinnai Температура ГВС"
        hub: rinnai_modbus
        slave: 240
        register: 25   # 0x0019
        register_type: input
        data_type: uint16
        scale: 0.1
        unit_of_measurement: "°C"
        device_class: temperature
        state_class: measurement

      - name: "Rinnai Давление"
        hub: rinnai_modbus
        slave: 240
        register: 26   # 0x001A
        register_type: input
        data_type: uint16
        scale: 0.1
        unit_of_measurement: "бар"
        device_class: pressure
        state_class: measurement

      - name: "Rinnai Расход ГВС"
        hub: rinnai_modbus
        slave: 240
        register: 27   # 0x001B
        register_type: input
        data_type: uint16
        scale: 0.1
        unit_of_measurement: "л/мин"
        state_class: measurement

      - name: "Rinnai Модуляция горелки"
        hub: rinnai_modbus
        slave: 240
        register: 28   # 0x001C
        register_type: input
        data_type: uint16
        unit_of_measurement: "%"
        state_class: measurement

      - name: "Rinnai Код ошибки (основной)"
        hub: rinnai_modbus
        slave: 240
        register: 30   # 0x001E
        register_type: input
        data_type: uint16

      - name: "Rinnai Код ошибки (доп.)"
        hub: rinnai_modbus
        slave: 240
        register: 31   # 0x001F
        register_type: input
        data_type: uint16

      - name: "Rinnai Температура уличного датчика"
        hub: rinnai_modbus
        slave: 240
        register: 32   # 0x0020
        register_type: input
        data_type: int16
        unit_of_measurement: "°C"
        device_class: temperature
        state_class: measurement

binary_sensor:
  - platform: modbus
    scan_interval: 5
    inputs:
      - name: "Rinnai Горелка"
        hub: rinnai_modbus
        slave: 240
        address: 29   # 0x001D
        input_type: input
        data_type: uint16
        # Бит 0 — горелка

      - name: "Rinnai Отопление активно"
        hub: rinnai_modbus
        slave: 240
        address: 29
        input_type: input
        data_type: uint16
        # Бит 1 — отопление

      - name: "Rinnai ГВС активна"
        hub: rinnai_modbus
        slave: 240
        address: 29
        input_type: input
        data_type: uint16
        # Бит 2 — ГВС

input_number:
  rinnai_target_temp:
    name: "Rinnai Уставка температуры отопления"
    min: 30
    max: 80
    step: 0.5
    unit_of_measurement: "°C"
    mode: box

  rinnai_dhw_temp:
    name: "Rinnai Уставка температуры ГВС"
    min: 30
    max: 60
    step: 1
    unit_of_measurement: "°C"
    mode: box
```

> 💡 **Примечание**: Для извлечения битов (горелка, отопление, ГВС) из регистра `0x001D` потребуется шаблонный сенсор или автоматизация. Пример ниже.

---

## Управление через автоматизации

### Установка уставки температуры отопления
```yaml
automation:
  - alias: "Установить уставку отопления Rinnai"
    trigger:
      - platform: state
        entity_id: input_number.rinnai_target_temp
    action:
      - service: modbus.write_register
        data:
          hub: rinnai_modbus
          slave: 240
          address: 49   # 0x0031
          value: "{{ (states('input_number.rinnai_target_temp') | float * 10) | int }}"
```

### Установка уставки ГВС
```yaml
automation:
  - alias: "Установить уставку ГВС Rinnai"
    trigger:
      - platform: state
        entity_id: input_number.rinnai_dhw_temp
    action:
      - service: modbus.write_register
        data:
          hub: rinnai_modbus
          slave: 240
          address: 55   # 0x0037
          value: "{{ states('input_number.rinnai_dhw_temp') | int }}"
```

### Включение/выключение контуров
```yaml
# Значение: 3 = отопление + ГВС вкл, 2 = только ГВС, 1 = только отопление, 0 = всё выкл
service: modbus.write_register
data:
  hub: rinnai_modbus
  slave: 240
  address: 57   # 0x0039
  value: 3
```

### Сброс ошибки
```yaml
service: modbus.write_register
data:
  hub: rinnai_modbus
  slave: 240
  address: 128  # 0x0080
  value: 3      # команда "сброс ошибки"
```

> ✅ После сброса можно проверить регистр `0x0081` — значение `0` означает успех.

---

## Lovelace: Пример дашборда

```yaml
type: vertical-stack
title: Котёл Rinnai
cards:
  - type: thermostat
    entity: input_number.rinnai_target_temp
    name: Уставка отопления
    icon: mdi:thermometer

  - type: entities
    entities:
      - entity: input_number.rinnai_dhw_temp
        name: Уставка ГВС
      - entity: binary_sensor.rinnai_gorelka
        name: Горелка
      - entity: binary_sensor.rinnai_otoplenie_aktivno
        name: Отопление
      - entity: binary_sensor.rinnai_gvs_aktivna
        name: ГВС
      - entity: sensor.rinnai_kod_oshibki_osnovnoy
        name: Ошибка

  - type: history-graph
    entities:
      - entity: sensor.rinnai_temperatura_podachi
      - entity: sensor.rinnai_temperatura_gvs
      - entity: sensor.rinnai_modulyatsiya_gorelki
    hours_to_show: 24
    refresh_interval: 60
```

---

## Хранение данных и статистика

Добавьте в `configuration.yaml`:

```yaml
recorder:
  include:
    entities:
      - sensor.rinnai_temperatura_podachi
      - sensor.rinnai_temperatura_gvs
      - sensor.rinnai_davlenie
      - sensor.rinnai_modulyatsiya_gorelki
      - sensor.rinnai_kod_oshibki_osnovnoy
```

Сенсоры уже содержат `device_class` и `state_class`, поэтому:
- Графики будут строиться автоматически.
- Данные попадут в **Energy Dashboard** (если настроите).

---

## Справочная информация из документации EctoControl

| Параметр | Адрес (hex) | Тип | Формат |
|--------|-------------|------|--------|
| Температура подачи | `0x0018` (24) | i16 | ×0.1 °C |
| Температура ГВС | `0x0019` (25) | u16 | ×0.1 °C |
| Давление | `0x001A` (26) | u8 | ×0.1 бар |
| Расход ГВС | `0x001B` (27) | u8 | ×0.1 л/мин |
| Модуляция | `0x001C` (28) | u8 | % |
| Состояние (биты) | `0x001D` (29) | bitfield | бит 0 — горелка, 1 — отопление, 2 — ГВС |
| Ошибка (основная) | `0x001E` (30) | u16 | — |
| Уставка отопления | `0x0031` (49) | int16 | ×0.1 °C |
| Уставка ГВС | `0x0037` (55) | u8 | °C |
| Включение контуров | `0x0039` (57) | bitfield | бит 0 — отопление, 1 — ГВС |
| Команда | `0x0080` (128) | u16 | 3 = сброс ошибки |
| Ответ на команду | `0x0081` (129) | int16 | 0 = успешно |

> 📌 **Скорость обмена**: **19200**, **8N1**  
> 📌 **Slave ID по умолчанию**: **240** (`0xF0`)

---

