import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claimsSnap = await get(ref(db, 'claims'));
    let claims: any[] = [];

    if (claimsSnap.exists()) {
      claimsSnap.forEach(c => {
        const val = c.val();
        if (!val.deletedAt) {
          claims.push({ id: c.key, ...val });
        }
      });
    }

    // Sort claims by created date
    claims.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const analytics = {
      byDay: {} as Record<string, { submitted: number, paid: number, amount: number }>,
      byWeek: {} as Record<string, { submitted: number, paid: number, amount: number }>,
      byMonth: {} as Record<string, { submitted: number, paid: number, amount: number }>,
      byYear: {} as Record<string, { submitted: number, paid: number, amount: number }>,
    };

    claims.forEach(claim => {
      const createdDate = new Date(claim.createdAt);
      const day = format(createdDate, "yyyy-MM-dd");
      const week = format(startOfWeek(createdDate), "yyyy-MM-dd");
      const month = format(startOfMonth(createdDate), "yyyy-MM");
      const year = format(startOfYear(createdDate), "yyyy");

      // Initialize if not present
      if (!analytics.byDay[day]) analytics.byDay[day] = { submitted: 0, paid: 0, amount: 0 };
      if (!analytics.byWeek[week]) analytics.byWeek[week] = { submitted: 0, paid: 0, amount: 0 };
      if (!analytics.byMonth[month]) analytics.byMonth[month] = { submitted: 0, paid: 0, amount: 0 };
      if (!analytics.byYear[year]) analytics.byYear[year] = { submitted: 0, paid: 0, amount: 0 };

      // Submitted Count
      analytics.byDay[day].submitted++;
      analytics.byWeek[week].submitted++;
      analytics.byMonth[month].submitted++;
      analytics.byYear[year].submitted++;

      // Paid Count & Amount - Modified to include all PAID claims
      if (claim.status === "PAID") {
        const pDateStr = claim.paidAt || claim.createdAt;
        const paidDate = new Date(pDateStr);
        const pDay = format(paidDate, "yyyy-MM-dd");
        const pWeek = format(startOfWeek(paidDate), "yyyy-MM-dd");
        const pMonth = format(startOfMonth(paidDate), "yyyy-MM");
        const pYear = format(startOfYear(paidDate), "yyyy");

        if (!analytics.byDay[pDay]) analytics.byDay[pDay] = { submitted: 0, paid: 0, amount: 0 };
        if (!analytics.byWeek[pWeek]) analytics.byWeek[pWeek] = { submitted: 0, paid: 0, amount: 0 };
        if (!analytics.byMonth[pMonth]) analytics.byMonth[pMonth] = { submitted: 0, paid: 0, amount: 0 };
        if (!analytics.byYear[pYear]) analytics.byYear[pYear] = { submitted: 0, paid: 0, amount: 0 };

        analytics.byDay[pDay].paid++;
        analytics.byWeek[pWeek].paid++;
        analytics.byMonth[pMonth].paid++;
        analytics.byYear[pYear].paid++;

        const amt = parseFloat(claim.approvedAmount || claim.claimAmount || 0);
        analytics.byDay[pDay].amount += amt;
        analytics.byWeek[pWeek].amount += amt;
        analytics.byMonth[pMonth].amount += amt;
        analytics.byYear[pYear].amount += amt;
      }
    });

    const formatData = (obj: any, keyName: string) => Object.entries(obj).map(([key, val]: [string, any]) => ({
      [keyName]: key,
      ...val
    })).sort((a: any, b: any) => a[keyName].localeCompare(b[keyName]));

    return NextResponse.json({
      byDay: formatData(analytics.byDay, "date"),
      byWeek: formatData(analytics.byWeek, "week"),
      byMonth: formatData(analytics.byMonth, "month"),
      byYear: formatData(analytics.byYear, "year"),
    });
  } catch (error) {
    console.error("Error fetching claims analytics:", error);
    return NextResponse.json({ error: "Failed to fetch claims analytics" }, { status: 500 });
  }
}
