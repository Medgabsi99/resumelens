import DashboardLayout from "@/components/DashboardLayout";
import ApplicationTracker from "@/components/ApplicationTracker";

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
