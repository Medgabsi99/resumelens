import DashboardLayout from "@/components/DashboardLayout";
import dynamic from "next/dynamic";

const ApplicationTracker = dynamic(() => import("@/components/ApplicationTracker"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted">Loading Applications...</div>,
});

export const metadata = {
  title: "Job Applications · ResumeLens",
};

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <ApplicationTracker />
    </DashboardLayout>
  );
}
