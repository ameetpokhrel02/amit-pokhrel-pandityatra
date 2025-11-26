# In backend/pandits/views.py

from rest_framework import generics
from .models import Pandit
from .serializers import PanditSerializer

# New Endpoint: GET, PUT, DELETE /api/pandits/{id}/
class PanditListCreateView(generics.ListCreateAPIView):  # <--- Check the capitalization!
    queryset = Pandit.objects.all()
    serializer_class = PanditSerializer

class PanditDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Pandit.objects.all()
    serializer_class = PanditSerializer

    # Since Pandit list is public, we don't need authentication here,
    # but we can enforce it for POST (creation) if needed.
    # For now, we'll allow all.