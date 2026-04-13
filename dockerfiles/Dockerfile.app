# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend/asana-clone
COPY app/frontend/asana-clone/package.json ./
RUN npm install
COPY app/frontend/asana-clone/ ./
RUN rm -f package-lock.json && npm run build

# Stage 2: Python backend + serve built frontend
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./
COPY --from=frontend-build /app/frontend/asana-clone/dist ./frontend/dist

EXPOSE 8030
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8030"]
