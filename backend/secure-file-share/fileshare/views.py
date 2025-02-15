# First, all Django imports
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
from django.utils import timezone
from django.http import FileResponse, HttpResponse, Http404

# Then REST framework imports
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

# Your app imports
from .models import EncryptedFile, FileShare, ShareableLink
from .serializers import EncryptedFileSerializer, FileShareSerializer, ShareableLinkSerializer
from .permissions import ShareableLinkPermission

# Other third-party imports
from cryptography.fernet import Fernet
import magic
import logging
import os
import mimetypes

# Create a logger
logger = logging.getLogger('fileshare')

# @method_decorator(csrf_exempt, name='dispatch')
class FileUploadView(generics.CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EncryptedFileSerializer

    def post(self, request, *args, **kwargs):
        print("Received request data:", request.data)  # Debugging request data
        print("Received request files:", request.FILES)  # Debugging file upload
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Read file content once
        # file_content = file.read()
        # print("File content:", file_content)
        # file_type = magic.from_buffer(file_content[:1024], mime=True)
        # print("File type:", file_type)

        file_content = file.read()  # Read the file fully once
        file.seek(0)  # Reset pointer (only affects Django's file object)
        file_type = magic.from_buffer(file_content[:1024], mime=True)  # Detect MIME type
        # encrypted_content = fernet.encrypt(file_content)
        
        # Generate encryption key
        key = Fernet.generate_key()
        fernet = Fernet(key)

        # Encrypt the content we already read
        encrypted_content = fernet.encrypt(file_content)

        # Create encrypted file record
        encrypted_file = EncryptedFile.objects.create(
            owner=request.user,
            file_name=file.name,
            encrypted_file=encrypted_content,
            encryption_key=key,
            file_type=file_type,
            file_size=file.size
        )

        serializer = self.serializer_class(encrypted_file)
        print("Response Data:", serializer.data)  # Debugging
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EncryptedFileSerializer

    def get_queryset(self):
        user = self.request.user
        # Get files owned by user and shared with user
        owned_files = EncryptedFile.objects.filter(owner=user)
        shared_files = EncryptedFile.objects.filter(shares__shared_with=user)
        return (owned_files | shared_files).distinct()
        # return (shared_files).distinct()

# class FileDetailView(generics.RetrieveAPIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = EncryptedFileSerializer
#     lookup_field = 'pk'

#     def get_queryset(self):
#         user = self.request.user
#         return EncryptedFile.objects.filter(
#             Q(owner=user) | 
#             Q(shares__shared_with=user)
#         ).distinct()

class FileShareView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileShareSerializer

    def perform_create(self, serializer):
        file_id = self.kwargs.get('pk')
        file = EncryptedFile.objects.get(pk=file_id)
        if file.owner != self.request.user:
            raise PermissionDenied("You don't have permission to share this file")
        serializer.save(file=file)

class FileDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = EncryptedFileSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        return EncryptedFile.objects.filter(
            Q(owner=user) | Q(shares__shared_with=user)
        ).distinct()

    def get(self, request, *args, **kwargs):
        file = get_object_or_404(EncryptedFile, pk=kwargs['pk'])
        user = request.user
        action = request.query_params.get("action")

        logger.info(f" action {action}")

        # Owner can always access the file
        if file.owner == user:
            if action == "download":
                return self.handle_file_response(file, download=True)
            else:
                return self.handle_file_response(file, download=False)

        # Check if the file is shared with the user
        file_share = FileShare.objects.filter(file=file, shared_with=user, is_link_active=True).first()

        if file_share:
            if file_share.is_expired():
                return Response({"error": "The shared link has expired."}, status=status.HTTP_403_FORBIDDEN)

            if action == "view" and file_share.permission in ["VIEW", "DOWNLOAD", "EDIT"]:
                logger.info(f" inside view file.permission {file.id}")
                return self.handle_file_response(file, download=False)

            if action == "download" and (file_share.permission in ["DOWNLOAD", "EDIT"]):
                return self.handle_file_response(file, download=True)

        return Response({"error": "You don't have permission to access this file."}, status=status.HTTP_403_FORBIDDEN)

    def handle_file_response(self, file, download):
        """
        Decrypts the file and returns an HTTP response with enhanced security.
        If download=True, it sends the file as an attachment.
        Otherwise, it streams the content for viewing with strict security headers.
        """
        try:
            if not file.encryption_key:
                return Response({"error": "Missing encryption key"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            fernet = Fernet(file.encryption_key)
            decrypted_content = fernet.decrypt(file.encrypted_file)
            
            response = HttpResponse(decrypted_content)
            
            if download:
                response['Content-Type'] = 'application/octet-stream'
                response['Content-Disposition'] = f'attachment; filename="{file.file_name}"'
            else:
                response['Content-Type'] = file.file_type
                response['Content-Disposition'] = f'inline; filename="{file.file_name}"'
                
                # Enhanced security headers for viewing
                response['X-Content-Type-Options'] = 'nosniff'
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private, max-age=0'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                response['X-Frame-Options'] = 'SAMEORIGIN'
                response['X-XSS-Protection'] = '1; mode=block'
                
                # Strict Content Security Policy
                csp_policies = [
                    "default-src 'self'",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "frame-ancestors 'self'",
                    "form-action 'none'",
                    "download 'none'",
                    "script-src 'none'",
                    "style-src 'self' 'unsafe-inline'",  # Allow inline styles for PDF viewing
                ]
                response['Content-Security-Policy'] = "; ".join(csp_policies)
                
                # Permissions Policy to disable features
                permissions_policy = [
                    'clipboard-write=()',
                    'clipboard-read=()',
                    'screen-wake-lock=()',
                    'download=()',
                    'fullscreen=()',
                    'keyboard=()'
                ]
                response['Permissions-Policy'] = ", ".join(permissions_policy)
                
                if file.file_type == 'application/pdf':
                    # Additional PDF-specific headers
                    response['Content-Type'] = 'application/pdf'
                    response['Accept-Ranges'] = 'none'  # Prevent partial content requests
                    
                    # Add PDF-specific CSP directives
                    pdf_csp = csp_policies + [
                        "plugin-types application/pdf",
                        "object-src 'self'"
                    ]
                    response['Content-Security-Policy'] = "; ".join(pdf_csp)
                
                elif file.file_type.startswith('image/'):
                    # Image-specific headers
                    response['Accept-Ranges'] = 'none'
                    response['X-Content-Type-Options'] = 'nosniff'
                    response['Content-Security-Policy'] = "default-src 'self'; img-src 'self' data:; object-src 'none'"
                
                # Add Cross-Origin headers
                response['Cross-Origin-Resource-Policy'] = 'same-origin'
                response['Cross-Origin-Embedder-Policy'] = 'require-corp'
                response['Cross-Origin-Opener-Policy'] = 'same-origin'

            return response

        except Exception as e:
            logger.error(f"Error processing file: {str(e)}", exc_info=True)
            return Response(
                {"error": f"Error decrypting file: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# class FileDetailView(generics.RetrieveAPIView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class = EncryptedFileSerializer
#     lookup_field = 'pk'

#     def get_queryset(self):
#         user = self.request.user
#         return EncryptedFile.objects.filter(
#             Q(owner=user) | 
#             Q(shares__shared_with=user)
#         ).distinct()

#     def get(self, request, *args, **kwargs):
#         logger = logging.getLogger('fileshare')
#         action = request.query_params.get('action', None)
#         logger.info(f"FileDetailView.get called with action: {action}")

#         instance = self.get_object()
#         logger.info(f"Retrieved file: {instance.file_name} (ID: {instance.id})")

#         # If no action or invalid action, return file metadata
#         if not action:
#             serializer = self.get_serializer(instance)
#             return Response(serializer.data)

#         # Handle file content requests
#         try:
#             logger.info("Starting file decryption process")
#             fernet = Fernet(instance.encryption_key)
#             decrypted_content = fernet.decrypt(instance.encrypted_file)
#             logger.info("File successfully decrypted")
            
#             # Set proper content type based on file type or default to binary
#             content_type = instance.file_type or 'application/octet-stream'
#             logger.info(f"Content type: {content_type}")

#             # Create response with decrypted content
#             response = HttpResponse(decrypted_content)
            
#             # Set content type and disposition based on action
#             if action == 'download':
#                 response['Content-Type'] = 'application/octet-stream'
#                 response['Content-Disposition'] = f'attachment; filename="{instance.file_name}"'
#             elif action == 'view':
#                 response['Content-Type'] = content_type
#                 response['Content-Disposition'] = f'inline; filename="{instance.file_name}"'
#             else:
#                 logger.warning(f"Invalid action specified: {action}")
#                 return Response(
#                     {"error": "Invalid action specified"}, 
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Add security headers
#             response['X-Content-Type-Options'] = 'nosniff'
#             response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
#             response['Pragma'] = 'no-cache'

#             logger.info("Sending response with decrypted content")
#             return response

#         except Exception as e:
#             logger.error(f"Error processing file: {str(e)}", exc_info=True)
#             return Response(
#                 {"error": f"Error processing file: {str(e)}"}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

class GenerateShareableLinkView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShareableLinkSerializer

    def create(self, request, *args, **kwargs):
        print("\nGenerating shareable link...")
        file_id = self.kwargs.get('pk')
        print(f"File ID: {file_id}")
        print(f"User ID: {request.user.id}")
        
        try:
            # First check if file exists
            file = EncryptedFile.objects.get(pk=file_id)
            print(f"File found: {file.id}, owned by: {file.owner.id}")

            # Check if user is owner
            if file.owner == request.user:
                print("User is file owner")
                permission = 'DOWNLOAD'  # Owner gets full permissions
            else:
                print("User is not file owner, checking FileShare")
                # Check if file is shared with the user
                try:
                    file_share = FileShare.objects.get(
                        file=file,
                        shared_with=request.user
                    )
                    permission = file_share.permission
                    print(f"Found FileShare with permission: {permission}")
                except FileShare.DoesNotExist:
                    print("No FileShare found")
                    return Response(
                        {"error": "You don't have permission to access this file"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Create the shareable link
            expires_at = request.data.get('expires_at')
            if not expires_at:
                return Response(
                    {"error": "expires_at is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            link = ShareableLink.objects.create(
                file=file,
                created_by=request.user,
                expires_at=expires_at,
                one_time_use=request.data.get('one_time_use', False),
                permission=permission
            )
            print(f"Created link: {link.id}")

            serializer = self.get_serializer(link)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except EncryptedFile.DoesNotExist:
            print(f"File not found: {file_id}")
            return Response(
                {"error": "File not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ShareableLinkView(generics.RetrieveAPIView):
    permission_classes = [ShareableLinkPermission]
    serializer_class = EncryptedFileSerializer
    lookup_field = 'link_id'

    def get_queryset(self):
        """Return only files that the user owns or has been shared with"""
        return EncryptedFile.objects.filter(
            Q(owner=self.request.user) |  # Files owned by user
            Q(shares__shared_with=self.request.user)  # Files shared with user
        ).distinct()

    def get_link(self):
        """Helper method to get link object"""
        link = ShareableLink.objects.get(id=self.kwargs['link_id'])
        logger.info(f"Retrieved link {link.id} with permission: {link.permission}")
        return link

    def get(self, request, *args, **kwargs):
        try:
            logger.info(f"Accessing shared link with kwargs: {kwargs}")
            link = self.get_link()
            logger.info(f"Found link: {link.id}, Permission: {link.permission}")
            
            # Check if link is expired
            if link.expires_at and link.expires_at < timezone.now():
                logger.warning(f"Link {link.id} has expired")
                return Response({"error": "Link has expired"}, status=status.HTTP_400_BAD_REQUEST)

            file = link.file
            # Check if user has permission to access this file (owner or shared with)
            logger.info(f"File owner: {file.owner}, User: {request.user}")
            if not (file.owner == request.user or FileShare.objects.filter(file=file, shared_with=request.user).exists()):
                logger.warning(f"User {request.user.id} attempted unauthorized access to file {file.id}")
                return Response(
                    {"error": "You don't have permission to access this file"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get the requested action (if any)
            action = self.request.query_params.get('action', None)
            logger.info(f"Requested action: {action}")

            # If no action specified, return metadata
            if not action:
                logger.info(f"Returning metadata for file {file.id}")
                serializer = EncryptedFileSerializer(file)
                return Response(serializer.data)

            # Check download permission
            if action == 'download' and link.permission != 'DOWNLOAD':
                logger.warning(f"Download attempted for link {link.id} with permission {link.permission}")
                return Response(
                    {"error": "You don't have download permission"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            if action in ['view', 'download']:
                try:
                    logger.info(f"Processing {action} request for file {file.id}")
                    fernet = Fernet(file.encryption_key)
                    decrypted_content = fernet.decrypt(file.encrypted_file)
                    
                    response = HttpResponse(decrypted_content)
                    if action == 'download':
                        response['Content-Type'] = 'application/octet-stream'
                        response['Content-Disposition'] = f'attachment; filename="{file.file_name}"'
                        logger.info(f"Prepared download response for file {file.id}")
                    else:
                        response['Content-Type'] = file.file_type
                        response['Content-Disposition'] = f'inline; filename="{file.file_name}"'
                        logger.info(f"Prepared view response for file {file.id}")
                    
                    # Security headers
                    response['X-Content-Type-Options'] = 'nosniff'
                    response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                    response['Pragma'] = 'no-cache'
                    response['Content-Security-Policy'] = "default-src 'self'"
                    
                    return response
                except Exception as e:
                    logger.error(f"Error decrypting file: {str(e)}", exc_info=True)
                    return Response(
                        {"error": "Error processing file"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            return Response(
                {"error": "Invalid action specified"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error accessing shared link: {str(e)}", exc_info=True)
            return Response(
                {"error": "Unable to access file"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# def serve_file(request, file_id):
#     file_path = get_file_path(file_id)  # Your logic to get the file path
#     if not os.path.exists(file_path):
#         raise Http404("File not found")

#     mime_type = magic.from_file(file_path, mime=True)  # Get MIME type
#     response = HttpResponse(open(file_path, 'rb'), content_type=mime_type)
#     return response 