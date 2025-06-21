"use client"

import { useState, useEffect } from "react"

interface HealthKitHook {
  isAvailable: boolean
  isAuthorized: boolean
  requestPermissions: () => Promise<boolean>
  queryWorkouts: (options: {
    startDate: Date
    endDate: Date
    workoutType?: string
  }) => Promise<any[]>
  querySamples: (options: {
    sampleType: string
    startDate: Date
    endDate: Date
  }) => Promise<any[]>
}

export function useHealthKit(): HealthKitHook {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    checkAvailability()
  }, [])

  const checkAvailability = async () => {
    try {
      // 检查是否在Capacitor环境中
      if (window.Capacitor?.Plugins?.HealthKit) {
        const { HealthKit } = window.Capacitor.Plugins
        const available = await HealthKit.isAvailable()
        setIsAvailable(available.isAvailable)
      }
    } catch (error) {
      console.error("HealthKit not available:", error)
      setIsAvailable(false)
    }
  }

  const requestPermissions = async (): Promise<boolean> => {
    if (!isAvailable) return false

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.requestPermissions({
        read: [
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierStepCount",
          "HKWorkoutTypeIdentifier",
        ],
        write: [],
      })

      setIsAuthorized(result.granted)
      return result.granted
    } catch (error) {
      console.error("Failed to request HealthKit permissions:", error)
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

  const querySamples = async (options: {
    sampleType: string
    startDate: Date
    endDate: Date
  }) => {
    if (!isAvailable || !isAuthorized) return []

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const result = await HealthKit.querySamples({
        sampleType: options.sampleType,
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
      })

      return result.samples || []
    } catch (error) {
      console.error("Failed to query samples:", error)
      return []
    }
  }

  return {
    isAvailable,
    isAuthorized,
    requestPermissions,
    queryWorkouts,
    querySamples,
  }
}
