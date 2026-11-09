# Трекер МКС

Для запуска нужен Docker с Docker Compose.
В Docker Desktop должен быть выбран режим Linux-контейнеров.

Из корня:

```bash
docker compose up --build -d
```

Приложение: http://localhost:8080.

Настройки по умолчанию уже заданы. При необходимости скопировать
`.env.example` в `.env` и изменить значения перед первым запуском.

Для остановки:

```bash
docker compose down
```
