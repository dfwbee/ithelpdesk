"use client";

import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useTickets } from "./TicketsProvider";
import { useAssets } from "./AssetsProvider";
import MyEquipment from "./MyEquipment";
import TicketForm from "./TicketForm";
import TicketTable from "./TicketTable";
import { SignalArt, greeting, firstName } from "./Visuals";
import { assetLabel } from "../lib/helpers";

// The home page for regular users: submit a ticket and follow your own tickets
export default function UserHome() {
  const { user, profile } = useAuth();
  const { tickets, ready, loadError } = useTickets();
  const { assets } = useAssets();
  const [message, setMessage] = useState("");
  // Pressing "Report a problem" on an item fills it into the form below
  const [report, setReport] = useState({ assetId: "", count: 0 });
  const formRef = useRef(null);

  function reportProblem(assetId) {
    setReport((current) => ({ assetId, count: current.count + 1 }));
    setMessage("");
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const myName = (profile && profile.fullName) || (user && user.email) || "";

  // The database already hides other people's tickets.
  // This filter is a second safety net.
  const mine = tickets
    .filter((t) => user && t.createdBy === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const waiting = mine.filter((t) => t.status !== "Resolved").length;

  return (
    <div>
      <section className="hero hero-compact">
        <div className="hero-copy">
          <h1 className="hero-title">
            {greeting()}, {firstName(myName)}.
          </h1>
          <p className="hero-sub">
            {waiting > 0 ? (
              <>
                You have <strong>{waiting}</strong>{" "}
                {waiting === 1 ? "request" : "requests"} with the IT team.
                Something else not working? Tell us below.
              </>
            ) : (
              "Something not working? Tell the IT team below and follow your request here."
            )}
          </p>
        </div>
        <SignalArt />
      </section>

      {message && <div className="alert alert-success">{message}</div>}
      {loadError && <div className="alert alert-error">{loadError}</div>}

      <MyEquipment onReport={reportProblem} />

      <div className="panel form-panel" ref={formRef}>
        <div className="panel-header">
          <h2 className="panel-title">Submit a ticket</h2>
        </div>
        <TicketForm
          key={report.count}
          equipment={assets.map((a) => ({ id: a.id, label: assetLabel(a) }))}
          defaultAssetId={report.assetId}
          requesterName={myName}
          lockRequester
          onCreated={(ticket) =>
            setMessage(
              "Ticket " + ticket.id + " submitted. The IT team will pick it up."
            )
          }
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Your tickets ({mine.length})</h2>
        </div>
        {ready ? (
          <TicketTable
            tickets={mine}
            emptyMessage="You have not submitted any tickets yet."
          />
        ) : (
          <p className="empty-state">Loading tickets...</p>
        )}
      </div>
    </div>
  );
}