# Contributing to ProjectHub

First off, thank you for considering contributing to ProjectHub! It's people like you that make this project better for everyone.

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots or animated GIFs if helpful**
- **Include your environment details** (OS, browser, Python/Node versions)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these issues:

- `good first issue` - issues that are good for newcomers
- `help wanted` - issues that need attention
- `bug` - known bugs that need fixing
- `enhancement` - feature requests and improvements

## 💻 Development Setup

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git
- A code editor (VS Code recommended)

### Setting Up Your Development Environment

1. **Fork and Clone the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/project_management.git
   cd project_management
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/mostakimjihad/project_management.git
   ```

3. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate it
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Install pre-commit hooks (optional)
   pip install pre-commit
   pre-commit install
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   
   # Install dependencies
   npm install
   ```

5. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app.main:app --reload
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 📏 Coding Standards

### Python (Backend)

- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints for function parameters and return values
- Write docstrings for all public modules, functions, classes, and methods
- Keep functions focused and small (max ~50 lines)
- Use meaningful variable and function names

```python
# Good Example
async def get_user_by_id(user_id: str, db: AsyncSession) -> Optional[User]:
    """
    Retrieve a user by their unique identifier.
    
    Args:
        user_id: The unique identifier of the user
        db: Database session for query execution
        
    Returns:
        User object if found, None otherwise
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

### TypeScript/React (Frontend)

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use meaningful component and variable names
- Keep components focused and reusable
- Follow the existing file structure

```typescript
// Good Example
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### CSS

- Use CSS variables for consistent styling
- Follow BEM naming convention for classes
- Keep styles scoped to components when possible
- Ensure responsive design

## 📝 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```
feat(auth): add password reset functionality
fix(tasks): resolve task assignment bug
docs(readme): update installation instructions
style(dashboard): improve button spacing
refactor(api): simplify project listing logic
```

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with Upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Ensure all tests pass
   - Update documentation if needed

4. **Test Your Changes**
   ```bash
   # Backend tests
   cd backend
   pytest
   
   # Frontend build check
   cd ../frontend
   npm run build
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. Go to GitHub and open a Pull Request
2. Fill in the PR template completely
3. Link any related issues
4. Request review from maintainers

### PR Requirements

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New features have corresponding tests
- [ ] Documentation is updated
- [ ] Commit messages follow our guidelines
- [ ] PR description is clear and complete

### Review Process

1. At least one maintainer must approve your PR
2. All CI checks must pass
3. No merge conflicts with the main branch
4. Address all review comments

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                    # Run all tests
pytest tests/test_auth.py # Run specific test file
pytest -v                 # Verbose output
pytest --cov=app          # With coverage
```

### Frontend Tests

```bash
cd frontend
npm run test              # Run all tests
npm run test:coverage     # With coverage
```

## 📚 Documentation

When adding new features, please update:

- **README.md** - If it affects setup or usage
- **API Documentation** - For new/modified endpoints
- **Code Comments** - For complex logic
- **Type Definitions** - For new TypeScript types

## 🏷 Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Improvements or additions to documentation |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention is needed |
| `priority: high` | Needs immediate attention |
| `priority: low` | Nice to have |

## ❓ Questions?

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions

## 🙏 Thank You!

Thank you for taking the time to contribute! Your efforts help make ProjectHub better for everyone.

---

*This contributing guide is inspired by best practices from open-source communities.*