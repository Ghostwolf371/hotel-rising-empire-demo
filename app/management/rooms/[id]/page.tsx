"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoomDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/management/rooms");
  }, [router]);
  return null;
}
