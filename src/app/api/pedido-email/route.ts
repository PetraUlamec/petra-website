import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Los recibos se envían exclusivamente tras confirmar el pago." }, { status: 410 });
}
