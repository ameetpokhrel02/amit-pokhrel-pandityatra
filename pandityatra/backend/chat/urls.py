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
    path('unread-count/', views.UnreadMessageCountView.as_view(), name='unread-count'),
    
    # Quick Chat (Guide Mode) - AI Help
    path('quick-chat/', views.QuickChatView.as_view(), name='quick-guide-chat'),
    path('', views.QuickChatView.as_view(), name='quick-chat'),
    path('history/', views.GuideHistoryView.as_view(), name='guide-history'),
    path('rooms/initiate/', views.ChatRoomInitiateView.as_view(), name='chatroom-initiate'),
    path('rooms/initiate-vendor/', views.VendorChatRoomInitiateView.as_view(), name='vendor-chatroom-initiate'),
]