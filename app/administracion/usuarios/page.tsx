"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterContext } from "@/components/providers/CenterContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function UsuariosAdminPage() {
  const router = useRouter();
  const { currentCenter } = useCenterContext() || {};

  useEffect(() => {
    if (currentCenter?.slug) {
      router.replace(`/center/${currentCenter.slug}/users`);
    }
  }, [currentCenter, router]);

  return <LoadingScreen message="Redirigiendo a gestión de usuarios..." />;
}
