"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterContext } from "@/components/providers/CenterContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function RolesAdminPage() {
  const router = useRouter();
  const { currentCenter } = useCenterContext() || {};

  useEffect(() => {
    if (currentCenter?.slug) {
      router.replace(`/center/${currentCenter.slug}/roles`);
    }
  }, [currentCenter, router]);

  return <LoadingScreen message="Redirigiendo a gestión de roles..." />;
}
