# popApi 📦

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D12.0.0-green.svg)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/popapi.svg)](https://www.npmjs.com/package/popapi)

**Fast tool to upload files to GitHub via Web UI or CLI**

Simple. Clean. Fast. Open Source. ✨

## Features

✅ Web UI with drag & drop
✅ CLI for automation
✅ GitHub integration
✅ Multiple files support (up to 50)
✅ Windows, macOS, Linux, Termux
✅ Dark theme
✅ 100% Open Source (MIT License)

## Quick Start

```bash
npm install
npm start
```

Open: http://localhost:3000

## Usage

### Web UI
1. npm start
2. Go to http://localhost:3000
3. Upload files
4. Click "Upload to GitHub"

### CLI
```bash
popapi setup
popapi push ./files my-repo
popapi push ./build my-repo main
```

## Installation

```bash
npm install
npm install -g popapi
```

## Setup

Get GitHub token: https://github.com/settings/tokens

Run:
```bash
popapi setup
```

Enter:
- Token
- Username

Done! ✅

## Documentation

- [README.md](README.md) - Overview
- [QUICKSTART.md](QUICKSTART.md) - 5 minute guide
- [START.md](START.md) - Get started
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community rules
- [SECURITY.md](SECURITY.md) - Security policy
- [CHANGELOG.md](CHANGELOG.md) - Version history

## API

### REST Endpoints

```
GET    /api/config
POST   /api/config
GET    /api/files
POST   /api/upload
DELETE /api/files/:name
POST   /api/clear
POST   /api/github
GET    /api/download/:name
```

### CLI

```bash
popapi setup              # Setup credentials
popapi push <path> <repo> # Upload files
popapi help              # Show help
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

### How to contribute

1. Fork repository
2. Create branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Create Pull Request

## License

MIT License - see [LICENSE](LICENSE)

## Support

- Report bugs: [GitHub Issues](https://github.com/ghudgjuggggb/popapi/issues)
- Ask questions: [GitHub Discussions](https://github.com/ghudgjuggggb/popapi/discussions)
- Security: [SECURITY.md](SECURITY.md)

## Author

[@ghudgjuggggb](https://github.com/ghudgjuggggb)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)

---

Made with ❤️ for GitHub lovers

```bash
npm install popapi && npm start
```
