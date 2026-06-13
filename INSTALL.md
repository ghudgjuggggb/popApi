# Installation Guide

Multiple ways to install popApi

## Option 1: npm (Recommended)

```bash
npm install -g popapi
```

Then use anywhere:
```bash
popapi setup
popapi push ./files my-repo
```

## Option 2: Clone from GitHub

```bash
git clone https://github.com/ghudgjuggggb/popapi.git
cd popapi
npm install
npm start
```

Open: http://localhost:3000

## Option 3: Docker

```bash
docker run -p 3000:3000 ghudgjuggggb/popapi
```

## Requirements

- Node.js 12.0.0 or higher
- npm 6.0.0 or higher
- GitHub account (for uploading)
- GitHub token (Personal Access Token)

## Get GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Name it: "popApi"
4. Select scope: "repo"
5. Click "Generate token"
6. Copy it immediately

## Platform-Specific

### Windows

```bash
# Via npm
npm install -g popapi

# Via Git Bash / PowerShell
npm install -g popapi
```

### macOS

```bash
# Via npm
npm install -g popapi

# Via Homebrew (if available)
brew install popapi
```

### Linux

```bash
# Ubuntu/Debian
npm install -g popapi

# Or via package manager
apt-get install popapi  # if available
```

### Termux (Android)

```bash
pkg install nodejs npm
npm install -g popapi
```

## Verify Installation

```bash
popapi help
node web.js
npm start
```

Should show version and help text.

## Troubleshooting

### "command not found: popapi"

```bash
# Check npm global path
npm config get prefix

# Add to PATH if needed
export PATH=$(npm config get prefix)/bin:$PATH

# Or reinstall
npm install -g popapi
```

### "Cannot find module"

```bash
npm install
```

### Port 3000 in use

```bash
PORT=8080 npm start
```

### Permission denied

```bash
sudo npm install -g popapi
```

## Update

```bash
npm update -g popapi
```

## Uninstall

```bash
npm uninstall -g popapi
```

## Next Steps

1. Run `popapi setup`
2. Enter GitHub token
3. Run `popapi push ./files my-repo`

See [QUICKSTART.md](QUICKSTART.md) for more.
