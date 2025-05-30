# To-dos

- [ ] Try this command

```bash
# Build and start all services
docker-compose up --build

# To run in detached mode (background)
docker-compose up -d --build

# To stop all services
docker-compose down

# To stop and remove volumes (including MongoDB data)
docker-compose down -v

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Stop production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```
