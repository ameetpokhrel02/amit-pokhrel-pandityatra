# In backend/services/views.py

from rest_framework import generics
from .models import Puja
from .serializers import PujaSerializer

# New Endpoint: GET, PUT, DELETE /api/services/{id}/
class PujaListCreateView(generics.ListCreateAPIView): 
    queryset = Puja.objects.all()
    serializer_class = PujaSerializer

class PujaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Puja.objects.all()
    serializer_class = PujaSerializer

# New Endpoint: GET /api/pandits/{pandit_pk}/services/
class PanditPujaListView(generics.ListAPIView):
    serializer_class = PujaSerializer


    def get_queryset(self):
        # The URL parameter is named 'pandit_pk'
        pandit_pk = self.kwargs['pandit_pk'] 
        # Filter Pujas to only include those linked to this Pandit ID
        return Puja.objects.filter(pandit__pk=pandit_pk)

    # We can add permissions here later, but for now, we'll keep it simple.