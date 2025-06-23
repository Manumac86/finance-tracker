import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectBudgetAlerts, acknowledgeBudgetAlert } from "@/lib/db/postgres";
import { transformBudgetAlertToUI } from "@/lib/db/schemas/budget";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unacknowledgedOnly = searchParams.get("unacknowledged") === "true";

    // Fetch budget alerts from database
    const alerts = await selectBudgetAlerts(userId, unacknowledgedOnly);

    // Transform to UI format
    const enrichedAlerts = alerts.map(transformBudgetAlertToUI);

    return NextResponse.json({ alerts: enrichedAlerts });
  } catch (error) {
    console.error("Error fetching budget alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alertId } = await request.json();
    
    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

    // Acknowledge the alert
    const acknowledgedAlert = await acknowledgeBudgetAlert(alertId, userId);

    // Transform to UI format
    const enrichedAlert = transformBudgetAlertToUI(acknowledgedAlert);

    return NextResponse.json({ alert: enrichedAlert });
  } catch (error) {
    console.error("Error acknowledging budget alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge budget alert" },
      { status: 500 }
    );
  }
}