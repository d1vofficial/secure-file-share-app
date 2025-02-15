from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .models import User
from .permissions import IsAdmin  # Import our custom IsAdmin class
from rest_framework.views import APIView

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):

        email = request.data.get('email')
        username = request.data.get('username')

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({'error': 'User with this username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                user_data = UserSerializer(user).data  # Serialize user data
                
                if user.mfa_enabled:
                    return Response({
                        'message': 'MFA verification required',
                        'require_mfa': True,
                        'user': user_data,  # Return user data
                        'user_id': user.id
                    }, status=status.HTTP_200_OK)
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'user': user_data  # Include user info
                }, status=status.HTTP_200_OK)
                
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EnableMFAView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        if not user.mfa_enabled:
            # Generate new MFA secret
            secret = pyotp.random_base32()
            user.mfa_secret = secret
            user.mfa_enabled = True
            user.save()

            # Generate QR code URI for Google Authenticator
            totp = pyotp.TOTP(secret)
            provisioning_uri = totp.provisioning_uri(
                name=user.email,
                issuer_name="SecureFileShare"
            )

            return Response({
                'secret': secret,
                'qr_uri': provisioning_uri
            }, status=status.HTTP_200_OK)
        return Response({
            'error': 'MFA is already enabled'
        }, status=status.HTTP_400_BAD_REQUEST)

class VerifyMFAView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        user_id = request.data.get('user_id')
        code = request.data.get('code')

        try:
            user = User.objects.get(id=user_id)
            totp = pyotp.TOTP(user.mfa_secret)
            
            if totp.verify(code):
                refresh = RefreshToken.for_user(user)
                user_data = UserSerializer(user).data  # Serialize user data
                
                return Response({
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user' : user_data
                    },
                    'user': user_data  # Include user info
                }, status=status.HTTP_200_OK)
            
            return Response({'error': 'Invalid MFA code'}, status=status.HTTP_400_BAD_REQUEST)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class DisableMFAView(generics.GenericAPIView):
    # Remove authentication requirement temporarily
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            user_id = request.data.get('user_id')
            user = User.objects.get(id=user_id)
            user.mfa_enabled = False
            user.mfa_secret = None
            user.save()
            return Response({
                'message': 'MFA has been disabled'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from request
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST) 

class ListUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            users = User.objects.all().values('id', 'username')
            return Response({"users": list(users)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Failed to fetch users"}, status=status.HTTP_400_BAD_REQUEST)