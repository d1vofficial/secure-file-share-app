from rest_framework import serializers
from .models import EncryptedFile, FileShare, ShareableLink
from django.utils import timezone

class EncryptedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncryptedFile
        fields = ('id', 'file_name', 'file_type', 'uploaded_at', 'file_size')
        read_only_fields = ('id', 'uploaded_at')

class FileShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with', 'permission', 'expires_at')
        read_only_fields = ('id',)

    def validate_expires_at(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Expiration time cannot be in the past")
        return value

    def create(self, validated_data):
        # Try to get existing share
        try:
            share = FileShare.objects.get(
                file=validated_data['file'],
                shared_with=validated_data['shared_with']
            )
            # Update existing share
            for attr, value in validated_data.items():
                setattr(share, attr, value)
            share.save()
            return share
        except FileShare.DoesNotExist:
            # Create new share
            return FileShare.objects.create(**validated_data)

class ShareableLinkSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ShareableLink
        fields = ('id', 'file', 'created_by', 'created_at', 'expires_at', 
                 'one_time_use', 'access_count', 'is_active', 'url')
        read_only_fields = ('id', 'created_by', 'created_at', 'access_count', 'url')

    def get_url(self, obj):
        request = self.context.get('request')
        if request is None:
            return None
        return request.build_absolute_uri(f'/api/files/shared-link/{obj.id}/')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 