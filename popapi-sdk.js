/**
 * popApi SDK v1.0.0-beta
 * Используйте этот файл для встраивания popApi в ваши проекты
 * 
 * Пример использования:
 * const PopApi = require('./popapi-sdk');
 * const api = new PopApi({
 *   token: 'ghp_...',
 *   username: 'john',
 *   repo: 'my-repo'
 * });
 * 
 * api.upload('./files', 'my-repo', 'main')
 *   .then(() => console.log('Success!'))
 *   .catch(err => console.error(err));
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class PopApiSDK {
  /**
   * Инициализация SDK
   * @param {Object} config - Конфигурация
   * @param {string} config.token - GitHub token (или переменная окружения GITHUB_TOKEN)
   * @param {string} config.username - GitHub username (или GITHUB_USERNAME)
   * @param {string} config.repo - Default repository (опционально, или GITHUB_REPO)
   */
  constructor(config = {}) {
    this.token = config.token || process.env.GITHUB_TOKEN;
    this.username = config.username || process.env.GITHUB_USERNAME;
    this.repo = config.repo || process.env.GITHUB_REPO;

    if (!this.token || !this.username) {
      throw new Error('GitHub token and username are required. Set via config or env variables.');
    }
  }

  /**
   * Загрузить файлы в репозиторий
   * @param {string} dirPath - Путь к папке с файлами
   * @param {string} repo - Название репозитория (опционально, использует default)
   * @param {string} branch - Ветка (default: main)
   * @param {Function} onProgress - Callback для отслеживания прогресса
   * @returns {Promise}
   */
  async upload(dirPath, repo = null, branch = 'main', onProgress = null) {
    repo = repo || this.repo;
    
    if (!repo) {
      throw new Error('Repository name is required');
    }

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Path not found: ${dirPath}`);
    }

    const files = this._getFilesRecursive(dirPath);
    
    if (files.length === 0) {
      throw new Error('No files found');
    }

    const results = {
      successful: 0,
      failed: 0,
      files: []
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        await this._uploadFile(file, repo, branch);
        results.successful++;
        results.files.push({
          name: file.relativePath,
          status: 'success'
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            file: file.relativePath,
            status: 'success'
          });
        }
      } catch (error) {
        results.failed++;
        results.files.push({
          name: file.relativePath,
          status: 'failed',
          error: error.message
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            file: file.relativePath,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Загрузить один файл
   * @param {string} filePath - Путь к файлу
   * @param {string} repo - Репозиторий
   * @param {string} branch - Ветка
   * @param {string} remoteDir - Удаленная папка (опционально)
   * @returns {Promise}
   */
  async uploadFile(filePath, repo = null, branch = 'main', remoteDir = '') {
    repo = repo || this.repo;
    
    if (!repo) {
      throw new Error('Repository name is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileName = path.basename(filePath);
    const remotePath = remoteDir ? `${remoteDir}/${fileName}` : fileName;

    const file = {
      fullPath: filePath,
      relativePath: remotePath
    };

    await this._uploadFile(file, repo, branch);
    
    return {
      file: remotePath,
      status: 'success'
    };
  }

  /**
   * Получить информацию о репозитории
   * @param {string} repo - Репозиторий
   * @returns {Promise}
   */
  async getRepo(repo = null) {
    repo = repo || this.repo;
    
    if (!repo) {
      throw new Error('Repository name is required');
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.username}/${repo}`,
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'popApi-SDK/1.0.0'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Failed to get repo info: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Получить список файлов в репозитории
   * @param {string} repo - Репозиторий
   * @param {string} path - Путь в репозитории
   * @param {string} branch - Ветка
   * @returns {Promise}
   */
  async listFiles(repo = null, path = '', branch = 'main') {
    repo = repo || this.repo;
    
    if (!repo) {
      throw new Error('Repository name is required');
    }

    return new Promise((resolve, reject) => {
      const filePath = path ? `${path}` : '';
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.username}/${repo}/contents/${filePath}?ref=${branch}`,
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'popApi-SDK/1.0.0'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Failed to list files: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Проверить, существует ли файл в репозитории
   * @param {string} filePath - Путь к файлу
   * @param {string} repo - Репозиторий
   * @param {string} branch - Ветка
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath, repo = null, branch = 'main') {
    repo = repo || this.repo;
    
    if (!repo) {
      throw new Error('Repository name is required');
    }

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.username}/${repo}/contents/${filePath}?ref=${branch}`,
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'popApi-SDK/1.0.0'
        }
      };

      const req = https.request(options, (res) => {
        resolve(res.statusCode === 200);
        res.resume(); // Consume response to free up memory
      });

      req.on('error', () => resolve(false));
      req.end();
    });
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===

  _getFilesRecursive(dirPath) {
    let files = [];
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (item.startsWith('.')) continue;

      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(this._getFilesRecursive(fullPath));
      } else {
        files.push({
          fullPath,
          relativePath: path.relative(dirPath, fullPath).replace(/\\/g, '/')
        });
      }
    }

    return files;
  }

  _uploadFile(file, repo, branch) {
    return new Promise((resolve, reject) => {
      const content = fs.readFileSync(file.fullPath);
      const base64Content = content.toString('base64');
      const filePath = file.relativePath.replace(/\\/g, '/');

      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.username}/${repo}/contents/${filePath}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/vnd.github.v3+json',
          'User-Agent': 'popApi-SDK/1.0.0'
        }
      };

      const data = JSON.stringify({
        message: `Upload ${path.basename(file.fullPath)} via popApi`,
        content: base64Content,
        branch: branch
      });

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 201 || res.statusCode === 200) {
            resolve();
          } else {
            try {
              const err = JSON.parse(body);
              reject(new Error(err.message || `HTTP ${res.statusCode}`));
            } catch (e) {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = PopApiSDK;
