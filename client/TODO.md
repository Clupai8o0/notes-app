# To-Dos

- [ ] Try running this
```bash
# Build the image
docker build -t notes-app-client .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-api-url:5000 \
  notes-app-client
```