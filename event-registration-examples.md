# Event Registration API Examples

The event registration system has been successfully implemented and seeded with sample data. Here are some API examples:

## 🎯 Sample Data Created

The seeder has created:
- **12 events** with registration configurations
- **153 sample registrations** from different users
- **5 different event types**: tech_meetup, workshop, seminar, networking, conference
- Various form fields for different event types
- Mixed registration statuses (PENDING, CONFIRMED, CANCELLED)

## 📡 API Endpoints Usage Examples

### 1. Get Events with Registration Config
```http
GET /v1/event/published?includes=registrationConfig
```

### 2. Get Registration Configuration for Specific Event  
```http
GET /v1/event/{eventId}/registration-config
```

### 3. Create Registration Configuration (Event Author Only)
```http
POST /v1/event/{eventId}/registration-config
Authorization: Bearer {your-token}
Content-Type: application/json

{
  "isEnabled": true,
  "participantLimit": 50,
  "registrationStart": "2024-09-03T00:00:00Z",
  "registrationEnd": "2024-09-15T23:59:59Z",
  "requireApproval": false,
  "formFields": [
    {
      "key": "phone",
      "label": "Phone Number", 
      "type": "PHONE",
      "required": true,
      "placeholder": "+62 123 456 7890"
    },
    {
      "key": "experience_level",
      "label": "Experience Level",
      "type": "SELECT", 
      "required": true,
      "options": ["Beginner", "Intermediate", "Advanced"]
    },
    {
      "key": "dietary_requirements",
      "label": "Dietary Requirements",
      "type": "SELECT",
      "required": false,
      "options": ["None", "Vegetarian", "Vegan", "Halal"]
    }
  ],
  "confirmationMessage": "Thank you for registering! We'll send you event details soon."
}
```

### 4. Register for Event
```http
POST /v1/event/{eventId}/register
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "formData": {
    "phone": "+62 812 3456 7890",
    "experience_level": "Intermediate", 
    "dietary_requirements": "Vegetarian"
  }
}
```

### 5. Update Registration
```http
PATCH /v1/event/registration/{registrationId}
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "formData": {
    "phone": "+62 812 3456 7890",
    "experience_level": "Advanced",
    "dietary_requirements": "Vegan"
  }
}
```

### 6. Cancel Registration
```http
DELETE /v1/event/registration/{registrationId}
Authorization: Bearer {user-token}
Content-Type: application/json

{
  "cancellationNote": "Schedule conflict"
}
```

### 7. View Event Registrations (Event Author Only)
```http
GET /v1/event/{eventId}/registrations?status=CONFIRMED&search=john
Authorization: Bearer {author-token}
```

### 8. Confirm Registration (Admin Only)
```http
POST /v1/event/registration/{registrationId}/confirm
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "note": "Registration approved"
}
```

### 9. Get User's Own Registrations
```http
GET /v1/event/my-registrations?page=1&limit=10
Authorization: Bearer {user-token}
```

## 🔧 Form Field Types Supported

- **TEXT**: Simple text input
- **EMAIL**: Email validation
- **PHONE**: Phone number with validation
- **NUMBER**: Numeric input
- **TEXTAREA**: Multi-line text
- **SELECT**: Single selection dropdown
- **RADIO**: Single selection radio buttons
- **CHECKBOX**: Multiple selection checkboxes
- **DATE**: Date picker

## 🎭 Sample Form Configurations by Event Type

### Tech Meetup
- Phone (required)
- Experience Level (SELECT: Beginner/Intermediate/Advanced)
- Company (TEXT, optional)
- Technical Interests (CHECKBOX: Frontend, Backend, DevOps, etc.)

### Workshop 
- Phone (required)
- Laptop Specs (TEXTAREA, required)
- Dietary Requirements (SELECT, optional)
- Emergency Contact (PHONE, required)

### Conference
- Phone (required)  
- Badge Name (TEXT, required)
- Accommodation Needed (RADIO: Yes/No)
- Sessions of Interest (CHECKBOX: multiple options)
- Special Requirements (TEXTAREA, optional)

## 🎲 Testing with Sample Data

You can use Prisma Studio to explore the seeded data:
```bash
npx prisma studio --port 5556
```

Or query directly with Prisma:
```typescript
// Get events with registration configs
const events = await prisma.event.findMany({
  include: {
    registrationConfig: true,
    registrations: {
      include: { user: true }
    }
  }
});
```

## 🚀 Features Implemented

✅ **Flexible Form Builder** - Dynamic form fields per event
✅ **Participant Limits** - Optional maximum attendee limits  
✅ **Time-based Registration** - Optional start/end dates
✅ **Approval Workflow** - Optional manual approval process
✅ **Form Validation** - Robust field validation
✅ **User Management** - Registration CRUD operations
✅ **Admin Controls** - Event author can manage registrations
✅ **Status Tracking** - PENDING/CONFIRMED/CANCELLED states
✅ **Search & Filter** - Registration search and filtering

The system is now ready for production use with comprehensive event registration management!