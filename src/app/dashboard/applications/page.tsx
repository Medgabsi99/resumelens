import DashboardLayout from "@/components/DashboardLayout";
import ClientApplicationTracker from "@/components/ClientApplicationTracker";

export const metadata = {
  title: "Job Applications · ResumeLens",
};

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <div className="workspace-canvas">
        <div className="max-w-7xl mx-auto">
          <ClientApplicationTracker />
        </div>
      </div>
    </DashboardLayout>
  );
}
