# Employee Management System (EMS)

A comprehensive Employee Management System built with Next.js, providing features for employees, managers, and HR administrators.

## Features

### Employee Self-Service (ESS)

#### Attendance Management
- **Today's Attendance**: View and manage today's attendance with clock in/out functionality
- **Calendar View**: Monthly attendance calendar with comprehensive visualization
  - Color-coded status indicators (Present, Absent, Holiday, Weekly Off, On Leave, Leave Pending)
  - Full month view with detailed day information
  - Mobile-responsive design with color codes for mobile view
  - Integration with organization, department, and employee-level calendars
  - Weekly offs and holidays display
- **Attendance History**: View historical attendance records in table format
- **Corrections**: Request attendance corrections
- **Statistics**: Monthly attendance statistics and trends

#### Other ESS Features
- Personal Details Management
- Leave Management
- Holiday Calendar
- Job Profile
- Performance Reviews
- Salary Information
- Roster Management

### Manager Features
- Team Management
- Team Attendance Overview
- Leave Approvals
- Attendance Corrections
- Team Directory

### HR Features
- Employee Management
- Attendance Policies
- Calendar Management
- Holiday Management
- Leave Types Management
- Shift Management
- Reports and Analytics

## Technology Stack

- **Framework**: Next.js (App Router)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useCallback, useMemo)

## Project Structure

```
app/
├── ess/                    # Employee Self-Service
│   ├── attendance/         # Attendance management
│   │   ├── calendar/       # Monthly calendar view
│   │   ├── correction/     # Attendance corrections
│   │   ├── history/        # Attendance history
│   │   ├── statistics/     # Attendance statistics
│   │   └── today/          # Today's attendance
│   ├── personal-details/   # Personal information
│   └── ...
├── hr/                     # HR Management
├── manager/                # Manager Features
└── api/                    # API Routes

components/
├── common/                 # Common components
├── ui/                     # UI components (shadcn/ui)
└── ...
```

## Recent Updates

### Attendance Calendar Enhancement
- Implemented comprehensive monthly attendance calendar view
- Added color-coded status indicators for better visualization
- Integrated with organization, department, and employee-level calendars
- Added summary cards showing:
  - Total Days
  - Working Days
  - Present Days
  - Total Working Hours
  - Holidays
  - Leaves (Approved & Pending)
  - Late Arrivals
  - Early Departures
  - Overtime Hours
- Responsive design optimized for mobile and desktop views
- Support for weekly offs, holidays, and leaves display

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The application integrates with a backend API. Ensure the backend is running and configured properly. API endpoints are defined in:
- `app/services/externalApiClient.js`
- `app/services/internalApiClient.js`

## Environment Variables

Create a `.env.local` file with the necessary environment variables for API endpoints and authentication.

## License

See LICENSE file for details.

