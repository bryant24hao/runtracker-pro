"use client"

import { useState, useEffect } from "react"

interface AppleFitnessHook {
  isAvailable: boolean
  isAuthorized: boolean
  requestPermissions: () => Promise<boolean>
  queryWorkouts: (options: {
    startDate: Date
    endDate: Date
    workoutType?: string
  }) => Promise<any[]>
  queryWorkoutDetails: (workoutId: string) => Promise<any>
  queryHeartRateData: (workoutId: string) => Promise<any[]>
  queryWorkoutRoute: (workoutId: string) => Promise<any>
}

export function useAppleFitness(): AppleFitnessHook {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAvailability()
  }, [])

  const checkAvailability = async () => {
    try {
      if (window.Capacitor?.Plugins?.HealthKit) {
        const { HealthKit } = window.Capacitor.Plugins
        const available = await HealthKit.isAvailable()
        setIsAvailable(available.isAvailable)
      }
    } catch (error) {
      console.error("Apple Fitness not available:", error)
      setIsAvailable(false)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    if (!isAvailable) return false

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.requestPermissions({
        read: [
          "HKWorkoutTypeIdentifier",
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierRunningSpeed",
          "HKQuantityTypeIdentifierRunningPower",
          "HKSeriesTypeWorkoutRoute",
        ],
        write: [],
      })

      setIsAuthorized(result.granted)
      return result.granted
    } catch (error) {
      console.error("Failed to request Apple Fitness permissions:", error)
      return false
    }
  }

  const queryWorkouts = async (options: {
    startDate: Date
    endDate: Date
    workoutType?: string
  }) => {
    if (!isAvailable || !isAuthorized) return []

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.queryWorkouts({
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        workoutType: options.workoutType || "HKWorkoutActivityTypeRunning",
      })

      return result.workouts || []
    } catch (error) {
      console.error("Failed to query workouts:", error)
      return []
    }
  }

  const queryWorkoutDetails = async (workoutId: string) => {
    if (!isAvailable || !isAuthorized) return null

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.queryWorkoutDetails({
        workoutUUID: workoutId,
      })

      return result.workout
    } catch (error) {
      console.error("Failed to query workout details:", error)
      return null
    }
  }

  const queryHeartRateData = async (workoutId: string) => {
    if (!isAvailable || !isAuthorized) return []

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.querySamples({
        sampleType: "HKQuantityTypeIdentifierHeartRate",
        workoutUUID: workoutId,
      })

      return result.samples || []
    } catch (error) {
      console.error("Failed to query heart rate data:", error)
      return []
    }
  }

  const queryWorkoutRoute = async (workoutId: string) => {
    if (!isAvailable || !isAuthorized) return null

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.queryWorkoutRoutes({
        workoutUUID: workoutId,
      })

      return result.routes?.[0] || null
    } catch (error) {
      console.error("Failed to query workout route:", error)
      return null
    }
  }

  return {
    isAvailable,
    isAuthorized,
    requestPermissions,
    queryWorkouts,
    queryWorkoutDetails,
    queryHeartRateData,
    queryWorkoutRoute,
  }
}
