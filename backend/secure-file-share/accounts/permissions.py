from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsAdminOrOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'admin':
            return True
        # Owner can access their own files
        return obj.owner == request.user 
