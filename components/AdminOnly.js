import Link from "next/link";

// Shown instead of a page that only administrators may use
export default function AdminOnly() {
  return (
    <div className="panel">
      <h2 className="panel-title">Administrators only</h2>
      <p className="empty-state">
        This page is only available to helpdesk administrators.
      </p>
      <Link href="/" className="link-action">
        Back to home
      </Link>
    </div>
  );
}