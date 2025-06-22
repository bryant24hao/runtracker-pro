import { NextRequest, NextResponse } from "next/server"

export async function OPTIONS(request: NextRequest) {
  console.log("🔧 Test OPTIONS method called")
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function DELETE(request: NextRequest) {
  console.log("🧪 Test DELETE method called successfully!")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  
  return NextResponse.json({ 
    success: true,
    message: "DELETE method works perfectly!",
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function GET(request: NextRequest) {
  console.log("🧪 Test GET method called")
  return NextResponse.json({ 
    message: "Test route works",
    availableMethods: ["GET", "DELETE"],
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log("🧪 Test POST method called")
  return NextResponse.json({ 
    message: "POST method also works",
    timestamp: new Date().toISOString()
  })
} 