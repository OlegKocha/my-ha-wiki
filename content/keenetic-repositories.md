Для роутеров Keenetic в HACS есть несколько интеграций. В этой базе знаний примеры дополнительных сенсоров построены на Keenetic API.

## Репозитории

- [akinin/ha_keenetic](https://github.com/akinin/ha_keenetic).
- [malinovsku/ha-keenetic_api](https://github.com/malinovsku/ha-keenetic_api) — вариант с прямыми запросами к API роутера.

## Интеграция с HA

1. Откройте **HACS → меню ⋮ → Пользовательские репозитории**.
2. Добавьте [репозиторий Keenetic API](https://github.com/malinovsku/ha-keenetic_api), выбрав тип **Интеграция**.
3. Установите **Keenetic API** и перезапустите Home Assistant.
4. Откройте **Настройки → Устройства и службы → Добавить интеграцию → Keenetic API**. Укажите адрес роутера, логин и пароль.

## Работа с API Keenetic

Веб-интерфейс запросов доступен на роутере по пути `/webcli/rest`. Например: `https://192.0.2.1/webcli/rest`. Замените адрес на адрес своего роутера. Для чтения данных в примерах используется метод **GET**.

### Подготовьте идентификатор интеграции

1. Откройте **Панель разработчика → Действия** и выберите `keenetic_api.request_api`.
2. В поле **entry_id** выберите запись своей интеграции Keenetic API.
3. Переключитесь в YAML и скопируйте полученное значение `entry_id` в примеры ниже вместо `id_вашего_роутера_из_пункта_1`.

> [!note] entry_id и device_id — разные значения
> `entry_id` относится к записи интеграции. Идентификатор из адреса страницы `/config/devices/device/…` — это `device_id`; его нельзя подставлять в поле `entry_id`. [Параметры действия](https://github.com/malinovsku/ha-keenetic_api#-использование-сервисов) описаны в документации интеграции.

## Вывести LTE Bands

В этом примере шаблонные сенсоры запрашивают RSSI, CINR, RSRP и RSRQ через `keenetic_api.request_api` каждые 30 секунд. Путь `UsbQmi0` должен соответствовать интерфейсу LTE-модема на вашем роутере.

Добавьте блок в `configuration.yaml`. Если раздел `template:` уже существует, объедините настройки в нём.

```YAML
   ############## Keenetic Hero 4G+ API ##############

template:
  - trigger:
      - platform: time_pattern
        seconds: "/30" # запрашивать информаци из роутера каждые 30 секунд
    action:
      # RSSI
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rssi
        response_variable: r_rssi
      # CINR (тоже самое что SINR)
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/cinr
        response_variable: r_cinr
      # RSRP
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rsrp
        response_variable: r_rsrp
      # RSRQ
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rsrq
        response_variable: r_rsrq
    sensor:
      # RSSI
      - name: "Keenetic RSSI"
        unique_id: "keenetic_hero_rssi"
        state: >
          {{ (r_rssi.response | default('')) | int(-99) }}
        availability: "{{ r_rssi.response is defined and r_rssi.response != '' }}"
        unit_of_measurement: "dBm"
        state_class: measurement
        device_class: signal_strength
        icon: mdi:signal
      # CINR (тоже самое что SINR)
      - name: "Keenetic CINR"
        unique_id: "keenetic_hero_cinr"
        state: >
          {{ (r_cinr.response | default('')) | int(-99) }}
        availability: "{{ r_cinr.response is defined and r_cinr.response != '' }}"
        unit_of_measurement: "dB"
        state_class: measurement
        icon: mdi:signal-distance-variant
      # RSRP
      - name: "Keenetic RSRP"
        unique_id: "keenetic_hero_rsrp"
        state: >
          {{ (r_rsrp.response | default('')) | int(-99) }}
        availability: "{{ r_rsrp.response is defined and r_rsrp.response != '' }}"
        unit_of_measurement: "dBm"
        state_class: measurement
        icon: mdi:signal-cellular-1
      # RSRQ
      - name: "Keenetic RSRQ"
        unique_id: "keenetic_hero_rsrq"
        state: >
          {{ (r_rsrq.response | default('')) | int(-99) }}
        availability: "{{ r_rsrq.response is defined and r_rsrq.response != '' }}"
        unit_of_measurement: "dB"
        state_class: measurement
        icon: mdi:signal-cellular-2
```

## Активные диапазоны

Следующий блок получает информацию об активных LTE-диапазонах. Используйте тот же идентификатор интеграции и проверьте имя интерфейса.

```YAML
template:
  - trigger:
      - platform: time_pattern
        seconds: "/30"
    action:
      # Carrier Bands (НОВЫЙ)
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/carrier
        response_variable: r_carrier
    sensor:
      # Carrier Bands
      - name: "Keenetic Carrier Bands"
        unique_id: "keenetic_hero_carrier_bands"
        state: >
          {%- set ns = namespace(bands=[]) %}
          {%- set carriers = r_carrier.response | default({}) %}
          {%- for carrier_id, carrier_data in carriers.items() %}
            {%- set ns.bands = ns.bands + ['B' ~ carrier_data.band ~ '@' ~ carrier_data.bandwidth ~ ' МГц'] %}
          {%- endfor %}
          {{ ns.bands | join(' + ') if ns.bands else 'Нет данных' }}
        availability: "{{ r_carrier.response is defined }}"
        icon: mdi:sim
        device_class: enum
        attributes:
          raw_json: "{{ r_carrier.response | tojson }}"
          carriers_count: "{{ (r_carrier.response | default({}) | length) }}"
```

## Итоговый результат (просто скопировать)

Здесь оба примера объединены в одну конфигурацию. Выберите **этот вариант или отдельные блоки выше**, чтобы не создавать одинаковые сенсоры дважды.

```YAML
############## Keenetic Hero 4G+ API ##############

template:
  - trigger:
      - platform: time_pattern
        seconds: "/30"
    action:
      # RSSI
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rssi
        response_variable: r_rssi
      # CINR (тоже самое что SINR)
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/cinr
        response_variable: r_cinr
      # RSRP
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rsrp
        response_variable: r_rsrp
      # RSRQ
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/rsrq
        response_variable: r_rsrq
      # Carrier Bands (НОВЫЙ)
      - service: keenetic_api.request_api
        data:
          entry_id: id_вашего_роутера_из_пункта_1
          method: GET
          endpoint: /rci/show/interface/UsbQmi0/carrier
        response_variable: r_carrier
    sensor:
      # RSSI
      - name: "Keenetic RSSI"
        unique_id: "keenetic_hero_rssi"
        state: >
          {{ (r_rssi.response | default('')) | int(-99) }}
        availability: "{{ r_rssi.response is defined and r_rssi.response != '' }}"
        unit_of_measurement: "dBm"
        state_class: measurement
        device_class: signal_strength
        icon: mdi:signal
      # CINR (тоже самое что SINR)
      - name: "Keenetic CINR"
        unique_id: "keenetic_hero_cinr"
        state: >
          {{ (r_cinr.response | default('')) | int(-99) }}
        availability: "{{ r_cinr.response is defined and r_cinr.response != '' }}"
        unit_of_measurement: "dB"
        state_class: measurement
        icon: mdi:signal-distance-variant
      # RSRP
      - name: "Keenetic RSRP"
        unique_id: "keenetic_hero_rsrp"
        state: >
          {{ (r_rsrp.response | default('')) | int(-99) }}
        availability: "{{ r_rsrp.response is defined and r_rsrp.response != '' }}"
        unit_of_measurement: "dBm"
        state_class: measurement
        icon: mdi:signal-cellular-1
      # RSRQ
      - name: "Keenetic RSRQ"
        unique_id: "keenetic_hero_rsrq"
        state: >
          {{ (r_rsrq.response | default('')) | int(-99) }}
        availability: "{{ r_rsrq.response is defined and r_rsrq.response != '' }}"
        unit_of_measurement: "dB"
        state_class: measurement
        icon: mdi:signal-cellular-2
      # Carrier Bands
      - name: "Keenetic Carrier Bands"
        unique_id: "keenetic_hero_carrier_bands"
        state: >
          {%- set ns = namespace(bands=[]) %}
          {%- set carriers = r_carrier.response | default({}) %}
          {%- for carrier_id, carrier_data in carriers.items() %}
            {%- set ns.bands = ns.bands + ['B' ~ carrier_data.band ~ '@' ~ carrier_data.bandwidth ~ ' МГц'] %}
          {%- endfor %}
          {{ ns.bands | join(' + ') if ns.bands else 'Нет данных' }}
        availability: "{{ r_carrier.response is defined }}"
        icon: mdi:sim
        device_class: enum
        attributes:
          raw_json: "{{ r_carrier.response | tojson }}"
          carriers_count: "{{ (r_carrier.response | default({}) | length) }}"
```

## Проверка результата

Проверьте конфигурацию в Home Assistant и примените изменения. Затем найдите созданные сенсоры в **Панели разработчика → Состояния**. Если данные недоступны, проверьте `entry_id`, имя интерфейса и ответ на запрос в `/webcli/rest`.
