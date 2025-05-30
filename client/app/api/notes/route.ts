import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("Token from cookies:", token); // Debug log
    
    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated - No token found" },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/api/notes`, {
      headers: {
        Cookie: `token=${token}`,
        Authorization: `Bearer ${token}`, // Add token to Authorization header as well
      },
    });

    const data = await response.json();
    console.log("Backend response:", data); // Debug log

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch notes" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/notes:", error); // Debug log
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("Token from cookies:", token); // Debug log
    
    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated - No token found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body); // Debug log

    const response = await fetch(`${API_URL}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${token}`,
        Authorization: `Bearer ${token}`, // Add token to Authorization header as well
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Backend response:", data); // Debug log

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to create note" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/notes:", error); // Debug log
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 