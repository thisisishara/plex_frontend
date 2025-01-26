import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { sourceName, quarter, useRAG } = await request.json();

  // Simulate CSV generation
  const csvData = `Quarter,Revenue,Expenses,Profit\nQ${quarter},100000,70000,30000`;

  return NextResponse.json({ success: true, csv: csvData });
}