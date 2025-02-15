from django.urls import path, re_path
from .views import (
    FileUploadView, 
    FileListView, 
    FileDetailView, 
    FileShareView,
    GenerateShareableLinkView,
    ShareableLinkView,
)
from django.http import HttpResponse

# Debug view
# def app_debug_view(request, *args, **kwargs):
#     print("\nApp debug view called!")
#     print(f"Path: {request.path}")
#     print(f"Method: {request.method}")
#     print(f"kwargs: {kwargs}")
#     print(f"Full URL: {request.build_absolute_uri()}")
#     print(f"User: {request.user}")
#     print("Available URL patterns:")
#     for pattern in urlpatterns:
#         print(f"- {pattern.pattern}")
#     return HttpResponse("App debug view")

print("Initializing fileshare URLs")

urlpatterns = [
    path('files/', FileListView.as_view(), name='file-list'),
    path('files/upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/<uuid:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('files/<uuid:pk>/share/', FileShareView.as_view(), name='file-share'),
    path('files/<uuid:pk>/generate-link/', GenerateShareableLinkView.as_view(), name='generate-link'),
    path('shared-link/<uuid:link_id>/', ShareableLinkView.as_view(), name='shared-link'),
    
    # Catch absolutely everything that hasn't matched
    # re_path(r'^.*$', app_debug_view),
]

# Print each URL pattern for debugging
print("\nRegistered URL patterns:")
for pattern in urlpatterns:
    print(f"- {pattern.pattern}") 