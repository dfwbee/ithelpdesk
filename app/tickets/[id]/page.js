import { Suspense } from "react";
import TicketDetail from "../../../components/TicketDetail";

// Reads the :id part of the URL (/tickets/TKT-1001) and hands it to the component
async function TicketLoader({ params }) {
  const { id } = await params;
  return <TicketDetail id={id} />;
}

export default function TicketPage({ params }) {
  return (
    <Suspense fallback={<p className="empty-state">Loading ticket...</p>}>
      <TicketLoader params={params} />
    </Suspense>
  );
}