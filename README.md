# Smart Weather Monitoring System

An IoT-based weather monitoring platform that collects environmental data from ESP32 sensors and visualizes real-time measurements through a web dashboard.

The system combines sensor data collection, backend processing, data storage, real-time visualization, AI-powered insights, and push notifications in one platform.

## Live Demo

- **GitHub Repository:** https://github.com/huuha205/WeatherStation
- **Dashboard:** Add your deployed dashboard URL if publicly accessible.

## Key Features

- **Environmental Monitoring:** Collect temperature, humidity, atmospheric pressure, rainfall, and light intensity from ESP32 sensors.
- **Real-Time Dashboard:** Visualize incoming sensor measurements and update the dashboard using Socket.IO.
- **REST API:** Receive sensor data from ESP32 through HTTP POST requests.
- **Data Storage:** Store and manage weather measurements using SQLite.
- **AI-Powered Insights:** Integrate Google Gemini to generate explanations or insights from weather data.
- **Push Notifications:** Use Firebase Cloud Messaging to deliver notifications to supported clients.

## Tech Stack

| Component | Technologies |
|---|---|
| Backend | Node.js, Express.js |
| Database | SQLite |
| Real-Time Communication | Socket.IO |
| Frontend | EJS, HTML, CSS, JavaScript |
| IoT Hardware | ESP32, environmental sensors |
| AI Integration | Google Gemini API |
| Push Notifications | Firebase Cloud Messaging |

## System Architecture

```text
Environmental Sensors
        |
        v
      ESP32
        |
        | HTTP POST
        v
 Node.js + Express API
        |
        v
     SQLite
        |
        v
 Web Dashboard
        |
        +---- Socket.IO
        |
        +---- Google Gemini
        |
        +---- Firebase Cloud Messaging
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/huuha205/WeatherStation.git
   cd WeatherStation
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   Create a `.env` file based on `.env.example` and configure the required credentials for the services used by your application.

4. Configure Firebase Messaging if push notifications are enabled. Use your own Firebase project configuration and follow the project's implementation requirements.

5. Start the development server:

   ```bash
   npx nodemon app.js
   ```

6. Open the dashboard:

   http://localhost:3000

## ESP32 Sensor API

**Endpoint**

`POST /api/sensor`

**Content-Type**

`application/json`

**Example request body**

```json
{
  "temperature": 29.8,
  "humidity": 70.0,
  "pressure": 1005.0,
  "rain": 0,
  "light": 320
}
```

Replace the server address with the IP address of the computer running the backend when sending data from an ESP32 on the same local network.

## Project Leadership & Contributions

**Role: Team Leader & Web Dashboard Developer**

- Led the development process and coordinated the team's implementation activities.
- Designed and developed the web dashboard for weather monitoring.
- Implemented backend endpoints for receiving sensor data from ESP32.
- Integrated real-time data communication and database storage.
- Worked on AI integration and push notification functionality.

*Adjust the contribution list to reflect the parts you personally implemented and the responsibilities you actually held.*

## Security Notes

- Never commit API keys, Firebase private credentials, or other secrets to the repository.
- Configure environment variables before running the application.
- Change default credentials before deploying the system in a public environment.

## License

Add a license if you intend to distribute this project for reuse.
