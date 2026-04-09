"use client";

import { useEffect, useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const verify = async () => {
            try {
                await authClient.verifyEmail({
                    query: {
                        token: token
                    }
                }, {
                    onSuccess: () => {
                        setStatus("success");
                        setMessage("Your email has been successfully verified!");
                    },
                    onError: (ctx) => {
                        setStatus("error");
                        setMessage(ctx.error.message || "An error occurred during verification.");
                    }
                });
            } catch (err) {
                setStatus("error");
                setMessage("An unexpected error occurred. Please try again.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Email Verification</h1>
                
                <div className={`p-4 rounded-lg border ${
                    status === "pending" ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400" :
                    status === "success" ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50 text-green-600 dark:text-green-400" :
                    "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400"
                }`}>
                    {message}
                </div>

                {status !== "pending" && (
                    <Link
                        href="/sign-in"
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2 mt-4"
                    >
                        Go to Sign In
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
