from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LogoutView

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('mfa/enable/', views.EnableMFAView.as_view(), name='enable-mfa'),
    path('mfa/verify/', views.VerifyMFAView.as_view(), name='verify-mfa'),
    path('mfa/disable/', views.DisableMFAView.as_view(), name='disable-mfa'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/users/', views.UserListView.as_view(), name='user-list'),
    path('admin/users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('users/', views.ListUsersView.as_view(), name='users'),
] 