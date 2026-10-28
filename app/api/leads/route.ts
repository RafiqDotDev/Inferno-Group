import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "inferno_leads")
      .maybeSingle();

    if (error) {
      console.error("Error fetching leads from Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let leads = [];
    if (data?.value) {
      try {
        leads = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      } catch {
        leads = [];
      }
    }

    return NextResponse.json({ success: true, leads, count: Array.isArray(leads) ? leads.length : 0 });
  } catch (err: any) {
    console.error("API /api/leads GET unexpected exception:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid lead payload." }, { status: 400 });
    }

    const newLead = {
      id: body.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: body.type || "contact",
      name: body.name || body.contactName || "Portal Inquirer",
      contactName: body.contactName || body.name,
      email: body.email || body.contactEmail || "",
      contactEmail: body.contactEmail || body.email,
      phone: body.phone || "",
      company: body.company || body.org || body.partnerCompany || "",
      partnerCompany: body.partnerCompany || body.company,
      org: body.org || body.company,
      service: body.service || "",
      message: body.message || body.notes || "",
      notes: body.notes || body.message || "",
      jobId: body.jobId,
      jobTitle: body.jobTitle,
      cover: body.cover,
      resumeName: body.resumeName,
      resumeData: body.resumeData,
      solicitation: body.solicitation,
      contractTitle: body.contractTitle,
      agency: body.agency,
      teamingRole: body.teamingRole,
      partnerType: body.partnerType,
      certStatus: body.certStatus,
      bondingCapacity: body.bondingCapacity,
      consultType: body.consultType,
      timezone: body.timezone,
      date: body.date,
      time: body.time,
      answers: body.answers,
      recommendations: body.recommendations,
      resourceId: body.resourceId,
      resourceTitle: body.resourceTitle,
      applicationDetails: body.applicationDetails,
      workAuthorization: body.workAuthorization || body.applicationDetails?.workAuthorization,
      securityClearance: body.securityClearance || body.applicationDetails?.securityClearance,
      yearsExperience: body.yearsExperience || body.applicationDetails?.yearsExperience,
      educationLevel: body.educationLevel || body.applicationDetails?.educationLevel,
      certifications: body.certifications || body.applicationDetails?.certifications,
      willingToTravel: body.willingToTravel || body.applicationDetails?.willingToTravel,
      earliestStartDate: body.earliestStartDate || body.applicationDetails?.earliestStartDate,
      desiredCompensation: body.desiredCompensation || body.applicationDetails?.desiredCompensation,
      digitalSignature: body.digitalSignature || body.applicationDetails?.digitalSignature,
      attestationConfirmed: body.attestationConfirmed ?? body.applicationDetails?.attestationConfirmed,
      cityStateZip: body.cityStateZip || body.applicationDetails?.cityStateZip,
      linkedinUrl: body.linkedinUrl || body.applicationDetails?.linkedinUrl,
      status: body.status || "new",
      adminNotes: body.adminNotes || "",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // 1. Fetch current leads
    const { data: currentData, error: fetchErr } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "inferno_leads")
      .maybeSingle();

    if (fetchErr) {
      console.warn("Could not retrieve current leads from Supabase, initializing list:", fetchErr);
    }

    let currentLeads: any[] = [];
    if (currentData?.value) {
      try {
        currentLeads = typeof currentData.value === "string" ? JSON.parse(currentData.value) : currentData.value;
      } catch {
        currentLeads = [];
      }
    }
    if (!Array.isArray(currentLeads)) currentLeads = [];

    // 2. Prepend new lead and persist
    const updatedLeads = [newLead, ...currentLeads.filter((l) => l.id !== newLead.id)];

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: "inferno_leads",
      value: JSON.stringify(updatedLeads),
    });

    if (saveErr) {
      console.error("Error saving lead into Supabase:", saveErr);
      return NextResponse.json({ success: false, error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: newLead, totalCount: updatedLeads.length });
  } catch (err: any) {
    console.error("API /api/leads POST unexpected exception:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to submit lead" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing lead id." }, { status: 400 });
    }

    const { data: currentData, error: fetchErr } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "inferno_leads")
      .maybeSingle();

    if (fetchErr || !currentData?.value) {
      return NextResponse.json({ success: false, error: "Leads store not found." }, { status: 404 });
    }

    let currentLeads: any[] = [];
    try {
      currentLeads = typeof currentData.value === "string" ? JSON.parse(currentData.value) : currentData.value;
    } catch {
      currentLeads = [];
    }

    const updatedLeads = currentLeads.map((l) => {
      if (l.id === id) {
        return {
          ...l,
          ...(status !== undefined ? { status } : {}),
          ...(adminNotes !== undefined ? { adminNotes } : {}),
        };
      }
      return l;
    });

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: "inferno_leads",
      value: JSON.stringify(updatedLeads),
    });

    if (saveErr) {
      return NextResponse.json({ success: false, error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing lead id parameter." }, { status: 400 });
    }

    const { data: currentData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "inferno_leads")
      .maybeSingle();

    let currentLeads: any[] = [];
    if (currentData?.value) {
      try {
        currentLeads = typeof currentData.value === "string" ? JSON.parse(currentData.value) : currentData.value;
      } catch {
        currentLeads = [];
      }
    }

    const updatedLeads = currentLeads.filter((l) => l.id !== id);

    const { error: saveErr } = await supabase.from("settings").upsert({
      key: "inferno_leads",
      value: JSON.stringify(updatedLeads),
    });

    if (saveErr) {
      return NextResponse.json({ success: false, error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

