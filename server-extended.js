#!/usr/bin/env node

/**
 * popApi Server v1.0.0-beta
 * 
 * REST API сервер для загрузки файлов на GitHub
 * Поддерживает webhooks, AI интеграции и более
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== КОНФИГУРАЦИЯ =====
const CONFIG_DIR = path.join(os.homedir(), '.popapi');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const UPLOAD_DIR = path.join(CONFIG_DIR, 'uploads');
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json');
const WEBHOOKS_FILE = path.join(CONFIG_DIR, 'webhooks.json');

// Создание директорий
[CONFIG_DIR, UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ===== КЛАССЫ =====

class ConfigManager {
  loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return config;
  }

  getConfig() {
    const config = this.loadConfig();
    return {
      ...config,
      token: config.token ? '***' + config.token.slice(-4) : ''
    };
  }

  validateConfig() {
    const config = this.loadConfig();
    return config.token && config.username;
  }
}

class WebhookManager {
  loadWebhooks() {
    if (fs.existsSync(WEBHOOKS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  saveWebhooks(webhooks) {
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
    return webhooks;
  }

  async notifyUpload(data) {
    const webhooks = this.loadWebhooks();
    
    for (const webhook of webhooks) {
      if (!webhook.enabled) continue;
      
      this._sendWebhook(webhook, {
        event: 'upload.success',
        ...data,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Webhook error:', err));
    }
  }

  async notifyError(data) {
    const webhooks = this.loadWebhooks();
    
    for (const webhook of webhooks) {
      if (!webhook.enabled) continue;
      
      this._sendWebhook(webhook, {
        event: 'upload.error',
        ...data,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Webhook error:', err));
    }
  }

  _sendWebhook(webhook, payload) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(webhook.url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : require('http');

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'popApi-Server/1.0.0',
          ...webhook.headers
        },
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve());
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Webhook timeout'));
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }
}

class GitHubUploader {
  constructor(config) {
    this.config = config;
  }

  uploadFile(file, repo, branch = 'main') {
    return new Promise((resolve, reject) => {
      if (!this.config.token || !this.config.username) {
        reject(new Error('Not configured'));
        return;
      }

      const content = fs.readFileSync(file.fullPath);
      const base64Content = content.toString('base64');
      const filePath = file.relativePath.replace(/\\/g, '/');

      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.config.username}/${repo}/contents/${filePath}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/vnd.github.v3+json',
          'User-Agent': 'popApi-Server/1.0.0'
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

  getFilesRecursive(dirPath) {
    let files = [];

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Path not found: ${dirPath}`);
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      if (item.startsWith('.')) continue;

      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files = files.concat(this.getFilesRecursive(fullPath));
      } else {
        files.push({
          fullPath,
          relativePath: path.relative(dirPath, fullPath)
        });
      }
    }

    return files;
  }
}

class HistoryManager {
  static loadHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  static saveEntry(entry) {
    const history = this.loadHistory();
    history.unshift({
      ...entry,
      timestamp: new Date().toISOString()
    });
    const limited = history.slice(0, 100);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limited, null, 2));
    return entry;
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
const configManager = new ConfigManager();
const webhookManager = new WebhookManager();

// ===== API ENDPOINTS =====

// GET /api/config
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: configManager.getConfig(),
    isConfigured: configManager.validateConfig()
  });
});

// POST /api/config
app.post('/api/config', (req, res) => {
  try {
    const { token, username, defaultRepo } = req.body;

    if (!token || !username) {
      return res.status(400).json({
        success: false,
        error: 'Token and username required'
      });
    }

    const config = configManager.saveConfig({ token, username, defaultRepo });

    res.json({
      success: true,
      message: 'Configuration saved',
      config: configManager.getConfig()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/config
app.delete('/api/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    res.json({
      success: true,
      message: 'Configuration cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/upload
app.post('/api/upload', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const { repo, branch = 'main' } = req.body;

    if (!repo) {
      return res.status(400).json({
        success: false,
        error: 'Repository name required'
      });
    }

    if (!configManager.validateConfig()) {
      return res.status(400).json({
        success: false,
        error: 'Not configured'
      });
    }

    const config = configManager.loadConfig();
    const uploader = new GitHubUploader(config);
    const uploadedFiles = [];
    const failedFiles = [];

    for (const file of req.files) {
      try {
        await uploader.uploadFile(
          { fullPath: file.path, relativePath: file.originalname },
          repo,
          branch
        );
        uploadedFiles.push(file.originalname);
      } catch (error) {
        failedFiles.push({ file: file.originalname, error: error.message });
      }
    }

    // Сохранить в историю
    HistoryManager.saveEntry({
      type: 'upload',
      repo,
      branch,
      filesCount: req.files.length,
      successful: uploadedFiles.length,
      failed: failedFiles.length
    });

    // Отправить webhook
    await webhookManager.notifyUpload({
      repo,
      branch,
      filesCount: req.files.length,
      successful: uploadedFiles.length,
      failed: failedFiles.length
    });

    // Удалить файлы
    req.files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // Ignore
      }
    });

    res.json({
      success: failedFiles.length === 0,
      uploadedFiles,
      failedFiles,
      summary: {
        total: req.files.length,
        successful: uploadedFiles.length,
        failed: failedFiles.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/history
app.get('/api/history', (req, res) => {
  try {
    const history = HistoryManager.loadHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history/:id
app.get('/api/history/:id', (req, res) => {
  try {
    const history = HistoryManager.loadHistory();
    const entry = history.find((_, i) => i == req.params.id);
    
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    
    res.json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    version: '1.0.0-beta',
    configured: configManager.validateConfig(),
    uptime: process.uptime()
  });
});

// GET /api/webhooks
app.get('/api/webhooks', (req, res) => {
  try {
    const webhooks = webhookManager.loadWebhooks();
    res.json({
      success: true,
      webhooks: webhooks.map(w => ({
        ...w,
        url: w.url ? w.url.substring(0, 20) + '...' : 'N/A'
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/webhooks
app.post('/api/webhooks', (req, res) => {
  try {
    const { url, type = 'custom', headers = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL required'
      });
    }

    const webhooks = webhookManager.loadWebhooks();
    const id = Math.random().toString(36).substr(2, 9);
    
    webhooks.push({
      id,
      url,
      type,
      headers,
      enabled: true,
      createdAt: new Date().toISOString()
    });

    webhookManager.saveWebhooks(webhooks);

    res.json({
      success: true,
      webhook: { id, url, type }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/webhooks/:id
app.delete('/api/webhooks/:id', (req, res) => {
  try {
    const webhooks = webhookManager.loadWebhooks();
    const filtered = webhooks.filter(w => w.id !== req.params.id);
    
    webhookManager.saveWebhooks(filtered);

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ВЕБ ИНТЕРФЕЙС =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║     popApi Server v1.0.0-beta      ║
║   GitHub Batch Upload Tool         ║
╚════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}
📁 Config directory: ${CONFIG_DIR}

📊 API Endpoints:
   GET    /api/config           - Get configuration
   POST   /api/config           - Save configuration
   DELETE /api/config           - Clear configuration
   POST   /api/upload           - Upload files
   GET    /api/history          - Get upload history
   GET    /api/status           - Server status
   GET    /api/webhooks         - List webhooks
   POST   /api/webhooks         - Add webhook
   DELETE /api/webhooks/:id     - Remove webhook

🌐 Web UI:
   http://localhost:${PORT}

📚 Documentation:
   See README.md and API-FOR-AI-AND-SCRIPTS.md

🛑 Press Ctrl+C to stop
  `);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Server stopped');
  process.exit(0);
});
