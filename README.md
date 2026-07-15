# UBUKHOSI

UBUKHOSI is a production-ready MVP platform for kingdom governance, land administration, court management, livestock oversight, and community registry operations.

## Features
- Authentication and RBAC-ready seeded accounts
- Executive dashboard with demo summary metrics
- Court, land, livestock, and community registry CRUD APIs
- GraphQL endpoint
- Docker and Kubernetes deployment assets
- Investor demo mode with seeded sample data

## Quick Start
```bash
npm install
npm run build
npm test
npm start
```

## Demo Accounts
- Super Administrator: super.admin@ubukhosi.gov / changeme
- King: king@ubukhosi.gov / changeme
- Chief: chief@ubukhosi.gov / changeme
- Court Clerk: clerk@ubukhosi.gov / changeme
- Land Officer: land@ubukhosi.gov / changeme
- Veterinary Officer: vet@ubukhosi.gov / changeme
- Community Officer: community@ubukhosi.gov / changeme
- Investor: investor@ubukhosi.gov / changeme

## Deployment
- Docker: docker compose up --build
- Kubernetes: kubectl apply -f k8s/deployment.yaml

## Documentation
- Architecture: docs/architecture.md
- ER diagram: docs/er-diagram.md
- API docs: docs/api.md
- Deployment guide: docs/deployment.md
- Security guide: docs/security.md
- Environment variables: docs/environment.md
