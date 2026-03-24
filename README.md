# ProjectHub - Project Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.109+-green.svg)

A full-stack project management application built with FastAPI (backend) and React + TypeScript (frontend). This application helps teams manage projects, tasks, teams, costs, and risks efficiently.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with registration and login
- **Project Management** - Create, update, and track projects with status and priority
- **Task Management** - Manage tasks with assignments, deadlines, and progress tracking
- **Team Management** - Organize teams and assign members to projects
- **Cost Tracking** - Monitor project budgets and expenses
- **Risk Management** - Identify and mitigate project risks
- **Dashboard Analytics** - Visual overview of project statistics and metrics
- **Responsive Design** - Modern, responsive UI that works on all devices

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite/PostgreSQL** - Database support
- **JWT** - JSON Web Tokens for authentication
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icons
- **CSS3** - Modern CSS with variables

## 📁 Project Structure

```
project_management/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API route handlers
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── utils/           # Utility functions
│   │   ├── config.py        # Configuration settings
│   │   ├── database.py      # Database connection
│   │   ├── dependencies.py  # Dependency injection
│   │   └── main.py          # Application entry point
│   ├── requirements.txt     # Python dependencies
│   └── project_management.db
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities and API client
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
├── docs/                    # Documentation
├── memory-bank/             # Project memory
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mostakimjihad/project_management.git
   cd project_management
   ```

2. **Create a virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (optional)
   ```bash
   # Create .env file in backend directory
   cp .env.example .env
   ```

5. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🔐 Environment Variables

### Backend (.env)

```env
# Application
APP_NAME=Project Management API
APP_VERSION=1.0.0
DEBUG=True

# Database
DATABASE_URL=sqlite+aiosqlite:///./project_management.db
# For PostgreSQL: postgresql+asyncpg://user:password@localhost/dbname

# JWT Settings
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

## 📖 API Documentation

Once the backend server is running, you can access:

- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/openapi.json`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login and get tokens |
| `/api/auth/me` | GET | Get current user |
| `/api/projects` | GET, POST | List/Create projects |
| `/api/projects/{id}` | GET, PUT, DELETE | Project operations |
| `/api/tasks` | GET, POST | List/Create tasks |
| `/api/teams` | GET, POST | List/Create teams |
| `/api/costs` | GET, POST | List/Create costs |
| `/api/risks` | GET, POST | List/Create risks |
| `/api/dashboard/stats` | GET | Dashboard statistics |

## 🗄 Database Schema

The application uses the following main entities:

- **Users** - User accounts with roles (admin, manager, member)
- **Projects** - Project details with status and progress
- **Tasks** - Project tasks with assignments
- **Teams** - Team organization
- **Costs** - Project expenses and budgets
- **Risks** - Project risk tracking

For detailed schema information, see [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript strict mode for frontend
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Mostakim Jihad** - *Initial work* - [mostakimjihad](https://github.com/mostakimjihad)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the amazing frontend library
- All contributors who help improve this project

---

⭐ If you find this project useful, please give it a star!

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the maintainers

---

Made with ❤️ by the ProjectHub Team