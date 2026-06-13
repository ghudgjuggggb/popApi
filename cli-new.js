#!/usr/bin/env node

/**
 * popApi CLI v1.0.0-beta
 * 
 * Поддерживает использование с переменными окружения для AI/скриптов
 * 
 * ПРИМЕРЫ:
 * 
 * 1. Через интерактивную конфигурацию:
 *    popapi setup
 * 
 * 2. Через переменные окружения (для AI/скриптов):
 *    export GITHUB_TOKEN="ghp_..."
 *    export GITHUB_USERNAME="john"
 *    popapi push ./files my-repo
 * 
 * 3. Через аргументы (для скриптов):
 *    popapi push ./files my-repo main --token ghp_... --user john
 * 
 * 4. Через REST API (для AI):
 *    curl -X POST http://localhost:3000/api/upload \
 *      -F "files=@file.txt" \
 *      -F "repo=my-repo"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');
const PopApiSDK = require('./popapi-sdk');

const CONFIG_DIR = path.join(os.homedir(), '.popapi');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

class PopApiCLI {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // Приоритет: аргументы > переменные окружения > файл конфигурации
    const fileConfig = this._loadFileConfig();
    const envConfig = this._loadEnvConfig();
    
    return { ...fileConfig, ...envConfig };
  }

  _loadFileConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  _loadEnvConfig() {
    return {
      ...(process.env.GITHUB_TOKEN && { token: process.env.GITHUB_TOKEN }),
      ...(process.env.GITHUB_USERNAME && { username: process.env.GITHUB_USERNAME }),
      ...(process.env.GITHUB_REPO && { defaultRepo: process.env.GITHUB_REPO })
    };
  }

  saveConfig() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  async setup() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log('\n🚀 popApi Setup\n');
    
    const token = await question('Enter your GitHub token: ');
    const username = await question('Enter your GitHub username: ');
    const defaultRepo = await question('Enter default repository name (optional): ');

    this.config = {
      token,
      username,
      defaultRepo: defaultRepo || ''
    };

    this.saveConfig();
    console.log('\n✅ Configuration saved!\n');
    rl.close();
  }

  async uploadFiles(filesPath, repo, branch = 'main') {
    try {
      const sdk = new PopApiSDK({
        token: this.config.token,
        username: this.config.username,
        repo: repo || this.config.defaultRepo
      });

      console.log(`\n📤 Uploading files from: ${filesPath}`);
      console.log(`📌 Repository: ${repo || this.config.defaultRepo}`);
      console.log(`🌿 Branch: ${branch}\n`);

      const results = await sdk.upload(
        filesPath,
        repo,
        branch,
        (progress) => {
          const percentage = Math.round((progress.current / progress.total) * 100);
          console.log(`[${percentage}%] ${progress.file} - ${progress.status}`);
        }
      );

      console.log(`\n📊 Results:`);
      console.log(`✅ Successful: ${results.successful}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log(`📁 Total: ${results.successful + results.failed}\n`);

      // Для машин-ориентированного использования
      if (process.env.JSON_OUTPUT === '1') {
        console.log(JSON.stringify(results, null, 2));
      }

      process.exit(results.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async uploadFile(filePath, repo, branch = 'main', remoteDir = '') {
    try {
      const sdk = new PopApiSDK({
        token: this.config.token,
        username: this.config.username,
        repo: repo || this.config.defaultRepo
      });

      console.log(`\n📤 Uploading file: ${filePath}`);

      const result = await sdk.uploadFile(filePath, repo, branch, remoteDir);

      console.log(`✅ Success!\n`);
      console.log(`File: ${result.file}`);
      console.log(`URL: https://github.com/${this.config.username}/${repo}/blob/${branch}/${result.file}\n`);

      if (process.env.JSON_OUTPUT === '1') {
        console.log(JSON.stringify(result, null, 2));
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
╔════════════════════════════════════╗
║       popApi CLI v1.0.0-beta       ║
║   GitHub Batch Upload Tool         ║
╚════════════════════════════════════╝

USAGE:
  popapi setup                                  Setup GitHub credentials
  popapi push <path> <repo> [branch]            Upload files to GitHub
  popapi file <file> <repo> [branch] [dir]      Upload single file
  popapi help                                   Show this help

ENVIRONMENT VARIABLES (для AI и скриптов):
  GITHUB_TOKEN          GitHub Personal Access Token
  GITHUB_USERNAME       GitHub username
  GITHUB_REPO           Default repository
  JSON_OUTPUT           Set to '1' for JSON output

EXAMPLES:

  1. Interactive setup:
     popapi setup

  2. Upload with environment variables (для AI):
     export GITHUB_TOKEN="ghp_..."
     export GITHUB_USERNAME="john"
     popapi push ./src my-repo main

  3. Upload single file:
     popapi file ./README.md my-repo main

  4. Upload to specific directory:
     popapi file ./app.js my-repo main src/

  5. JSON output (для programmatic use):
     JSON_OUTPUT=1 popapi push ./files my-repo | jq .

CONFIGURATION:
  Credentials stored in: ~/.popapi/config.json
  Priority: Env Vars > Config File

SECURITY:
  ✅ Token stored locally only
  ✅ Never shared or logged
  ✅ Use .gitignore protection
  ✅ Rotate tokens regularly

WEB INTERFACE:
  popapi web              Start web UI on http://localhost:3000

DOCUMENTATION:
  Read more at: https://github.com/yourusername/popapi
    `);
  }
}

async function main() {
  const cli = new PopApiCLI();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        await cli.setup();
        break;

      case 'push':
        if (args.length < 2) {
          console.log('❌ Usage: popapi push <path> <repo> [branch]');
          process.exit(1);
        }
        await cli.uploadFiles(args[1], args[2], args[3] || 'main');
        break;

      case 'file':
        if (args.length < 2) {
          console.log('❌ Usage: popapi file <file> <repo> [branch] [directory]');
          process.exit(1);
        }
        await cli.uploadFile(args[1], args[2], args[3] || 'main', args[4] || '');
        break;

      case 'web':
        console.log('Starting popApi Web UI...');
        require('./server.js');
        break;

      case 'help':
      case '--help':
      case '-h':
        cli.showHelp();
        break;

      default:
        if (command) {
          console.log(`❌ Unknown command: ${command}`);
          console.log('Run "popapi help" for usage information\n');
        }
        cli.showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
