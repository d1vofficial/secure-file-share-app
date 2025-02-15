# Use official Python image
FROM python:3.9

WORKDIR /app

# Copy requirements first
COPY requirements.txt .

# Install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/db /cert

# Copy backend files
COPY . .

EXPOSE 8000

# Use runserver_plus with SSL
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver_plus 0.0.0.0:8000 --cert-file /cert/cert.pem --key-file /cert/key.pem"]