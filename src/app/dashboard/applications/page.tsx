import DashboardLayout from "@/components/DashboardLayout";
import ClientApplicationTracker from "@/components/ClientApplicationTracker";

export const metadata = {
  title: "Job Applications · ResumeLens",
};

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <ClientApplicationTracker />
    </DashboardLayout>
  );
}
