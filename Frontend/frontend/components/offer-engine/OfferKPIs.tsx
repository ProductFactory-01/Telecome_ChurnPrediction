import KpiCard from "../shared/KpiCard";

interface OfferKPIsProps {
  generatedCount: number;
  totalCustomers: number;
  gamificationActive?: boolean; 
  revenueProtected?: number;  
}

export default function OfferKPIs({
  generatedCount = 0,
  totalCustomers = 0,
}: OfferKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <KpiCard 
        label="Offers Generated" 
        value={(generatedCount || 0).toLocaleString()} 
        sub="Personalized Retention Protocols"
        color="green" 
      />
      
      <KpiCard 
        label="Total Customers" 
        value={(totalCustomers || 0).toLocaleString()} 
        sub="Eligible for Retention Strategy"
        color="amber" 
      />
    </div>
  );
}
