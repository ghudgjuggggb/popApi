/**
 * popApi Webhook System v1.0.0-beta
 * 
 * Отправляет уведомления при успешной/неудачной загрузке
 * Поддерживает: Discord, Slack, Telegram, Custom HTTP
 */

const https = require('https');
const http = require('http');

class WebhookManager {
  constructor(config = {}) {
    this.webhooks = config.webhooks || [];
  }

  /**
   * Добавить webhook
   * @param {Object} webhook - Конфигурация webhook
   */
  addWebhook(webhook) {
    if (!webhook.url) {
      throw new Error('Webhook URL is required');
    }

    this.webhooks.push({
      id: Math.random().toString(36).substr(2, 9),
      ...webhook
    });
  }

  /**
   * Получить все webhooks
   */
  getWebhooks() {
    return this.webhooks;
  }

  /**
   * Удалить webhook
   */
  removeWebhook(id) {
    this.webhooks = this.webhooks.filter(w => w.id !== id);
  }

  /**
   * Отправить notification при загрузке
   */
  async notifyUpload(data) {
    const promises = this.webhooks.map(webhook => 
      this._sendWebhook(webhook, {
        type: 'upload',
        ...data,
        timestamp: new Date().toISOString()
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Отправить notification об ошибке
   */
  async notifyError(data) {
    const promises = this.webhooks.map(webhook =>
      this._sendWebhook(webhook, {
        type: 'error',
        ...data,
        timestamp: new Date().toISOString()
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Отправить webhook
   */
  async _sendWebhook(webhook, payload) {
    // Форматировать payload в зависимости от типа
    const formattedPayload = this._formatPayload(webhook.type, payload);

    return new Promise((resolve, reject) => {
      const urlObj = new URL(webhook.url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'popApi-Webhook/1.0.0',
          ...webhook.headers
        }
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(formattedPayload));
      req.end();
    });
  }

  /**
   * Форматировать payload для разных сервисов
   */
  _formatPayload(type, payload) {
    switch (type) {
      case 'discord':
        return this._formatDiscord(payload);
      case 'slack':
        return this._formatSlack(payload);
      case 'telegram':
        return this._formatTelegram(payload);
      default:
        return payload;
    }
  }

  /**
   * Discord webhook format
   */
  _formatDiscord(data) {
    const color = data.type === 'error' ? 0xFF0000 : 0x00FF00;
    
    return {
      embeds: [{
        title: `popApi ${data.type.toUpperCase()}`,
        description: `Repository: **${data.repo}** (${data.branch})`,
        color: color,
        fields: [
          {
            name: '✅ Successful',
            value: String(data.successful || 0),
            inline: true
          },
          {
            name: '❌ Failed',
            value: String(data.failed || 0),
            inline: true
          },
          {
            name: 'Total Files',
            value: String(data.filesCount || 0),
            inline: true
          }
        ],
        timestamp: data.timestamp
      }]
    };
  }

  /**
   * Slack webhook format
   */
  _formatSlack(data) {
    const color = data.type === 'error' ? 'danger' : 'good';

    return {
      attachments: [{
        color: color,
        title: `popApi ${data.type.toUpperCase()}`,
        text: `Repository: *${data.repo}* (${data.branch})`,
        fields: [
          {
            title: '✅ Successful',
            value: String(data.successful || 0),
            short: true
          },
          {
            title: '❌ Failed',
            value: String(data.failed || 0),
            short: true
          },
          {
            title: 'Total Files',
            value: String(data.filesCount || 0),
            short: true
          }
        ],
        ts: Math.floor(new Date(data.timestamp).getTime() / 1000)
      }]
    };
  }

  /**
   * Telegram webhook format
   */
  _formatTelegram(data) {
    const emoji = data.type === 'error' ? '❌' : '✅';
    const message = `
${emoji} *popApi ${data.type.toUpperCase()}*

*Repository:* ${data.repo} (${data.branch})
*Successful:* ${data.successful || 0}
*Failed:* ${data.failed || 0}
*Total:* ${data.filesCount || 0}
    `.trim();

    return {
      text: message,
      parse_mode: 'Markdown'
    };
  }
}

// === Примеры использования ===

// Discord
const webhookManager = new WebhookManager();

webhookManager.addWebhook({
  type: 'discord',
  url: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN'
});

webhookManager.addWebhook({
  type: 'slack',
  url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
});

webhookManager.addWebhook({
  type: 'telegram',
  url: 'https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage',
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Использование
async function example() {
  // Уведомить об успешной загрузке
  await webhookManager.notifyUpload({
    repo: 'my-project',
    branch: 'main',
    filesCount: 10,
    successful: 10,
    failed: 0
  });

  // Уведомить об ошибке
  await webhookManager.notifyError({
    repo: 'my-project',
    branch: 'main',
    error: 'Authentication failed',
    message: 'Invalid GitHub token'
  });
}

module.exports = WebhookManager;
