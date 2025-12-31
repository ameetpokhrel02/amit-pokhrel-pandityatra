from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # ChatRoom endpoints
    path('rooms/', views.ChatRoomListView.as_view(), name='chatroom-list'),
    path('rooms/<int:pk>/', views.ChatRoomDetailView.as_view(), name='chatroom-detail'),
    path('rooms/<int:room_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    
    # Message endpoints
    path('messages/<int:pk>/mark-read/', views.MarkMessageReadView.as_view(), name='mark-message-read'),
]
