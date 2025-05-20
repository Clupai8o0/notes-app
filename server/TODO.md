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
```
- [ ] Make sure mongoDB is running locally