import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAudit } from "@/lib/services/audit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const audit = await db.seoAudit.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        status: "pending",
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found or already started" },
        { status: 404 }
      );
    }

    // Fire and forget — don't await the full pipeline
    runAudit(id).catch((error) => {
      console.error(`Audit ${id} failed:`, error);
    });

    return NextResponse.json({ message: "Audit started", id });
  } catch (error) {
    console.error("Audit execute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
