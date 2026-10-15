import { Suspense } from "react";
import AssetDetail from "../../../components/AssetDetail";

// Reads the :id part of the URL (/assets/abc-123) and hands it to the component
async function AssetLoader({ params }) {
  const { id } = await params;
  return <AssetDetail id={id} />;
}

export default function AssetPage({ params }) {
  return (
    <Suspense fallback={<p className="empty-state">Loading equipment...</p>}>
      <AssetLoader params={params} />
    </Suspense>
  );
}