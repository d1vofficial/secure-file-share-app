from django.contrib import admin
from .models import EncryptedFile, FileShare

@admin.register(EncryptedFile)
class EncryptedFileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'owner', 'uploaded_at', 'file_size')
    list_filter = ('owner', 'uploaded_at')
    search_fields = ('file_name', 'owner__username')

    def file_size(self, obj):
        """Return file size in a human-readable format"""
        size = obj.file.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ('file', 'shared_with', 'permission', 'created_at', 'expires_at')
    list_filter = ('permission', 'created_at', 'expires_at')
    search_fields = ('file__file_name', 'shared_with__username') 