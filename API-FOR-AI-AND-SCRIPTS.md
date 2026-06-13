# 🤖 popApi v1.0.0-beta - Использование с AI и программами

**popApi теперь можно использовать из любого места без веб-интерфейса!**

---

## 🎯 Главная идея

popApi v1.0.0-beta позволяет:
- ✅ **Использовать из CLI** с переменными окружения
- ✅ **Использовать как SDK** в JavaScript/Node.js коде
- ✅ **Использовать через REST API** из любого языка программирования
- ✅ **Использовать из AI** (ChatGPT, Claude, LLaMA и т.д.)
- ✅ **Использовать в скриптах** (Bash, Python, Go и т.д.)

---

## 🚀 Способ 1: Через переменные окружения (САМЫЙ ПРОСТОЙ)

### Для Bash/Shell скриптов

```bash
#!/bin/bash

# Установка переменных окружения
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
export GITHUB_USERNAME="your-username"
export GITHUB_REPO="your-repo"

# Загрузить папку
popapi push ./my-files

# Загрузить один файл
popapi file ./important.txt

# Получить JSON результат
JSON_OUTPUT=1 popapi push ./files | jq .
```

### Для Python скриптов

```python
#!/usr/bin/env python3
import os
import subprocess
import json

# Установка переменных окружения
os.environ['GITHUB_TOKEN'] = 'ghp_...'
os.environ['GITHUB_USERNAME'] = 'john'
os.environ['JSON_OUTPUT'] = '1'

# Загрузить файлы
result = subprocess.run(
    ['popapi', 'push', './files', 'my-repo'],
    capture_output=True,
    text=True
)

data = json.loads(result.stdout)
print(f"Успешно: {data['successful']}")
print(f"Ошибок: {data['failed']}")
```

### Для Docker контейнеров

```dockerfile
FROM node:16-alpine

# Установка popApi
RUN npm install -g popapi

# Установка переменных в контейнере
ENV GITHUB_TOKEN=ghp_xxxxx
ENV GITHUB_USERNAME=john
ENV GITHUB_REPO=my-repo

# Ваш скрипт
COPY ./upload.sh /upload.sh
RUN chmod +x /upload.sh

CMD ["/upload.sh"]
```

```bash
#!/bin/bash
# upload.sh

popapi push ./build my-repo main
```

---

## 💻 Способ 2: SDK - Встраивание в ваш код

### JavaScript / Node.js

```javascript
const PopApiSDK = require('popapi-sdk');

// Инициализация
const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME,
  repo: 'my-repo'
});

// Загрузить папку
(async () => {
  try {
    const results = await api.upload('./dist', 'my-repo', 'main', (progress) => {
      console.log(`[${progress.current}/${progress.total}] ${progress.file}`);
    });

    console.log(`✅ ${results.successful} загружено`);
    console.log(`❌ ${results.failed} ошибок`);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### Загрузить один файл

```javascript
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: 'ghp_...',
  username: 'john'
});

(async () => {
  const result = await api.uploadFile(
    './src/app.js',
    'my-repo',
    'main',
    'src/'  // Удаленная папка
  );

  console.log(`File uploaded: ${result.file}`);
})();
```

### Проверить файл перед загрузкой

```javascript
const api = new PopApiSDK({ token, username });

(async () => {
  // Проверить, существует ли уже файл
  const exists = await api.fileExists('README.md', 'my-repo', 'main');
  
  if (!exists) {
    const result = await api.uploadFile('./README.md', 'my-repo');
    console.log('File uploaded:', result);
  } else {
    console.log('File already exists');
  }
})();
```

### Получить информацию о репозитории

```javascript
const api = new PopApiSDK({ token, username });

(async () => {
  const repo = await api.getRepo('my-repo');
  
  console.log(`Repository: ${repo.name}`);
  console.log(`Stars: ${repo.stargazers_count}`);
  console.log(`Default branch: ${repo.default_branch}`);
})();
```

### Список файлов в репозитории

```javascript
const api = new PopApiSDK({ token, username });

(async () => {
  const files = await api.listFiles('my-repo', 'src', 'main');
  
  files.forEach(file => {
    console.log(`${file.name} (${file.type})`);
  });
})();
```

---

## 🌐 Способ 3: REST API (для любого языка)

### Начните сервер

```bash
# На сервере или локально
npm start

# Сервер слушает на http://localhost:3000
```

### cURL примеры

```bash
# 1. Получить текущую конфигурацию
curl http://localhost:3000/api/config

# 2. Сохранить конфигурацию
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_...",
    "username": "john",
    "defaultRepo": "my-repo"
  }'

# 3. Загрузить файлы (multipart form)
curl -X POST http://localhost:3000/api/upload \
  -F "files=@file1.txt" \
  -F "files=@file2.js" \
  -F "repo=my-repo" \
  -F "branch=main"

# 4. Получить историю
curl http://localhost:3000/api/history

# 5. Получить список загруженных файлов
curl http://localhost:3000/api/uploads
```

### Python примеры

```python
import requests
import json
from pathlib import Path

# Конфигурация
BASE_URL = "http://localhost:3000"

class PopApiClient:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
    
    def configure(self, token, username, default_repo=""):
        """Сохранить конфигурацию"""
        response = requests.post(
            f"{self.base_url}/api/config",
            json={
                "token": token,
                "username": username,
                "defaultRepo": default_repo
            }
        )
        return response.json()
    
    def upload_files(self, repo, *files, branch="main"):
        """Загрузить файлы"""
        form_data = {
            "repo": repo,
            "branch": branch
        }
        
        files_data = {}
        for i, file_path in enumerate(files):
            with open(file_path, 'rb') as f:
                files_data[f'files'] = (Path(file_path).name, f.read())
        
        response = requests.post(
            f"{self.base_url}/api/upload",
            data=form_data,
            files=files_data
        )
        return response.json()
    
    def get_history(self):
        """Получить историю загрузок"""
        response = requests.get(f"{self.base_url}/api/history")
        return response.json()

# Использование
client = PopApiClient()

# Конфигурация
client.configure(
    token="ghp_...",
    username="john",
    default_repo="my-repo"
)

# Загрузить файлы
results = client.upload_files(
    "my-repo",
    "./file1.txt",
    "./file2.py",
    branch="main"
)

print(f"Success: {results['summary']['successful']}")
print(f"Failed: {results['summary']['failed']}")
```

### Go примеры

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func uploadFiles(repo string, filePaths []string) error {
	url := "http://localhost:3000/api/upload"
	
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	// Добавить файлы
	for _, filePath := range filePaths {
		file, err := os.Open(filePath)
		if err != nil {
			return err
		}
		defer file.Close()
		
		part, err := writer.CreateFormFile("files", filePath)
		if err != nil {
			return err
		}
		
		io.Copy(part, file)
	}
	
	// Добавить поля
	writer.WriteField("repo", repo)
	writer.WriteField("branch", "main")
	writer.Close()
	
	// Отправить запрос
	resp, err := http.Post(url, writer.FormDataContentType(), &body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	fmt.Println("Status:", resp.Status)
	return nil
}

func main() {
	uploadFiles("my-repo", []string{"file1.txt", "file2.go"})
}
```

---

## 🤖 Использование с AI (ChatGPT, Claude и т.д.)

### Инструкция для AI

**Вы можете использовать эту инструкцию для любого AI:**

```markdown
# popApi - GitHub Upload Tool

Ты можешь загружать файлы на GitHub без веб-интерфейса.

## Установка
npm install
npm start

## Использование через REST API

### 1. Конфигурация
```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"token":"ghp_...","username":"john"}'
```

### 2. Загрузка файлов
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@file.txt" \
  -F "repo=my-repo"
```

### 3. История
```bash
curl http://localhost:3000/api/history
```

## Примеры

Когда пользователь просит загрузить файлы, выполни:
1. Проверь, что popApi запущен (npm start)
2. Используй curl для конфигурации
3. Используй curl для загрузки
4. Покажи результат
```

### Использование через curl в AI контексте

```bash
# AI может использовать эти команды
# Сохранить конфигурацию
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"token":"'$GITHUB_TOKEN'","username":"'$GITHUB_USER'"}'

# Загрузить файл
curl -X POST http://localhost:3000/api/upload \
  -F "files=@generated-file.txt" \
  -F "repo='$TARGET_REPO'"
```

---

## 📚 Примеры для разных сценариев

### Сценарий 1: CI/CD Pipeline

```yaml
# .github/workflows/upload.yml
name: Upload to GitHub

on: [push]

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Build
        run: npm run build
      
      - name: Upload artifacts
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_USERNAME: ${{ github.actor }}
          GITHUB_REPO: artifacts-repo
        run: |
          npm install -g popapi
          popapi push ./dist
```

### Сценарий 2: Автоматическая загрузка логов

```bash
#!/bin/bash
# upload-logs.sh

# Параметры
LOG_DIR="/var/logs/myapp"
REPO="logs-repository"
BRANCH=$(date +%Y-%m-%d)

export GITHUB_TOKEN="your_token"
export GITHUB_USERNAME="your_user"

# Создать ветку для дня
popapi push "$LOG_DIR" "$REPO" "$BRANCH"

echo "Logs uploaded to: $REPO (branch: $BRANCH)"
```

### Сценарий 3: Синхронизация выходов AI

```javascript
// ai-sync.js
const PopApiSDK = require('popapi-sdk');
const fs = require('fs');
const path = require('path');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

async function syncAIOutput(outputDir, repo) {
  console.log('🤖 Syncing AI output...');
  
  const results = await api.upload(outputDir, repo, 'ai-generated', (prog) => {
    console.log(`[${prog.current}/${prog.total}] ${prog.file}`);
  });

  console.log(`✅ Synced: ${results.successful} files`);
  
  // Отправить webhook (опционально)
  await notifySync({
    timestamp: new Date().toISOString(),
    uploaded: results.successful,
    failed: results.failed,
    repository: repo
  });
}

async function notifySync(data) {
  // Отправить уведомление в Discord, Slack и т.д.
  console.log('📤 Notification:', JSON.stringify(data));
}

syncAIOutput('./ai-output', 'ai-results');
```

---

## 🔐 Безопасность

### Для использования с AI/программами

```bash
# ✅ ПРАВИЛЬНО - используйте переменные окружения
export GITHUB_TOKEN="ghp_..."
export GITHUB_USERNAME="john"
popapi push ./files my-repo

# ❌ НЕПРАВИЛЬНО - не пишите токен в код
popapi push ./files my-repo --token ghp_xxx  # ОПАСНО!
```

### Ограничение прав токена

Для AI используйте токены с минимальными правами:

```
Scope: repo (Full control of private repositories)
```

Лучше создать отдельные токены для разных целей:
- Один для CI/CD
- Один для AI интеграций
- Один для локального использования

---

## ⚙️ Конфигурация для машин

### Через .env файл

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_USERNAME=your-username
GITHUB_REPO=your-repo
```

### Через Docker

```dockerfile
FROM node:16

WORKDIR /app
COPY package*.json ./
RUN npm install -g popapi

ENV GITHUB_TOKEN=ghp_xxxxx
ENV GITHUB_USERNAME=john
ENV GITHUB_REPO=my-repo

ENTRYPOINT ["popapi"]
```

```bash
docker run -e GITHUB_TOKEN=ghp_... -v $(pwd):/data popapi push /data my-repo
```

---

## 📊 JSON Output для программного использования

Получить JSON результат вместо текста:

```bash
# Включить JSON вывод
JSON_OUTPUT=1 popapi push ./files my-repo

# Результат:
{
  "successful": 5,
  "failed": 0,
  "files": [
    {
      "name": "file1.txt",
      "status": "success"
    },
    ...
  ]
}
```

### Парсирование в Bash

```bash
#!/bin/bash

JSON_OUTPUT=1 popapi push ./files my-repo > result.json

successful=$(jq '.successful' result.json)
failed=$(jq '.failed' result.json)

if [ $failed -gt 0 ]; then
  echo "⚠️ Some files failed to upload"
  exit 1
fi

echo "✅ All files uploaded successfully"
```

---

## 🚀 Быстрый старт для разработчиков

### 1. Установка

```bash
npm install popapi
# или глобально
npm install -g popapi
```

### 2. Использование SDK

```javascript
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

// Ваш код здесь
```

### 3. Запуск сервера для REST API

```bash
npm start
# http://localhost:3000/api/...
```

---

## 🎯 Заключение

popApi v1.0.0-beta дает вам полную гибкость:

- 🌐 **Веб-интерфейс** - для людей
- 💻 **CLI** - для скриптов
- 📚 **SDK** - для интеграций
- 🔌 **REST API** - для чего угодно
- 🤖 **Машины** - для AI и программ

**Выбирайте то, что подходит вашему случаю! 🚀**
