"use client";

import { useAssets } from "./AssetsProvider";
import { useTickets } from "./TicketsProvider";
import Icon from "./Icons";
import { assetStatusClass, warrantyInfo, formatDate } from "../lib/helpers";

// The equipment an admin has assigned to the signed-in user (regular users only).
// The database only ever sends them their own items.
export default function MyEquipment({ onReport }) {
  const { assets, ready, holderOf, logsOf } = useAssets();
  const { tickets } = useTickets();

  // Nothing assigned yet, so there is nothing to show
  if (!ready || assets.length === 0) return null;

  return (
    <div className="panel equipment-panel">
      <div className="panel-header">
        <h2 className="panel-title">My equipment ({assets.length})</h2>
      </div>
      <div className="equipment-grid">
        {assets.map((asset) => {
          const holder = holderOf(asset.id);
          const lastLog = logsOf(asset.id)[0];
          const warranty = warrantyInfo(asset.warrantyEnd);
          const count = tickets.filter((t) => t.assetId === asset.id).length;
          return (
            <div className="equipment-card" key={asset.id}>
              <div className="equipment-top">
                <span className="stat-icon tone-open">
                  <Icon name="laptop" size={18} />
                </span>
                <span className={assetStatusClass(asset.status)}>
                  {asset.status}
                </span>
              </div>
              <div className="equipment-tag">{asset.tag}</div>
              <div className="equipment-model">{asset.model}</div>
              <dl className="equipment-facts">
                <dt>Given to you</dt>
                <dd>{holder ? formatDate(holder.assignedAt) : "Not recorded"}</dd>
                <dt>Warranty</dt>
                <dd>
                  <span className={"badge badge-warranty-" + warranty.tone}>
                    {warranty.label}
                  </span>
                </dd>
                <dt>Last maintenance</dt>
                <dd>
                  {lastLog
                    ? lastLog.kind + ", " + formatDate(lastLog.doneOn)
                    : "None recorded"}
                </dd>
                <dt>Tickets</dt>
                <dd>{count === 0 ? "None" : count}</dd>
              </dl>
              <button
                type="button"
                className="btn btn-secondary equipment-report"
                onClick={() => onReport(asset.id)}
              >
                <Icon name="alert" size={16} />
                Report a problem
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}