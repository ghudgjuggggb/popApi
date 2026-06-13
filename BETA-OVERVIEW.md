# 🚀 popApi v1.0.0-beta - Полное руководство

**Версия 1.0.0-beta** - это полная переработка popApi для использования с AI, программами и скриптами БЕЗ веб-интерфейса!

---

## 🎯 Что это?

popApi v1.0.0-beta - это **универсальный инструмент для загрузки файлов на GitHub**, который работает:

- 🌐 **Через веб-интерфейс** (как раньше)
- 💻 **Через командную строку** с переменными окружения
- 📚 **Как SDK/библиотека** в вашем коде
- 🔌 **Как REST API** для любых приложений
- 🤖 **С AI системами** (ChatGPT, Claude, Gemini и т.д.)
- ⚙️ **В скриптах** (Bash, Python, Go и т.д.)

---

## ✨ Главные особенности v1.0.0-beta

### 1. Переменные окружения
```bash
export GITHUB_TOKEN=ghp_...
export GITHUB_USERNAME=john
export GITHUB_REPO=my-repo

popapi push ./files
```

### 2. SDK для Node.js
```javascript
const PopApiSDK = require('popapi-sdk');
const api = new PopApiSDK({ token, username });
await api.upload('./files', 'my-repo');
```

### 3. REST API
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@file.txt" \
  -F "repo=my-repo"
```

### 4. Webhook notifications
```bash
curl -X POST http://localhost:3000/api/webhooks \
  -d '{"url":"https://..."}'
```

### 5. AI integration
```python
# ChatGPT, Claude, Gemini могут загружать файлы
ai.call_tool("upload_to_github", directory="./", repo="repo")
```

---

## 📂 Новые файлы в v1.0.0-beta

### Core файлы

| Файл | Описание | Размер |
|------|---------|--------|
| **popapi-sdk.js** | Node.js SDK для встраивания | 8 KB |
| **cli-new.js** | Улучшенный CLI с env vars | 6 KB |
| **server-extended.js** | Расширенный сервер с webhooks | 15 KB |
| **webhook-system.js** | Система уведомлений | 4 KB |

### Документация

| Файл | Назначение |
|------|-----------|
| **API-FOR-AI-AND-SCRIPTS.md** | Полный гайд для AI/программ |
| **EXAMPLES-ALL-LANGUAGES.md** | Примеры на 10+ языках |
| **AI-INTEGRATION-GUIDE.md** | Интеграция с ChatGPT, Claude и т.д. |

---

## 🎓 Использование - Быстрый старт

### Способ 1: Через переменные окружения (САМЫЙ ПРОСТОЙ)

```bash
# 1. Установка переменных
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export GITHUB_USERNAME="your-username"
export GITHUB_REPO="your-repo"

# 2. Загрузка
popapi push ./my-files

# 3. Получить JSON результат
JSON_OUTPUT=1 popapi push ./files | jq .
```

**Идеально для:**
- 🤖 AI систем
- 📝 Скриптов
- 🐳 Docker контейнеров
- 🔄 CI/CD пайплайнов

### Способ 2: SDK в коде

```javascript
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

api.upload('./dist', 'my-repo', 'main', (progress) => {
  console.log(`${progress.current}/${progress.total}`);
}).then(results => {
  console.log(`✅ ${results.successful} uploaded`);
});
```

**Идеально для:**
- 📦 Node.js приложений
- 🚀 Сборочных скриптов
- 🔗 Интеграций

### Способ 3: REST API

```bash
# Запустить сервер
npm start

# Конфигурация
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"token":"ghp_...","username":"john"}'

# Загрузка
curl -X POST http://localhost:3000/api/upload \
  -F "files=@file.txt" \
  -F "repo=my-repo"

# История
curl http://localhost:3000/api/history
```

**Идеально для:**
- 🌐 Веб-приложений
- 🔌 Микросервисов
- 🤖 Любых HTTP клиентов

### Способ 4: AI системы

```python
# ChatGPT (Function Calling)
response = client.chat.completions.create(
    model="gpt-4",
    messages=[...],
    tools=[{
        "type": "function",
        "function": {
            "name": "upload_to_github",
            "description": "Upload files",
            ...
        }
    }]
)
```

```python
# Claude (Tool Use)
response = client.messages.create(
    model="claude-3-5-sonnet",
    messages=[...],
    tools=[{
        "name": "upload_to_github",
        "description": "Upload files",
        ...
    }]
)
```

```python
# Gemini (Function Calling)
model = genai.GenerativeModel('gemini-2.0-flash', tools=tools)
response = model.generate_content(prompt)
```

**Идеально для:**
- 🤖 AI генерирующих код
- 🧠 LLM приложений
- 🎯 Автоматизации

---

## 📚 Примеры для разных языков

### JavaScript/Node.js
```javascript
const PopApiSDK = require('popapi-sdk');
const api = new PopApiSDK({ token, username });
await api.upload('./dist', 'repo');
```

### Python
```python
import subprocess
result = subprocess.run(['popapi', 'push', './files', 'repo'])
```

### Go
```go
cmd := exec.Command("popapi", "push", "./files", "repo")
cmd.Run()
```

### Bash/Shell
```bash
popapi push ./files my-repo main
```

### PHP
```php
$client = new PopApiClient();
$client->uploadDirectory('./dist', 'my-repo');
```

### Java, Rust, Perl - смотрите **EXAMPLES-ALL-LANGUAGES.md**

---

## 🔐 Безопасность

### Хранение токена

```
~/.popapi/config.json  ← Локально на вашем компьютере
    ↓
    ├─ НЕ отправляется на серверы
    ├─ НЕ логируется
    ├─ НЕ коммитится в Git (.gitignore)
    └─ ✅ В безопасности
```

### Лучшие практики

1. **Используйте переменные окружения для AI:**
```bash
export GITHUB_TOKEN="$SECRET_TOKEN"  # Из vault/secrets
popapi push ./files my-repo
```

2. **Ограничьте права токена:**
   - Используйте scope `repo`
   - Создавайте отдельные токены для разных целей
   - Меняйте каждые 3 месяца

3. **Мониторьте логи:**
   - Проверяйте https://github.com/settings/security-log
   - Удаляйте скомпрометированные токены

---

## 📊 API Endpoints

### Конфигурация
- `GET /api/config` - Получить конфигурацию
- `POST /api/config` - Сохранить конфигурацию  
- `DELETE /api/config` - Удалить конфигурацию

### Загрузка
- `POST /api/upload` - Загрузить файлы
- `GET /api/status` - Статус сервера

### История
- `GET /api/history` - История загрузок
- `GET /api/history/:id` - Одна запись

### Webhooks
- `GET /api/webhooks` - Список webhooks
- `POST /api/webhooks` - Добавить webhook
- `DELETE /api/webhooks/:id` - Удалить webhook

---

## 🔔 Webhook события

### Успешная загрузка
```json
{
  "event": "upload.success",
  "repo": "my-repo",
  "branch": "main",
  "filesCount": 5,
  "successful": 5,
  "failed": 0,
  "timestamp": "2024-06-12T10:30:00Z"
}
```

### Ошибка при загрузке
```json
{
  "event": "upload.error",
  "repo": "my-repo",
  "error": "Repository not found",
  "timestamp": "2024-06-12T10:30:00Z"
}
```

---

## 🎯 Сценарии использования

### Сценарий 1: AI генерирует и сохраняет код

```
ChatGPT пишет JavaScript → Сохраняет в ./generated/
    ↓
Вызывает upload_to_github('./generated', 'ai-code-repo')
    ↓
popApi загружает на GitHub
    ↓
Файлы доступны в репозитории
```

### Сценарий 2: CI/CD pipeline

```
Git push → GitHub Actions
    ↓
Собирает проект (npm build)
    ↓
Экспортирует GITHUB_TOKEN
    ↓
Запускает: popapi push ./dist artifacts-repo
    ↓
Артефакты на GitHub
```

### Сценарий 3: Бэкап данных

```
Cronjob каждый день
    ↓
Запускает: popapi push /var/data backups-repo
    ↓
Данные синхронизируются на GitHub
```

### Сценарий 4: LLM обучение

```
AI обучает модель
    ↓
Сохраняет чекпоинты в ./checkpoints/
    ↓
Загружает через popApi на ml-repo
    ↓
Версионирование в Git
```

---

## 📈 Производительность

### Оптимизация

```bash
# Загрузка по частям
popapi push ./part1 repo & 
popapi push ./part2 repo &
wait

# Используйте branch для параллелизма
popapi push ./build repo main &
popapi push ./docs repo docs &
wait
```

### Монитор

```bash
# Отслеживайте историю
curl http://localhost:3000/api/history | jq '.[-5:]'

# Статистика
curl http://localhost:3000/api/status | jq '.uptime'
```

---

## 🚀 Развертывание

### Локально
```bash
npm install
npm start
# http://localhost:3000
```

### Docker
```bash
docker-compose up -d
# http://localhost:3000
```

### На сервере (PM2)
```bash
npm install -g pm2
pm2 start server.js --name popapi
pm2 save
pm2 startup
```

---

## 📚 Документация по категориям

### 🔤 Для разных языков
👉 **EXAMPLES-ALL-LANGUAGES.md**
- JavaScript/Node.js
- Python
- Go
- Bash/Shell
- PHP
- Java
- Rust
- И еще 5+ языков

### 🤖 Для AI систем
👉 **AI-INTEGRATION-GUIDE.md**
- ChatGPT / OpenAI
- Claude / Anthropic
- Gemini / Google
- LLaMA / Meta
- Custom AI systems

### 📝 Для программистов
👉 **API-FOR-AI-AND-SCRIPTS.md**
- REST API документация
- SDK использование
- cURL примеры
- JSON output
- Webhook конфигурация

---

## 🎓 Шаг за шагом для новичков

### День 1: Установка
```bash
npm install
export GITHUB_TOKEN=ghp_...
export GITHUB_USERNAME=john
```

### День 2: Первая загрузка
```bash
popapi push ./my-files my-repo
# ✅ Файлы на GitHub!
```

### День 3: Интеграция в скрипт
```bash
#!/bin/bash
export GITHUB_TOKEN=...
npm run build
popapi push ./dist artifacts-repo
```

### День 4: SDK использование
```javascript
const PopApiSDK = require('popapi-sdk');
const api = new PopApiSDK({ token, username });
await api.upload('./build', 'repo');
```

### День 5: AI интеграция
```python
# Интегрируйте с ChatGPT/Claude
ai_client.call_tool("upload_to_github", ...)
```

---

## ❓ Частые вопросы

**Q: Я новичок, с чего начать?**
A: Читайте QUICKSTART.md, потом API-FOR-AI-AND-SCRIPTS.md

**Q: Я разработчик, что использовать?**
A: Выбирайте между SDK, REST API или CLI

**Q: Я хочу интегрировать с AI?**
A: Читайте AI-INTEGRATION-GUIDE.md для вашей системы

**Q: Мой язык программирования не в примерах?**
A: REST API работает для любого языка (см. EXAMPLES-ALL-LANGUAGES.md)

**Q: Как защитить мой токен?**
A: Используйте переменные окружения, не коммитьте в Git

---

## 🆘 Нужна помощь?

1. Прочитайте подходящий гайд выше
2. Проверьте примеры в EXAMPLES-ALL-LANGUAGES.md
3. Смотрите TROUBLESHOOTING.md
4. Создайте Issue на GitHub

---

## 📋 Версия информация

```
Версия: 1.0.0-beta
Дата: 2024-06-12
Статус: Beta (готово к тестированию)
Node.js: >= 14
Лицензия: MIT
```

---

## 🎉 Готовы начать?

### Выберите ваш путь:

**🌐 Веб-интерфейс?**
```bash
npm start
# http://localhost:3000
```

**💻 Командная строка?**
```bash
export GITHUB_TOKEN=ghp_...
export GITHUB_USERNAME=john
popapi push ./files my-repo
```

**📚 SDK в коде?**
```javascript
const api = new PopApiSDK({ token, username });
await api.upload('./files', 'repo');
```

**🤖 AI система?**
Читайте AI-INTEGRATION-GUIDE.md

---

**popApi v1.0.0-beta - Используйте везде, всегда и как угодно! 🚀**
