from rest_framework.permissions import BasePermission
from django.utils import timezone

class ShareableLinkPermission(BasePermission):
    def has_permission(self, request, view):
        try:
            link = view.get_link()
            file = link.file

            # If user is the file owner
            if request.user.is_authenticated and file.owner == request.user:
                return True

            # If file is shared with the user
            if request.user.is_authenticated and file.shares.filter(shared_with=request.user).exists():
                return True

            return False

        except Exception:
            return False

        # For unauthenticated users, check if link is valid
        try:
            link = view.get_link()
            # Check if link is expired
            if link.expires_at and link.expires_at < timezone.now():
                return False
            # Check if link is one-time use and already used
            if link.one_time_use and link.access_count > 0:
                return False
            return True
        except:
            return False 