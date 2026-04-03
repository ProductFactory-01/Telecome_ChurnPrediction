"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  return (
    <>
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
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
      </main>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase text-gray-400">Initializing Intelligence Engine...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
