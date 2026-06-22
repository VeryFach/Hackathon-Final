import { NextRequest, NextResponse } from "next/server";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = new URL(`/api/${path.join("/")}`, apiUrl);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text(),
    redirect: "manual",
  };

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
