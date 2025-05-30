import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password } = body;

		const apiResponse = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			}
		);

		const data = await apiResponse.json();

		if (!apiResponse.ok) {
			return NextResponse.json(
				{ message: data.message || "Login failed" },
				{ status: apiResponse.status }
			);
		}

		// Create the response with the success message
		const response = NextResponse.json({ message: "Login successful" });

		// Set HTTP-only cookie with the JWT token
		response.cookies.set("token", data.token, {
			httpOnly: true,
			secure: false,
			sameSite: "strict",
			path: "/",
			maxAge: 30 * 24 * 60 * 60, // 30 days
		});

		return response;
	} catch (error: unknown) {
		return NextResponse.json(
			{ message: (error as Error).message || "An error occurred" },
			{ status: 500 }
		);
	}
}
