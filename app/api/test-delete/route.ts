import { NextResponse } from "next/server"

export async function DELETE() {
  console.log("Test DELETE method called")
  return NextResponse.json({ message: "DELETE method works!" })
}

export async function GET() {
  return NextResponse.json({ message: "Test route works" })
} 