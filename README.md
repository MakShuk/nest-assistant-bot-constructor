# Nest Assistant Bot Constructor 🤖

<p align="right">
  <a href="README.ru.md"><img src="https://img.shields.io/badge/Русский-red?style=for-the-badge&logo=github" alt="Русский"></a>
</p>

![License](https://img.shields.io/badge/license-MIT-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![OpenAI](https://img.shields.io/badge/OpenAI-API-green)
![Telegram](https://img.shields.io/badge/Telegram-Bot-blue)

A powerful NestJS-based constructor for creating AI assistant bots that integrate with Telegram and OpenAI.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [License](#license)

## Features

- 🤖 Create and manage AI assistants using OpenAI API
- 💬 Seamless Telegram bot integration
- 🗄️ Advanced vector store support for efficient data retrieval
- 📁 File management system
- 🔄 Thread management for conversations
- 🔐 Built-in authentication and user management
- 🎯 RESTful API endpoints
- 📊 Prisma ORM for database operations

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12 or higher
- OpenAI API key
- Telegram Bot Token
- Docker (optional, for containerization)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd nest-assistant-bot-constructor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file and configure your variables
cp .env.example .env
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- [Other configuration variables]

### OpenAI Configuration

Configure OpenAI settings in `src/configs/openai.config.ts`.

### Telegram Configuration

Configure Telegram bot settings in `src/configs/telegram.config.ts`.

## Usage

### Creating a New Assistant

```typescript
// Example of creating an assistant
POST /assistants
{
  "name": "MyAssistant",
  "model": "gpt-4",
  "instructions": "You are a helpful assistant..."
}
```

### Managing Conversations

```typescript
// Start a new conversation thread
POST /threads
{
  "assistantId": "your-assistant-id"
}
```

## API Documentation

The API includes several modules:

- `/assistants` - Manage AI assistants
- `/threads` - Handle conversation threads
- `/files` - File management operations
- `/users` - User management
- `/vector-stores` - Vector storage operations

For detailed API documentation, run the server and visit `/api` endpoint.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.