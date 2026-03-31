import { NextResponse } from "next/server";
import { spawn } from "child_process";

// Note: Vercel serverless functions have a 10s timeout on Hobby plan.
// This route works best locally or on Vercel Pro (60s timeout).

export async function POST() {
  const start = Date.now();

  return new Promise<NextResponse>((resolve) => {
    let stdout = "";
    let stderr = "";
    let finished = false;

    const proc = spawn("python", ["jobs/run_inference.py"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      },
    });

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        proc.kill();
        resolve(
          NextResponse.json(
            { error: "Scoring timed out after 60 seconds" },
            { status: 504 }
          )
        );
      }
    }, 60000);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      resolve(
        NextResponse.json({
          success: code === 0,
          stdout,
          stderr,
          duration_ms: Date.now() - start,
        })
      );
    });

    proc.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      resolve(
        NextResponse.json(
          {
            error: `Failed to start Python process: ${err.message}`,
            success: false,
            stdout: "",
            stderr: err.message,
            duration_ms: Date.now() - start,
          },
          { status: 500 }
        )
      );
    });
  });
}
