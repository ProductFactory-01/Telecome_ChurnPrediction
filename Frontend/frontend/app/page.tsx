"use client";
import { useState } from "react";
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
import CustomerDetailView from "../components/customer-details/CustomerDetailView";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleViewCustomer = (id: string) => setSelectedCustomerId(id);
  const closeCustomerDetail = () => setSelectedCustomerId(null);

  return (
    <>
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "data-agent" && <DataAgentTab />}
        {activeTab === "churn-scoring" && <ChurnScoringTab onViewCustomer={handleViewCustomer} />}
        {activeTab === "offer-engine" && <OfferEngineTab />}
        {activeTab === "outreach" && <OutreachTab />}
        {activeTab === "live-impact" && <LiveImpactTab />}
        {activeTab === "data-explorer" && <DataExplorerTab />}
        {activeTab === "ml-models" && <MlModelsTab />}
        {activeTab === "role-views" && <RoleViewsTab />}
        {activeTab === "milestones" && <MilestonesTab />}
      </main>

      {selectedCustomerId && (
        <CustomerDetailView customerId={selectedCustomerId} onClose={closeCustomerDetail} />
      )}
    </>
  );
}
