# Secure File Sharing Platform

## Overview
A secure file sharing platform built with modern technologies that enables secure file upload, sharing, and management with Multi-Factor Authentication (MFA) support. The platform features a React frontend and Django backend, providing a robust and secure environment for file handling.

⚠️ **Note:** This project is intended for development purposes only. It is not production-ready.

## Key Features
- **Advanced Authentication**
  - Secure login/logout with JWT-based authentication
  - Multi-Factor Authentication (MFA) with TOTP support
  - Integration with authenticator apps (Google Authenticator, Authy)

- **Secure File Management**
  - File upload and management capabilities
  - Encrypted file storage and secure transmission
  - Configurable file sharing permissions (View/Download)
  - Time-based access control with expiration dates
  - Secure file preview with copy-protection measures

- **Security Measures**
  - End-to-end encryption for file transfer
  - Protected file viewing with disabled right-click and keyboard shortcuts
  - Self-signed certificates for HTTPS communication
  - Comprehensive admin controls via Django Admin Panel

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Lucide-react for icons
- React Toastify for notifications

### Backend
- Django & Django REST Framework
- JWT authentication
- Encryption/Decryption services
- MFA implementation

### Infrastructure
- Docker & Docker Compose for containerization
- HTTPS with self-signed certificates

## Installation Guide

### Prerequisites
- Docker
- Docker Compose
- An authenticator app (Google Authenticator/Authy) for MFA

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd secure-file-share
   docker-compose up --build
   ```

2. **Access Points**
   - Frontend: [https://localhost:3000/login](https://localhost:3000/login)
   - Backend Admin: [https://127.0.0.1:8000/admin](https://127.0.0.1:8000/admin)

### Detailed Setup Steps

1. **Create Administrator Account**
   ```bash
   python manage.py createsuperuser
   ```
   - Follow prompts to create admin credentials
   - Access admin panel at [https://127.0.0.1:8000/admin](https://127.0.0.1:8000/admin)

2. **User Registration**
   - Navigate to [https://localhost:3000/login](https://localhost:3000/login)
   - Click "Register" and complete the form
   - Verify successful registration message

3. **Multi-Factor Authentication Setup**
   1. From the dashboard, click "Setup MFA"
   2. Click "Enable 2FA" in the dialog
   3. Install an authenticator app (Google Authenticator/Authy)
   4. Manually enter the setup key
   5. Enter the 6-digit OTP to verify
   - Note: MFA can be disabled later through the dashboard if needed

4. **File Management**
   - **Uploading Files**
     1. Click "Upload File" from dashboard
     2. Select file and confirm upload
     3. File appears in dashboard list

   - **Sharing Files**
     1. Click "Share" on a file
     2. Select recipient user
     3. Set expiration date
     4. Choose permission level (View/Download)
     5. Confirm sharing

A complete [Word Document - User Guide](secure-file-share-app-guide.docx) is available for testing all API endpoints.

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/mfa/enable/` - Enable MFA
- `POST /api/auth/mfa/verify/` - Verify MFA code
- `POST /api/auth/mfa/disable/` - Disable MFA

### File Management Endpoints
- `POST /api/files/files/upload/` - Upload file
- `GET /api/files/files/` - List user's files
- `POST /api/files/files/{file_id}/share/` - Share file
- `POST /api/files/files/{file_id}/generate-link/` - Generate shareable link
- `GET /api/files/shared-link/{link_id}/` - Access shared file
- `GET /api/files/files/{file_id}/?action=view` - View file
- `GET /api/files/files/{file_id}/?action=download` - Download file

A complete [Postman collection](Secure_Filesharing_App_Final.postman_collection.json) is available for testing all API endpoints.

## Security Features
- **File Protection**
  - Disabled right-click on file preview
  - Blocked keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+C)
  - Sandboxed document viewer
  - Backend encryption/decryption

- **Access Control**
  - Role-based permissions
  - Time-limited file access
  - Granular sharing controls
  - MFA enforcement options

## Known Limitations
- Browser-based copy protection may not prevent all methods of content copying
- Additional security measures may be needed for production deployment
- Self-signed certificates should be replaced for production use
- Encryption/decryption is currently implemented only in the backend; frontend encryption support needs to be added for complete 
end-to-end encryption
- Some browsers might still allow copying within embedded content
- Further security enhancements may be required for advanced users
- MFA secret needs to be entered manually. QR code can be integrated in future to avoid manual intervention.
