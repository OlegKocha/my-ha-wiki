Параметры подключения MQTT можно посмотреть в файле `/config/.storage/core.config_entries` через терминал Home Assistant.

## Подготовка

Установите и запустите **Advanced SSH & Web Terminal**, затем откройте веб-терминал или подключитесь по SSH.

## Посмотреть запись подключения

Выполните команду:

```bash
cat /config/.storage/core.config_entries | grep -A 10 mqtt | grep password
```

Найдите поле `password` в записи MQTT. Структура записи выглядит так:

```text
"username": "mqtt_user",
"password": "REPLACE_WITH_YOUR_MQTT_PASSWORD",
```

`REPLACE_WITH_YOUR_MQTT_PASSWORD` — обозначение для примера. В своей конфигурации вы увидите сохранённое значение.

## Вывести только пароль

Если остальные параметры не нужны, используйте отдельную команду:

```bash
jq -r '.data.entries[] | select(.domain == "mqtt") | .data.password' /config/.storage/core.config_entries
```
