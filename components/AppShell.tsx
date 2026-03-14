import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getNavigationForRole } from "@/lib/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  title: string;
  description: string;
  organizationName?: string | null;
  userEmail: string;
  notificationCount?: number;
  children: ReactNode;
}

export async function AppShell({
  title,
  description,
  organizationName,
  userEmail,
  notificationCount,
  children,
}: AppShellProps) {
  const currentUser = await getCurrentUser();
  const navigation = getNavigationForRole(currentUser?.profile.role);

  return (
    <div className="section-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 lg:flex-row">
        <Sidebar navigation={navigation} />
        <main className="min-w-0 flex-1 space-y-6 pb-6">
          <Navbar
            title={title}
            description={description}
            organizationName={organizationName}
            userEmail={userEmail}
            notificationCount={notificationCount}
            navigation={navigation}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
