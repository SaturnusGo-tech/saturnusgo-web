import { notFound } from "next/navigation";
import { JOBS, JOB_MAP, type Job }  from "../../../../../shared/lib/jobs";
import JobDetailClient from "./JobDetailClient";

// Жёстко статический сегмент (для GitHub Pages / export)
export const dynamic = "error";
export const dynamicParams = false;

// Next нужен полный список id для статического экспорта
export function generateStaticParams() {
  return JOBS.map((j) => ({ id: j.id }));
}

export default function Page({ params }: { params: { id: string } }) {
  const job: Job | undefined = JOB_MAP[params.id];
  if (!job) return notFound();

  // Передаём статический снэпшот (клиент может дообновить из query/localStorage)
  return <JobDetailClient id={params.id} initialJob={job} />;
}
