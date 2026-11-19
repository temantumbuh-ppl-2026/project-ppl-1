import { AdminSafetyDetailClient } from "@/components/admin/AdminSafetyDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSafetyDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminSafetyDetailClient id={id} />;
}
