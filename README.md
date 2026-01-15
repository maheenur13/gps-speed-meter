# GPS Speed Meter

A complete GPS-based speedometer app for iOS and Android built with Expo and React Native.

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## Features

### Core Functionality
- **Real-time Speed Tracking** - GPS-based current speed display
- **Distance Tracking** - Total distance traveled per trip
- **Journey History** - Each trip saved with full statistics
- **Average & Max Speed** - Per-trip analytics
- **Start/Stop Sessions** - Mark distinct trips

### Speedometer UI
- **Classic Analog Gauge** - Vintage-style speedometer with animated needle
- **Digital Display** - Clean, large typography view
- **Toggle Between Modes** - Switch views with a tap

### Data & Export
- **SQLite Storage** - Local database for all trip data
- **Export to CSV** - Spreadsheet-compatible format
- **Export to JSON** - Developer-friendly format
- **Export to GPX** - GPS Exchange Format for mapping apps

### Settings
- **Speed Units** - km/h or mph
- **Auto-Pause** - Pause tracking when stationary
- **Keep Screen On** - Prevent screen from sleeping during tracking
- **Speedometer Mode** - Analog or digital preference

### Background Tracking
- **Foreground Service** - Android notification during tracking
- **iOS Background Modes** - Location updates when minimized
- **Resume on App Open** - Continues active trip seamlessly

## Tech Stack

- **Expo SDK 54** - Modern React Native development
- **React Native 0.81** - New Architecture enabled
- **TypeScript** - Type-safe codebase
- **expo-location** - GPS tracking with high accuracy
- **expo-task-manager** - Background location updates
- **expo-sqlite** - Local SQLite database
- **Zustand** - Lightweight state management
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Vector graphics for speedometer
- **@shopify/flash-list** - Optimized list rendering

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- iOS Simulator or Android Emulator
- For physical device testing: Expo Go app (limited) or development build

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd gps-speed-meter

# Install dependencies
pnpm install

# Start development server
pnpm start
```

### Development Build (Required for Background Location)

Background location tracking requires a custom development build:

```bash
# Generate native projects
npx expo prebuild

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## Project Structure

```
gps-speed-meter/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Home - Speedometer
│   │   ├── history.tsx     # Trip history list
│   │   └── settings.tsx    # Settings page
│   ├── trip/[id].tsx       # Trip detail screen
│   └── _layout.tsx         # Root layout
├── components/             
│   ├── speedometer/        # Speedometer UI components
│   ├── trip/               # Trip-related components
│   ├── permissions/        # Permission UI
│   └── ...                 # Other components
├── services/               
│   ├── location.ts         # GPS tracking service
│   ├── background-task.ts  # Background task handler
│   └── speed-calculator.ts # Speed/distance calculations
├── stores/                 
│   ├── trip-store.ts       # Current trip state
│   └── settings-store.ts   # User preferences
├── database/               
│   ├── schema.ts           # SQLite table definitions
│   ├── migrations.ts       # Database migrations
│   ├── queries.ts          # CRUD operations
│   └── index.ts            # Database initialization
├── hooks/                  
│   └── useTracking.ts      # Tracking hook with edge cases
├── types/                  
│   └── index.ts            # TypeScript interfaces
├── constants/              
│   ├── config.ts           # App configuration
│   └── theme.ts            # Colors and styling
└── utils/                  
    └── export.ts           # Data export utilities
```

## Permissions

### Android
- `ACCESS_FINE_LOCATION` - Precise GPS access
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_BACKGROUND_LOCATION` - Background tracking
- `FOREGROUND_SERVICE` - Notification during tracking
- `FOREGROUND_SERVICE_LOCATION` - Location foreground service

### iOS
- `NSLocationWhenInUseUsageDescription` - Foreground location
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location
- `NSLocationAlwaysUsageDescription` - Always-on location
- `UIBackgroundModes: location` - Background capability

## Database Schema

```sql
-- Trips table
CREATE TABLE trips (
  id INTEGER PRIMARY KEY,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  total_distance REAL DEFAULT 0,
  max_speed REAL DEFAULT 0,
  avg_speed REAL DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Location points table
CREATE TABLE location_points (
  id INTEGER PRIMARY KEY,
  trip_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed REAL,
  altitude REAL,
  accuracy REAL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
```

## Configuration

GPS tracking settings can be adjusted in `constants/config.ts`:

```typescript
export const GPS_CONFIG = {
  accuracy: Location.Accuracy.BestForNavigation,
  distanceInterval: 5,    // Update every 5 meters
  timeInterval: 1000,     // Or every 1 second
};

export const STATIONARY_CONFIG = {
  threshold: 1,           // km/h below which is stationary
  duration: 5,            // Seconds before auto-pause
};
```

## Troubleshooting

### GPS Not Working
- Ensure location permissions are granted
- Check if location services are enabled on device
- Move to area with better GPS signal
- Wait for GPS to acquire satellites (especially indoors)

### Background Tracking Not Working
- Must use development build (not Expo Go)
- Check that background permissions are granted
- On iOS, ensure "Always" location access is enabled
- On Android, check battery optimization settings

### Database Errors
- Clear app data and restart
- Check device storage space
- Reinstall app if persistent

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

Built with ❤️ using Expo and React Native
