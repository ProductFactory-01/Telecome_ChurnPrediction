"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import TabNavigation from "../components/layout/TabNavigation";
import OverviewTab from "../components/overview/OverviewTab";
import DataAgentTab from "../components/data-agent/DataAgentTab";
import ChurnScoringTab from "../components/churn-scoring/ChurnScoringTab";
import OfferEngineTab from "../components/offer-engine/OfferEngineTab";
import OutreachTab from "../components/outreach/OutreachTab";
import LiveImpactTab from "../components/live-impact/LiveImpactTab";
import DataExplorerTab from "../components/data-explorer/DataExplorerTab";
import MlModelsTab from "../components/ml-models/MlModelsTab";
import RoleViewsTab from "../components/role-views/RoleViewsTab";
import MilestonesTab from "../components/milestones/MilestonesTab";

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Auth Check
    const token = typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-2 min-h-[calc(100vh-160px)]">
        <div className="animate-in fade-in-20 duration-500">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "data-agent" && <DataAgentTab />}
          {activeTab === "churn-scoring" && <ChurnScoringTab />}
          {activeTab === "offer-engine" && <OfferEngineTab />}
          {activeTab === "outreach" && <OutreachTab />}
          {activeTab === "live-impact" && <LiveImpactTab />}
          {activeTab === "data-explorer" && <DataExplorerTab />}
          {activeTab === "ml-models" && <MlModelsTab />}
          {activeTab === "role-views" && <RoleViewsTab />}
          {activeTab === "milestones" && <MilestonesTab />}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase text-gray-400">Initializing Intelligence Engine...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
