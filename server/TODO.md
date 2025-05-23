# To-Dos

- [ ] Setup tests
- [ ] Setup Docker
- [ ] Try this Docker command

```bash
# Build the image
docker build -t notes-app-server .

# Run the container
docker run -p 5000:5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  notes-app-server

# new
docker build --build-arg MONGODB_URI=$(grep MONGODB_URI .env | cut -d '=' -f2) \
  --build-arg JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2) \
  -t your-app-name .
docker build --build-arg MONGODB_URI=mongodb://your-uri \
  --build-arg JWT_SECRET=your-secret \
  -t your-app-name .
```
- [ ] Make sure mongoDB is running locally