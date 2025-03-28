export async function GET(request: Request) {
	let imageId = request.nextUrl.searchParams["id"] as string;

	return NextResponse.json({ "id": imageId }, { status: 200 });
}
