"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import FullScreenLoader from "@/app/components/FullScreenLoader";

export default function MePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/me/account");
    }, [router]);

    return <FullScreenLoader />;
}
