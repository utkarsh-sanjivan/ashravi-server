# Node.js Server - Layered Architecture

A comprehensive, production-ready Node.js server built with Express.js following a clean layered architecture pattern. This implementation demonstrates enterprise-level best practices for building scalable, maintainable, and secure web applications.

## 🏗️ Architecture Overview

This project follows a **layered architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│                Routes                   │ ← HTTP endpoints & middleware
├─────────────────────────────────────────┤
│              Controllers                │ ← Request/Response handling
├─────────────────────────────────────────┤
│               Services                  │ ← Business logic
├─────────────────────────────────────────┤
│                Models                   │ ← Data models & database
├─────────────────────────────────────────┤
│              Middleware                 │ ← Cross-cutting concerns
├─────────────────────────────────────────┤
│             Validations                 │ ← Input validation schemas
└─────────────────────────────────────────┘
```

### Layer Responsibilities

- **Routes**: Define HTTP endpoints, apply middleware, parameter validation
- **Controllers**: Handle HTTP requests/responses, delegate to services
- **Services**: Contain business logic, coordinate between models
- **Models**: Data persistence layer with Mongoose ODM
- **Middleware**: Authentication, error handling, logging, security
- **Validations**: Input validation schemas and sanitization

## ✨ Features

### 🛡️ Security
- JWT-based authentication with refresh tokens
- Role-based authorization (User, Admin, Moderator)
- Input validation and sanitization
- Rate limiting with express-rate-limit
- Security headers with Helmet
- CORS configuration
- Password hashing with bcrypt
- XSS protection

### 🚀 Performance
- Response compression
- Redis caching support
- Database connection pooling
- Efficient database queries with indexes
- Pagination for large datasets
- Request/response optimization

### 🏗️ Architecture
- Clean layered architecture
- Dependency injection
- Error handling with custom error classes
- Comprehensive logging with Winston
- Health check endpoints
- Graceful shutdown handling

### 📚 API Features
- RESTful API design
- API versioning (/api/v1/)
- Swagger/OpenAPI 3.0 documentation
- Request/response logging
- API usage statistics

### 🧪 Testing
- Unit tests with Jest
- Integration tests with Supertest
- Test coverage reporting
- In-memory database for testing
- Test utilities and helpers

### 🐳 DevOps
- Docker containerization
- Docker Compose for development
- Nginx reverse proxy configuration
- Environment-based configuration
- Health monitoring
- Structured logging

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- AWS account with DynamoDB permissions (tables provided via env)
- Redis >= 6.0 (optional)
- Docker & Docker Compose (optional)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd nodejs-server-layered
npm install
```

2. **Configure environment variables:**
   - Set `AWS_REGION`, table names (`PARENTS_TABLE_NAME`, `CHILDREN_TABLE_NAME`, `COURSES_TABLE_NAME`, `COURSE_PROGRESS_TABLE_NAME`, `INSTRUCTORS_TABLE_NAME`, `QUESTIONS_TABLE_NAME`, `OTPS_TABLE_NAME`, `CHILD_EDUCATION_TABLE_NAME`, `CHILD_NUTRITION_TABLE_NAME`), `JWT_SECRET`, mail/SMS creds, CORS settings, etc.

3. **Start development server:**
```bash
npm run dev
```

The server will start on http://localhost:3000

### Using Docker

1. **Start with Docker Compose:**
```bash
docker-compose up -d
```

This will start:
- Node.js application (port 3000)
- DynamoDB connectivity via configured AWS credentials/role (no local MongoDB)
- Nginx reverse proxy (port 80)

## 📖 API Documentation

Visit http://localhost:3000/api/v1/docs for interactive API documentation (Swagger UI).

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout user

#### User Management (Admin/Moderator)
- `GET /api/v1/users` - List users with pagination
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)
- `GET /api/v1/users/stats` - User statistics (Admin only)
- `GET /api/v1/users/search` - Search users
- `PATCH /api/v1/users/bulk-update` - Bulk update users
- `GET /api/v1/users/export` - Export user data

#### System
- `GET /health-check` - Health check
- `GET /ready` - Readiness probe (Kubernetes)
- `GET /live` - Liveness probe (Kubernetes)
- `GET /api/v1` - API information

## 🛠️ Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only  
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Project Structure

```
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB configuration
│   │   └── redis.js         # Redis configuration
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # Authentication middleware
│   │   └── errorHandler.js  # Error handling
│   ├── models/              # Database models
│   │   └── User.js          # User model
│   ├── routes/              # Route definitions
│   │   ├── index.js         # Main routes
│   │   ├── auth.js          # Auth routes
│   │   └── users.js         # User routes
│   ├── services/            # Business logic layer
│   │   ├── authService.js   # Authentication service
│   │   └── userService.js   # User service
│   ├── validations/         # Input validation
│   │   ├── authValidation.js
│   │   ├── userValidation.js
│   │   └── commonValidation.js
│   ├── utils/               # Utility functions
│   │   └── logger.js        # Logging utility
│   └── server.js            # Main server file
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── setup.js             # Test configuration
├── nginx/                   # Nginx configuration
├── logs/                    # Application logs
├── docker-compose.yml       # Docker Compose config
├── Dockerfile              # Docker configuration
└── package.json            # Dependencies and scripts
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `AWS_REGION` | AWS region for DynamoDB | `us-east-1` |
| `PARENTS_TABLE_NAME` | DynamoDB table for parents | `parents` |
| `CHILDREN_TABLE_NAME` | DynamoDB table for children | `children` |
| `COURSES_TABLE_NAME` | DynamoDB table for courses | `courses` |
| `COURSE_PROGRESS_TABLE_NAME` | DynamoDB table for course progress | `course_progress` |
| `INSTRUCTORS_TABLE_NAME` | DynamoDB table for instructors | `instructors` |
| `QUESTIONS_TABLE_NAME` | DynamoDB table for questions | `questions` |
| `OTPS_TABLE_NAME` | DynamoDB table for OTPs | `otps` |
| `CHILD_EDUCATION_TABLE_NAME` | DynamoDB table for child education | `child_education` |
| `CHILD_NUTRITION_TABLE_NAME` | DynamoDB table for child nutrition | `child_nutrition` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SESSION_SECRET` | Session secret | Required |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

If your ECS run command expects an env file (for example `--env-file .env.staging.local`), copy the template and fill it with your staging values:

```bash
cp .env.staging.local.example .env.staging.local
```

The template is tracked for convenience; the actual `.env.staging.local` stays ignored so secrets are not committed.

### Database Configuration

The application uses MongoDB with Mongoose ODM. Key features:
- Connection pooling (max 10 connections)
- Automatic reconnection with exponential backoff
- Health monitoring
- Graceful shutdown
- Database indexes for performance

### Caching

Redis is used for:
- Session storage (optional)
- Caching frequently accessed data
- Rate limiting storage
- Temporary data storage

## 🧪 Testing

The project includes comprehensive testing:

### Unit Tests
- Service layer testing
- Model testing
- Utility function testing
- Mock external dependencies

### Integration Tests
- API endpoint testing
- Database integration testing
- Authentication flow testing
- Error handling testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch
```

## 📊 Monitoring & Logging

### Health Checks
- `/health-check` - Basic health status
- `/health-check/detailed` - Detailed system information
- `/ready` - Kubernetes readiness probe
- `/live` - Kubernetes liveness probe

### Logging
The application uses Winston for structured logging:
- Console logging (development)
- File logging (production)
- Log rotation and archival
- Different log levels (error, warn, info, debug)
- Request/response logging
- Security event logging
- Performance logging

### Monitoring Integration
Ready for integration with:
- Prometheus metrics
- Grafana dashboards
- ELK stack (Elasticsearch, Logstash, Kibana)
- New Relic or similar APM tools

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build production image
docker build -t nodejs-server-layered .

# Run with external databases
docker run -d \
  --name nodejs-server \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e AWS_REGION=us-east-1 \
  -e PARENTS_TABLE_NAME=parents \
  -e CHILDREN_TABLE_NAME=children \
  -e COURSES_TABLE_NAME=courses \
  -e COURSE_PROGRESS_TABLE_NAME=course_progress \
  -e INSTRUCTORS_TABLE_NAME=instructors \
  -e QUESTIONS_TABLE_NAME=questions \
  -e OTPS_TABLE_NAME=otps \
  -e CHILD_EDUCATION_TABLE_NAME=child_education \
  -e CHILD_NUTRITION_TABLE_NAME=child_nutrition \
  -e REDIS_URL=redis://your-redis-host:6379 \
  nodejs-server-layered
```

## 🔒 Security Considerations

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control
- Account lockout after failed attempts
- Password complexity requirements
- Secure password hashing (bcrypt)

### API Security  
- Rate limiting on all endpoints
- Special rate limiting on auth endpoints
- Input validation and sanitization
- XSS protection
- CORS configuration
- Security headers (Helmet)

### Infrastructure Security
- Non-root user in Docker containers
- Environment variable configuration
- Nginx reverse proxy with security headers
- SSL/TLS support ready
- Health check endpoints for monitoring

## 🚀 Production Deployment

### Prerequisites
- Node.js production environment
- MongoDB cluster/replica set
- Redis cluster (optional)
- Load balancer (Nginx, HAProxy, or cloud LB)
- Process manager (PM2, systemd, or container orchestration)

### Environment Setup
1. Set production environment variables
2. Configure database connection strings
3. Set up SSL certificates
4. Configure monitoring and logging
5. Set up backup procedures

### Deployment Steps
1. Build and test the application
2. Deploy to production servers
3. Run database migrations if needed
4. Update Nginx/load balancer configuration
5. Monitor application health
6. Set up log rotation and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Run tests and linting: `npm test && npm run lint`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Coding Standards
- Follow ESLint configuration
- Use Prettier for code formatting
- Write comprehensive tests
- Document new features
- Follow the established architecture patterns

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MongoDB team for the database
- Redis team for the caching solution
- Jest team for the testing framework
- All open-source contributors

---

**Made with ❤️ for enterprise-grade Node.js applications**
