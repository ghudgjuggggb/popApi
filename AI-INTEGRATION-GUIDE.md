# 🤖 Интеграция popApi с AI системами

**Руководство для разработчиков на интеграцию popApi в AI приложения**

---

## 📋 Содержание

1. [ChatGPT / OpenAI](#chatgpt--openai)
2. [Claude / Anthropic](#claude--anthropic)
3. [Gemini / Google](#gemini--google)
4. [LLaMA / Meta](#llama--meta)
5. [Custom AI Systems](#custom-ai-systems)

---

## 🔴 ChatGPT / OpenAI

### Способ 1: Через функции (Function Calling)

```json
{
  "type": "function",
  "function": {
    "name": "upload_to_github",
    "description": "Upload files to GitHub repository using popApi",
    "parameters": {
      "type": "object",
      "properties": {
        "directory": {
          "type": "string",
          "description": "Directory path containing files to upload"
        },
        "repository": {
          "type": "string",
          "description": "GitHub repository name"
        },
        "branch": {
          "type": "string",
          "description": "Target branch (default: main)",
          "default": "main"
        }
      },
      "required": ["directory", "repository"]
    }
  }
}
```

### Интеграция с OpenAI SDK

```python
import os
import json
import subprocess
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def upload_to_github(directory, repository, branch="main"):
    """Execute popApi upload command"""
    env = os.environ.copy()
    env['JSON_OUTPUT'] = '1'
    
    result = subprocess.run(
        ['popapi', 'push', directory, repository, branch],
        env=env,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        return {"error": result.stderr}
    
    return json.loads(result.stdout)

def process_tool_call(tool_name, tool_input):
    """Process function calling"""
    if tool_name == "upload_to_github":
        return upload_to_github(
            tool_input["directory"],
            tool_input["repository"],
            tool_input.get("branch", "main")
        )

def chat_with_github_upload(user_message):
    """Chat with GPT and ability to upload to GitHub"""
    
    tools = [{
        "type": "function",
        "function": {
            "name": "upload_to_github",
            "description": "Upload files to GitHub using popApi",
            "parameters": {
                "type": "object",
                "properties": {
                    "directory": {"type": "string"},
                    "repository": {"type": "string"},
                    "branch": {"type": "string", "default": "main"}
                },
                "required": ["directory", "repository"]
            }
        }
    }]
    
    messages = [
        {"role": "user", "content": user_message}
    ]
    
    while True:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            tools=tools
        )
        
        if response.stop_reason == "tool_calls":
            for tool_call in response.tool_calls:
                result = process_tool_call(
                    tool_call.function.name,
                    json.loads(tool_call.function.arguments)
                )
                
                messages.append({
                    "role": "assistant",
                    "content": response.choices[0].message.content
                })
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result)
                })
        else:
            return response.choices[0].message.content

# Использование
response = chat_with_github_upload(
    "Upload the files in ./dist folder to my github-deployment repository"
)
print(response)
```

### Способ 2: Через REST API

```python
import requests
import json
from pathlib import Path

class PopApiGPTClient:
    def __init__(self, popapi_url="http://localhost:3000"):
        self.base_url = popapi_url
    
    def upload_via_gpt(self, directory, repo, branch="main"):
        """Upload using popApi REST API"""
        
        files_data = {}
        for file_path in Path(directory).rglob('*'):
            if file_path.is_file():
                with open(file_path, 'rb') as f:
                    files_data[f'files'] = f.read()
        
        response = requests.post(
            f"{self.base_url}/api/upload",
            files=files_data,
            data={
                'repo': repo,
                'branch': branch
            }
        )
        
        return response.json()

# Использование из GPT
client = PopApiGPTClient()
result = client.upload_via_gpt('./generated_code', 'ai-generated-repo')
print(json.dumps(result, indent=2))
```

---

## 🪟 Claude / Anthropic

### Использование Tool Use

```python
import anthropic
import subprocess
import json
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

tools = [
    {
        "name": "upload_to_github",
        "description": "Upload files to GitHub repository using popApi",
        "input_schema": {
            "type": "object",
            "properties": {
                "directory": {
                    "type": "string",
                    "description": "Directory path to upload"
                },
                "repository": {
                    "type": "string",
                    "description": "GitHub repository name"
                },
                "branch": {
                    "type": "string",
                    "description": "Target branch",
                    "default": "main"
                }
            },
            "required": ["directory", "repository"]
        }
    }
]

def execute_upload(directory, repository, branch="main"):
    """Execute actual upload"""
    env = os.environ.copy()
    env['JSON_OUTPUT'] = '1'
    
    result = subprocess.run(
        ['popapi', 'push', directory, repository, branch],
        env=env,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        return {"error": result.stderr}
    
    return json.loads(result.stdout)

def claude_upload_files(user_message):
    """Use Claude with GitHub upload capability"""
    
    messages = [
        {"role": "user", "content": user_message}
    ]
    
    while True:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )
        
        if response.stop_reason == "tool_use":
            # Find tool use block
            tool_use_block = next(
                (block for block in response.content if block.type == "tool_use"),
                None
            )
            
            if tool_use_block:
                # Execute tool
                result = execute_upload(
                    tool_use_block.input["directory"],
                    tool_use_block.input["repository"],
                    tool_use_block.input.get("branch", "main")
                )
                
                # Add to messages
                messages.append({
                    "role": "assistant",
                    "content": response.content
                })
                
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_block.id,
                            "content": json.dumps(result)
                        }
                    ]
                })
        else:
            # Extract text response
            text_block = next(
                (block for block in response.content if hasattr(block, 'text')),
                None
            )
            return text_block.text if text_block else "Done"

# Использование
response = claude_upload_files(
    "Please generate a Python script that calculates fibonacci numbers and upload it to my ai-generated repository"
)
print(response)
```

---

## 🔵 Gemini / Google

### Использование Google AI SDK

```python
import google.generativeai as genai
import subprocess
import json
import os

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

tools = [
    {
        "name": "upload_to_github",
        "description": "Upload files to GitHub repository",
        "parameters": {
            "type": "object",
            "properties": {
                "directory": {"type": "string"},
                "repository": {"type": "string"},
                "branch": {"type": "string"}
            },
            "required": ["directory", "repository"]
        }
    }
]

def execute_upload(directory, repository, branch="main"):
    """Execute popApi upload"""
    env = os.environ.copy()
    env['JSON_OUTPUT'] = '1'
    
    result = subprocess.run(
        ['popapi', 'push', directory, repository, branch],
        env=env,
        capture_output=True,
        text=True
    )
    
    return json.loads(result.stdout) if result.returncode == 0 else {"error": result.stderr}

def gemini_with_upload(user_prompt):
    """Gemini with GitHub upload capability"""
    
    model = genai.GenerativeModel(
        'gemini-2.0-flash',
        tools=tools
    )
    
    chat = model.start_chat()
    response = chat.send_message(user_prompt)
    
    while response.function_calls:
        for call in response.function_calls:
            if call.name == "upload_to_github":
                result = execute_upload(
                    call.args["directory"],
                    call.args["repository"],
                    call.args.get("branch", "main")
                )
                
                response = chat.send_message({
                    "function_responses": [
                        {
                            "name": "upload_to_github",
                            "response": result
                        }
                    ]
                })
    
    return response.text

# Использование
result = gemini_with_upload(
    "Create a JavaScript calculator app and upload to my ai-tools repository"
)
print(result)
```

---

## 🦙 LLaMA / Meta

### Локальное развертывание с ollama

```python
import requests
import json
import subprocess
import os

class OllamaGitHubClient:
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
    
    def upload_to_github(self, directory, repo):
        """Execute upload command"""
        env = os.environ.copy()
        env['JSON_OUTPUT'] = '1'
        
        result = subprocess.run(
            ['popapi', 'push', directory, repo],
            env=env,
            capture_output=True,
            text=True
        )
        
        return json.loads(result.stdout) if result.returncode == 0 else None
    
    def chat_with_upload(self, prompt, model="llama2"):
        """Chat with LLaMA and ability to upload"""
        
        tools = [{
            "name": "upload_to_github",
            "description": "Upload files to GitHub",
            "params": ["directory", "repository"]
        }]
        
        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": model,
                "prompt": f"""
You have access to a tool: upload_to_github(directory, repository)
Use it when the user asks to upload files.

Tools available:
{json.dumps(tools, indent=2)}

User request: {prompt}

Respond with the tool call or answer directly.
""",
                "stream": False
            }
        )
        
        return response.json()

# Использование
client = OllamaGitHubClient()
result = client.chat_with_upload("Generate a hello world Python script and upload to my-ai-repo")
print(result)
```

---

## ⚙️ Custom AI Systems

### Общий паттерн интеграции

```python
class AIGitHubIntegration:
    """Base class for AI + GitHub integration"""
    
    def __init__(self, ai_client, popapi_url="http://localhost:3000"):
        self.ai_client = ai_client
        self.popapi_url = popapi_url
    
    def register_upload_tool(self):
        """Register GitHub upload as a tool"""
        return {
            "name": "upload_to_github",
            "description": "Upload generated files to GitHub",
            "parameters": {
                "directory": "str - Local directory to upload",
                "repository": "str - Target GitHub repository",
                "branch": "str - Target branch (optional)",
                "message": "str - Commit message (optional)"
            }
        }
    
    def execute_upload(self, directory, repository, branch="main", message=""):
        """Execute the upload"""
        import requests
        
        # Prepare files
        files = {}
        for root, dirs, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                with open(filepath, 'rb') as f:
                    files[f'files'] = f.read()
        
        # Upload via API
        response = requests.post(
            f"{self.popapi_url}/api/upload",
            files=files,
            data={
                'repo': repository,
                'branch': branch,
                'message': message
            }
        )
        
        return response.json()
    
    def handle_tool_call(self, tool_name, tool_args):
        """Handle tool calls from AI"""
        if tool_name == "upload_to_github":
            return self.execute_upload(
                tool_args.get("directory"),
                tool_args.get("repository"),
                tool_args.get("branch", "main"),
                tool_args.get("message", "")
            )
        
        raise ValueError(f"Unknown tool: {tool_name}")

# Использование
integration = AIGitHubIntegration(your_ai_client)

# В основном цикле AI
while True:
    response = your_ai_client.generate(prompt)
    
    if response.has_tool_calls():
        for tool_call in response.tool_calls:
            result = integration.handle_tool_call(
                tool_call.name,
                tool_call.arguments
            )
            # Pass result back to AI
```

---

## 🚀 Примеры использования

### Пример 1: AI генерирует код и загружает

**Промпт для AI:**
```
Я хочу, чтобы ты:
1. Сгенерировал JavaScript приложение для TODO листа
2. Сохранил его в папку ./todo-app/
3. Загрузил в мой GitHub репозиторий "ai-generated-apps"

Используй для этого инструмент upload_to_github.
```

**Результат:**
- AI генерирует код
- Сохраняет в ./todo-app/
- Вызывает upload_to_github('./todo-app/', 'ai-generated-apps')
- Файлы появляются на GitHub

### Пример 2: AI обучается и сохраняет модель

```python
# AI обучает модель машинного обучения
# И сохраняет результаты

def train_model_and_upload():
    # 1. Обучение
    model = train_ml_model()
    
    # 2. Сохранение
    model.save('./models/')
    
    # 3. Загрузка на GitHub
    ai_client.call_tool(
        "upload_to_github",
        directory="./models/",
        repository="ml-models-repo",
        branch="trained-models"
    )
```

### Пример 3: Автоматическое резервное копирование

```python
# AI периодически сохраняет данные на GitHub

def backup_daily():
    ai_system.tools["upload_to_github"](
        directory="/var/data/",
        repository="ai-backups",
        branch=f"backup-{date.today()}"
    )
```

---

## 📚 Лучшие практики

### 1. Безопасность

```python
# ✅ ПРАВИЛЬНО
os.environ['GITHUB_TOKEN'] = secure_token_from_vault()

# ❌ НЕПРАВИЛЬНО
os.environ['GITHUB_TOKEN'] = "ghp_hardcoded_token"
```

### 2. Обработка ошибок

```python
try:
    result = ai_client.call_tool("upload_to_github", args)
except ToolExecutionError as e:
    print(f"Upload failed: {e}")
    ai_client.send_message(f"Failed to upload: {e}")
```

### 3. Логирование

```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"Uploading {directory} to {repo}")
logger.error(f"Upload failed: {error}")
```

---

## 🔌 Webhook для AI

Получайте уведомления когда AI успешно загрузил файлы:

```bash
# Добавить webhook
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-ai-server.com/webhooks/github",
    "type": "custom"
  }'
```

```python
# Обработать webhook в AI приложении
@app.post("/webhooks/github")
def handle_github_webhook(payload):
    if payload['event'] == 'upload.success':
        # Уведомить AI о успешной загрузке
        ai_system.notify(f"Files uploaded to {payload['repo']}")
```

---

## 📊 Мониторинг

Отслеживайте загрузки AI:

```python
import requests

def get_upload_history():
    response = requests.get('http://localhost:3000/api/history')
    history = response.json()['history']
    
    for entry in history:
        print(f"✅ {entry['repo']}: {entry['successful']} files")
```

---

## 🎯 Заключение

popApi v1.0.0-beta идеально подходит для интеграции с AI системами:

- ✅ **Простой API** - легко интегрировать
- ✅ **Гибкий** - работает с любым AI
- ✅ **Безопасный** - токены хранятся локально
- ✅ **Быстрый** - прямая интеграция с GitHub
- ✅ **Масштабируемый** - поддерживает вебхуки и мониторинг

**Начните интегрировать popApi в ваш AI сегодня! 🚀**
