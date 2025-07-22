# 🛠️ DevKit

A comprehensive collection of shell scripts for managing fullstack development
environments, databases, and Docker setups.

## 📦 Features

- 🗄️ **Database Management**: Backup, restore, migrations, and initialization
  scripts
- 🐳 **Docker Utilities**: Container management, cleanup, and environment setup
- 🚀 **Development Tools**: Environment setup, project initialization
- 📋 **Project Templates**: Quick-start templates for various tech stacks

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/teo-garcia/devkit.git

# Make scripts executable
chmod +x scripts/**/*.sh

# View available commands
./scripts/dev/help.sh
```

## 📂 Structure

```
devkit/
├── scripts/           # Core utility scripts
│   ├── db/           # Database management
│   ├── docker/       # Docker operations
│   └── dev/          # Development utilities
└── templates/        # Project templates
    ├── nest/         # NestJS templates
    ├── next/         # Next.js templates
    └── more...       # Additional templates
```

## 🗄️ Database Scripts

- `backup.sh`: Create and manage database backups
- `init-db.sh`: Initialize databases with proper permissions
- `migrate.sh`: Manage database migrations
- `restore.sh`: Restore databases from backups

## 🐳 Docker Scripts

- `docker.sh`: Docker-compose wrapper with common commands
- `prune.sh`: Clean up Docker resources

## 🛠️ Development Scripts

- `env-setup.sh`: Configure development environments
- `setup.sh`: Project initialization and dependencies
- `start.sh`: Start development services
- `stop.sh`: Stop development services

## 📋 Templates

The `templates/` directory contains starter templates for various tech stacks:

- NestJS monolith setup
- Next.js frontend setup
- More templates coming soon...

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
