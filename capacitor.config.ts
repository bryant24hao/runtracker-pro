import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.runtracker.app",
  appName: "RunTracker Pro",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    HealthKit: {
      permissions: {
        read: [
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierStepCount",
          "HKWorkoutTypeIdentifier",
        ],
      },
    },
  },
}

export default config
