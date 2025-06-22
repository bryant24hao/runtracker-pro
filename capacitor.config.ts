import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.wellrun.app",
  appName: "WellRun",
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
