# Pandit Calendar & Availability System

## Overview
A comprehensive calendar system for Pandits to visualize their schedule, manage availability, and view upcoming pujas efficiently using FullCalendar React integration.

## Features Implemented

### 🗓️ **Calendar View**
- **Multiple Views**: Month, Week, and Day views
- **Interactive Interface**: Click dates to block time, click events for details
- **Real-time Updates**: Events update dynamically
- **Time Slots**: 6 AM to 10 PM working hours
- **Color Coding**: Different colors for bookings, blocked slots, and availability

### 📅 **Event Types**
1. **Bookings** (Primary Color)
   - Customer puja appointments
   - Shows customer name, puja type, time, price
   - Status indicators (confirmed, pending, completed)
   - Video call links for online pujas

2. **Blocked Slots** (Red)
   - Pandit-marked unavailable times
   - Personal work, holidays, breaks
   - Custom reasons and descriptions

3. **Available Slots** (Green) - Future Enhancement
   - Explicitly marked available times
   - Override default availability

### 🎯 **Key Functionality**

#### **Today's Schedule Widget**
- Shows current day's appointments
- Time-based layout with status badges
- Quick access to video calls
- Integrated in dashboard overview

#### **Time Blocking**
- Click any date to block time slots
- Set start/end times with reason
- Instant calendar updates
- Prevents double bookings

#### **Event Details**
- Click any event for full details
- Customer information and contact
- Puja type and pricing
- Status management
- Direct video call access

### 🛠️ **Technical Implementation**

#### **Frontend Components**
```
src/components/pandit/
└── PanditCalendar.tsx - Main calendar component
```

#### **Dependencies Added**
- `@fullcalendar/react` - Core calendar functionality
- `@fullcalendar/daygrid` - Month view
- `@fullcalendar/timegrid` - Week/Day views  
- `@fullcalendar/interaction` - Click interactions

#### **Backend Structure**
```
backend/pandits/
├── calendar_models.py - Database models
├── calendar_views.py - API endpoints
└── calendar_urls.py - URL routing
```

### 📊 **Database Models**

#### **PanditAvailability**
```python
- pandit: ForeignKey to User
- date: DateField
- start_time: TimeField
- end_time: TimeField
- availability_type: Choice (available/unavailable/blocked)
- reason: CharField (optional)
- is_recurring: BooleanField
- recurring_days: JSONField (for weekly patterns)
```

#### **PanditWorkingHours**
```python
- pandit: ForeignKey to User
- day_of_week: IntegerField (0-6)
- start_time: TimeField (default 9:00 AM)
- end_time: TimeField (default 6:00 PM)
- is_working: BooleanField
```

### 🔌 **API Endpoints**

#### **Calendar Events**
- `GET /pandits/calendar/events/` - Fetch calendar events
- `POST /pandits/calendar/block-time/` - Block time slots

#### **Dashboard**
- `GET /pandits/dashboard/stats/` - Dashboard statistics
- `GET /pandits/dashboard/today-schedule/` - Today's appointments
- `POST /pandits/dashboard/toggle-availability/` - Online/offline status

### 🎨 **UI/UX Features**

#### **Visual Design**
- Consistent with app's primary color scheme
- Responsive design for mobile/desktop
- Smooth animations and transitions
- Intuitive click interactions

#### **User Experience**
- One-click time blocking
- Drag-and-drop support (future)
- Keyboard navigation
- Loading states and error handling

#### **Accessibility**
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast color schemes
- Focus indicators

### 📱 **Integration Points**

#### **Dashboard Integration**
- Calendar tab in pandit dashboard
- Today's schedule widget
- Quick stats and metrics
- Seamless navigation

#### **Booking System**
- Automatic event creation from bookings
- Status synchronization
- Conflict prevention
- Real-time updates

### 🚀 **Future Enhancements**

#### **Advanced Features**
- Recurring availability patterns
- Bulk time blocking
- Calendar sharing with customers
- Automated reminders
- Integration with external calendars (Google, Outlook)

#### **Analytics**
- Utilization reports
- Peak hours analysis
- Revenue tracking by time slots
- Customer booking patterns

#### **Mobile App**
- Native calendar widgets
- Push notifications
- Offline sync capabilities
- Quick booking responses

### 🧪 **Testing Strategy**

#### **Automated Tests**
- Backend API endpoint tests
- Calendar event CRUD operations
- Availability conflict detection
- Data validation tests

#### **Manual Testing**
- Calendar view functionality
- Time blocking workflows
- Event detail interactions
- Mobile responsiveness
- Cross-browser compatibility

### 🔧 **Configuration**

#### **Calendar Settings**
```javascript
// FullCalendar configuration
initialView: 'timeGridWeek'
slotMinTime: '06:00:00'
slotMaxTime: '22:00:00'
businessHours: 6 AM - 10 PM daily
```

#### **Event Colors**
- Bookings: Primary theme color
- Blocked: Red (#ef4444)
- Available: Green (#22c55e)

### 📈 **Performance Optimizations**

#### **Frontend**
- Lazy loading of calendar events
- Efficient re-rendering with React
- Optimized date range queries
- Cached event data

#### **Backend**
- Database indexing on date fields
- Efficient query optimization
- Pagination for large datasets
- Caching frequently accessed data

### 🔒 **Security Considerations**

#### **Access Control**
- Pandit-only calendar access
- User authentication required
- Role-based permissions
- Data isolation by pandit

#### **Data Validation**
- Time slot conflict prevention
- Date range validation
- Input sanitization
- SQL injection protection

## Usage Instructions

### **For Pandits**
1. Navigate to Dashboard → Calendar tab
2. View schedule in Month/Week/Day views
3. Click any date to block time slots
4. Click events to view/edit details
5. Use Today's Schedule for quick overview

### **For Developers**
1. Import PanditCalendar component
2. Ensure FullCalendar dependencies installed
3. Configure API endpoints in backend
4. Run database migrations for new models
5. Test calendar functionality

The calendar system provides a comprehensive solution for pandit schedule management with modern UI/UX and robust backend support.