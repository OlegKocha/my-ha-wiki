Подключите камеру по ONVIF и выведите изображение на панель Home Assistant.

## Подключение камеры

1. Добавьте интеграцию **ONVIF**.
2. Укажите локальный адрес камеры и её учётные данные.
3. Найдите созданный объект камеры: он потребуется для карточки.

## Карточка видеопотока

Замените `camera.example_mainstream` на объект своей камеры.

```yaml
show_state: false
show_name: false
camera_view: live
fit_mode: cover
type: picture-entity
entity: camera.example_mainstream
camera_image: camera.example_mainstream
name: name
```

[Обсуждение подключения камер TP-Link](https://community.tp-link.com/en/smart-home/forum/topic/265532).
