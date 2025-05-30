import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const token = request.cookies.get("token")?.value;
		console.log("Token from cookies:", token); // Debug log

		if (!token) {
			return NextResponse.json(
				{ message: "Not authenticated - No token found" },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const response = await fetch(`${API_URL}/api/notes/${id}`, {
			headers: {
				Cookie: `token=${token}`,
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		console.log("Backend response:", data); // Debug log

		if (!response.ok) {
			return NextResponse.json(
				{ message: data.message || "Failed to fetch note" },
				{ status: response.status }
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error in GET /api/notes/[id]:", error); // Debug log
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
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

		const { id } = await params;
		const response = await fetch(`${API_URL}/api/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Cookie: `token=${token}`,
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		console.log("Backend response:", data); // Debug log

		if (!response.ok) {
			return NextResponse.json(
				{ message: data.message || "Failed to update note" },
				{ status: response.status }
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error in PUT /api/notes/[id]:", error); // Debug log
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const token = request.cookies.get("token")?.value;

		if (!token) {
			return NextResponse.json(
				{ message: "Not authenticated" },
				{ status: 401 }
			);
		}

		const { id } = await params;
		const response = await fetch(`${API_URL}/api/notes/${id}`, {
			method: "DELETE",
			headers: {
				Cookie: `token=${token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			return NextResponse.json(
				{ message: data.message || "Failed to delete note" },
				{ status: response.status }
			);
		}

		return NextResponse.json(data);
	} catch {
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
