import { NextRequest, NextResponse } from "next/server";
import { logVisitor } from "./lib/logVisitor";

export async function middleware(req: NextRequest) {
  await logVisitor(req);
  return NextResponse.next();
}
