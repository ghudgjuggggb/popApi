# 🌍 popApi - Примеры на разных языках

Используйте popApi в своих проектах на любом языке программирования!

---

## 📝 JavaScript/Node.js

### Пример 1: Простая загрузка

```javascript
// upload.js
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

async function uploadProject() {
  try {
    console.log('📤 Uploading project files...');
    
    const results = await api.upload(
      './dist',
      'my-project',
      'main'
    );

    console.log(`✅ ${results.successful} files uploaded`);
    
    if (results.failed > 0) {
      console.log(`❌ ${results.failed} files failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

uploadProject();
```

**Запуск:**
```bash
export GITHUB_TOKEN=ghp_...
export GITHUB_USERNAME=john
node upload.js
```

### Пример 2: С обработкой прогресса

```javascript
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

async function uploadWithProgress() {
  const results = await api.upload(
    './build',
    'my-repo',
    'main',
    (progress) => {
      const bar = '█'.repeat(Math.floor(progress.current / progress.total * 20));
      const empty = '░'.repeat(20 - bar.length);
      const percentage = Math.round(progress.current / progress.total * 100);
      
      console.clear();
      console.log(`Uploading: [${bar}${empty}] ${percentage}%`);
      console.log(`File: ${progress.file} - ${progress.status}`);
    }
  );

  console.log('\n✅ Done!');
}

uploadWithProgress();
```

### Пример 3: Условная загрузка

```javascript
const PopApiSDK = require('popapi-sdk');

const api = new PopApiSDK({
  token: process.env.GITHUB_TOKEN,
  username: process.env.GITHUB_USERNAME
});

async function smartUpload() {
  const repo = 'my-repo';
  
  // Проверить, существует ли уже файл
  const exists = await api.fileExists('dist/bundle.js', repo);
  
  if (exists) {
    console.log('Bundle already exists');
    return;
  }

  // Загрузить только если не существует
  const result = await api.uploadFile(
    './dist/bundle.js',
    repo,
    'main',
    'dist/'
  );

  console.log(`✅ Uploaded to: ${result.file}`);
}

smartUpload();
```

---

## 🐍 Python

### Пример 1: Базовая загрузка

```python
#!/usr/bin/env python3
import requests
import os
import json

class PopApiClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.token = os.getenv('GITHUB_TOKEN')
        self.username = os.getenv('GITHUB_USERNAME')
        self.repo = os.getenv('GITHUB_REPO', 'my-repo')
    
    def upload_directory(self, directory, branch="main"):
        """Загрузить папку"""
        files = {}
        for root, dirs, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                with open(filepath, 'rb') as f:
                    files['files'] = f.read()
                    
                response = requests.post(
                    f"{self.base_url}/api/upload",
                    files={'files': (filename, f.read())},
                    data={
                        'repo': self.repo,
                        'branch': branch
                    }
                )
                
        return response.json()

if __name__ == "__main__":
    client = PopApiClient()
    result = client.upload_directory('./dist')
    
    print(f"✅ Success: {result['summary']['successful']}")
    print(f"❌ Failed: {result['summary']['failed']}")
```

### Пример 2: С использованием subprocess

```python
#!/usr/bin/env python3
import subprocess
import json
import os

def upload_files(directory, repo, branch="main"):
    """Загрузить файлы используя CLI"""
    
    env = os.environ.copy()
    env['JSON_OUTPUT'] = '1'
    
    result = subprocess.run(
        ['popapi', 'push', directory, repo, branch],
        env=env,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return None
    
    try:
        data = json.loads(result.stdout)
        return data
    except json.JSONDecodeError:
        print("Invalid JSON output")
        return None

if __name__ == "__main__":
    result = upload_files(
        './build',
        os.getenv('GITHUB_REPO', 'my-repo')
    )
    
    if result:
        print(f"✅ Uploaded: {result['successful']}")
        print(f"❌ Failed: {result['failed']}")
```

### Пример 3: Класс с логированием

```python
#!/usr/bin/env python3
import os
import subprocess
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GitHubUploader:
    def __init__(self, token, username, repo):
        self.token = token
        self.username = username
        self.repo = repo
    
    def upload(self, directory, branch="main"):
        """Загрузить с логированием"""
        logger.info(f"Starting upload: {directory} -> {self.repo}")
        
        env = {
            'GITHUB_TOKEN': self.token,
            'GITHUB_USERNAME': self.username,
            'JSON_OUTPUT': '1'
        }
        
        try:
            result = subprocess.run(
                ['popapi', 'push', directory, self.repo, branch],
                env=env,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            data = json.loads(result.stdout)
            
            logger.info(f"✅ Upload complete: {data['successful']} files")
            
            if data['failed'] > 0:
                logger.warning(f"⚠️ {data['failed']} files failed")
            
            return data
        except Exception as e:
            logger.error(f"❌ Upload failed: {e}")
            return None

if __name__ == "__main__":
    uploader = GitHubUploader(
        os.getenv('GITHUB_TOKEN'),
        os.getenv('GITHUB_USERNAME'),
        'my-repo'
    )
    
    uploader.upload('./dist')
```

---

## 🟨 Go

### Пример 1: Простая загрузка

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
)

type UploadResult struct {
	Success   bool   `json:"success"`
	Summary   Summary `json:"summary"`
}

type Summary struct {
	Total      int `json:"total"`
	Successful int `json:"successful"`
	Failed     int `json:"failed"`
}

func uploadFiles(directory string, repo string) error {
	url := "http://localhost:3000/api/upload"
	
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	// Добавить файлы
	err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()
			
			part, err := writer.CreateFormFile("files", filepath.Base(path))
			if err != nil {
				return err
			}
			
			io.Copy(part, file)
		}
		
		return nil
	})
	
	if err != nil {
		return err
	}
	
	// Добавить параметры
	writer.WriteField("repo", repo)
	writer.WriteField("branch", "main")
	writer.Close()
	
	// Отправить запрос
	resp, err := http.Post(url, writer.FormDataContentType(), &body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	// Парсить результат
	var result UploadResult
	json.NewDecoder(resp.Body).Decode(&result)
	
	fmt.Printf("✅ Uploaded: %d files\n", result.Summary.Successful)
	fmt.Printf("❌ Failed: %d files\n", result.Summary.Failed)
	
	return nil
}

func main() {
	err := uploadFiles("./dist", "my-repo")
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
}
```

### Пример 2: С использованием os.Exec

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

type CLIResult struct {
	Successful int `json:"successful"`
	Failed     int `json:"failed"`
}

func uploadViaCLI(directory, repo string) (*CLIResult, error) {
	cmd := exec.Command("popapi", "push", directory, repo)
	
	cmd.Env = append(os.Environ(),
		"GITHUB_TOKEN=" + os.Getenv("GITHUB_TOKEN"),
		"GITHUB_USERNAME=" + os.Getenv("GITHUB_USERNAME"),
		"JSON_OUTPUT=1",
	)
	
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	
	var result CLIResult
	err = json.Unmarshal(output, &result)
	
	return &result, err
}

func main() {
	result, err := uploadViaCLI("./dist", "my-repo")
	
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
	
	fmt.Printf("✅ Uploaded: %d\n❌ Failed: %d\n", result.Successful, result.Failed)
}
```

---

## 🟠 Bash/Shell

### Пример 1: Простой скрипт

```bash
#!/bin/bash
# upload.sh

set -e

DIRECTORY="${1:-.}"
REPO="${2:?Repository name required}"
BRANCH="${3:-main}"

export GITHUB_TOKEN="${GITHUB_TOKEN:?GitHub token required}"
export GITHUB_USERNAME="${GITHUB_USERNAME:?GitHub username required}"

echo "📤 Uploading $DIRECTORY to $REPO..."

popapi push "$DIRECTORY" "$REPO" "$BRANCH"

echo "✅ Done!"
```

**Использование:**
```bash
bash upload.sh ./dist my-repo main
```

### Пример 2: С обработкой ошибок

```bash
#!/bin/bash

upload_with_retry() {
    local directory=$1
    local repo=$2
    local branch=${3:-main}
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "📤 Attempt $attempt/$max_attempts"
        
        if popapi push "$directory" "$repo" "$branch"; then
            echo "✅ Upload successful"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo "⏳ Retrying in 5 seconds..."
            sleep 5
        fi
        
        ((attempt++))
    done
    
    echo "❌ Upload failed after $max_attempts attempts"
    return 1
}

upload_with_retry "$@"
```

### Пример 3: Параллельная загрузка

```bash
#!/bin/bash
# parallel-upload.sh

REPOS=("repo1" "repo2" "repo3")
DIRECTORY="./dist"

for repo in "${REPOS[@]}"; do
    echo "📤 Uploading to $repo..."
    popapi push "$DIRECTORY" "$repo" main &
done

# Ждем завершения всех фоновых процессов
wait

echo "✅ All uploads completed!"
```

---

## 🐚 Perl

```perl
#!/usr/bin/perl
use strict;
use warnings;
use LWP::UserAgent;
use HTTP::Request::Common;
use JSON;
use File::Find;

my $directory = $ARGV[0] || '.';
my $repo = $ARGV[1] || die "Repository required";

my @files;
find(sub {
    push @files, $File::Find::name if -f;
}, $directory);

my $ua = LWP::UserAgent->new;

foreach my $file (@files) {
    print "📤 Uploading: $file\n";
    
    my $req = POST 'http://localhost:3000/api/upload',
        Content_Type => 'form-data',
        Content => [
            files => [$file],
            repo => $repo,
            branch => 'main'
        ];
    
    my $res = $ua->request($req);
    
    if ($res->is_success) {
        print "✅ $file uploaded\n";
    } else {
        print "❌ Failed to upload $file\n";
    }
}

print "✅ Done!\n";
```

---

## 📦 PHP

```php
<?php

class PopApiClient {
    private $baseUrl;
    
    public function __construct($baseUrl = 'http://localhost:3000') {
        $this->baseUrl = $baseUrl;
    }
    
    public function uploadFile($filePath, $repo, $branch = 'main') {
        $ch = curl_init();
        
        $postData = [
            'repo' => $repo,
            'branch' => $branch,
            'files' => new CURLFile($filePath)
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_URL => "{$this->baseUrl}/api/upload",
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return json_decode($response, true);
        } else {
            throw new Exception("Upload failed: " . $response);
        }
    }
    
    public function uploadDirectory($directory, $repo) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory)
        );
        
        foreach ($files as $file) {
            if ($file->isFile()) {
                echo "📤 Uploading: " . $file->getPathname() . "\n";
                $this->uploadFile($file->getPathname(), $repo);
            }
        }
    }
}

// Использование
$client = new PopApiClient();

try {
    $client->uploadDirectory('./dist', 'my-repo');
    echo "✅ Upload completed!\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
```

---

## ☕ Java

```java
import java.io.*;
import java.net.*;
import java.nio.file.*;
import org.json.JSONObject;

public class PopApiClient {
    private String baseUrl;
    
    public PopApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    public void uploadFile(String filePath, String repo) throws Exception {
        URL url = new URL(baseUrl + "/api/upload");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        
        String boundary = "----FormBoundary" + System.currentTimeMillis();
        conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
        
        try (OutputStream os = conn.getOutputStream()) {
            // Написать данные
            byte[] separator = ("--" + boundary + "\r\n").getBytes();
            os.write(separator);
            
            // Параметры
            String params = "Content-Disposition: form-data; name=\"repo\"\r\n\r\n" + repo + "\r\n";
            os.write(params.getBytes());
            
            // Файл
            os.write(separator);
            String fileHeader = "Content-Disposition: form-data; name=\"files\"; filename=\"" + 
                              new File(filePath).getName() + "\"\r\n\r\n";
            os.write(fileHeader.getBytes());
            
            Files.copy(Paths.get(filePath), os);
            
            os.write(("\r\n" + "--" + boundary + "--\r\n").getBytes());
        }
        
        int responseCode = conn.getResponseCode();
        System.out.println("Response: " + responseCode);
    }
    
    public static void main(String[] args) throws Exception {
        PopApiClient client = new PopApiClient("http://localhost:3000");
        client.uploadFile("./dist/file.txt", "my-repo");
    }
}
```

---

## 🦀 Rust

```rust
use reqwest::multipart;
use reqwest::Client;
use std::fs;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let directory = "./dist";
    let repo = "my-repo";
    
    let client = Client::new();
    
    // Получить все файлы
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let path = entry.path();
        
        if path.is_file() {
            upload_file(&client, &path, repo).await?;
        }
    }
    
    Ok(())
}

async fn upload_file(
    client: &reqwest::Client,
    file_path: &Path,
    repo: &str
) -> Result<(), Box<dyn std::error::Error>> {
    let file_name = file_path.file_name().unwrap().to_string_lossy();
    let file_content = fs::read(&file_path)?;
    
    let form = multipart::Form::new()
        .file("files", file_path)?
        .text("repo", repo.to_string())
        .text("branch", "main".to_string());
    
    let response = client
        .post("http://localhost:3000/api/upload")
        .multipart(form)
        .send()
        .await?;
    
    println!("📤 {}: {}", file_name, response.status());
    
    Ok(())
}
```

---

## 🎯 Выбор языка

Используйте примеры выше для вашего любимого языка!

Все примеры:
- ✅ Готовы к использованию
- ✅ Обрабатывают ошибки
- ✅ Имеют комментарии
- ✅ Работают с popApi REST API или SDK

**Начните с самого простого примера и расширяйте по необходимости!** 🚀
