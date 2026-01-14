import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create server-side Supabase client (dengan service role key untuk bypass RLS jika ada)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    // Get auth header dari request
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    // Verify token dan get user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(
      token
    );

    if (authErr || !userData.user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authErr?.message },
        { status: 401 }
      );
    }

    const user = userData.user;
    const { fullName, role } = await req.json();

    if (!fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, role" },
        { status: 400 }
      );
    }

    // Insert atau update profiles
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName.trim(),
          role: role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select();

    if (error) {
      console.error("Profiles upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save profile", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Profile saved successfully",
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
