 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Dashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/profile/")
      .then((res) => {
        setName(res.data.name || res.data.email || "");
        setEmail(res.data.email || "");
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <div className="h-8 w-64 bg-slate-200/80 rounded mb-3 animate-pulse" />
        <div className="h-4 w-80 bg-slate-200/60 rounded mb-6 animate-pulse" />
        <div className="h-40 bg-white/60 rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const displayName = name || email || "there";

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Welcome, {displayName}
        </h1>
        {email && name && email !== name && (
          <p className="text-sm text-slate-500 mt-1">{email}</p>
        )}
        <p className="text-sm text-slate-500 mt-2">
          Select a workspace page from the sidebar, or jump into your model overview below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Workspace</CardTitle>
          <CardDescription>
            Configure inputs, run simulations, and explore reports using the sections in the left navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/dashboard/overview")}
          >
            Go to Overview
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push("/dashboard/generaldata")}
          >
            General Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push("/dashboard/productdata")}
          >
            Products
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => router.push("/dashboard/runresults")}
          >
            Run &amp; Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

