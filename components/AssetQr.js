"use client";

import { useSyncExternalStore } from "react";
import Icon from "./Icons";
import { makeQr, qrPath } from "../lib/qr";

const BORDER = 3;

// The address of this website, read in the browser (empty while the page is built)
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
}

// A printable label for a piece of equipment: QR code + asset tag.
// Scanning the QR code with a phone opens this equipment's page.
export default function AssetQr({ asset }) {
  const origin = useOrigin();
  if (!origin) return null;

  const url = origin + "/assets/" + asset.id;
  let qr = null;
  try {
    qr = makeQr(url);
  } catch (err) {
    qr = null;
  }

  return (
    <div className="panel qr-panel">
      <div className="panel-header">
        <h2 className="panel-title">Equipment label</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.print()}
          disabled={!qr}
        >
          <Icon name="printer" size={16} />
          Print
        </button>
      </div>

      {qr ? (
        <div className="qr-label">
          <svg
            className="qr-svg"
            viewBox={"0 0 " + (qr.size + BORDER * 2) + " " + (qr.size + BORDER * 2)}
            role="img"
            aria-label={"QR code for " + asset.tag}
            shapeRendering="crispEdges"
          >
            <rect width="100%" height="100%" fill="#ffffff" />
            <path d={qrPath(qr, BORDER)} fill="#111111" />
          </svg>
          <div className="qr-text">
            <strong className="qr-tag">{asset.tag}</strong>
            <span>{asset.model}</span>
            <span className="qr-small">Smart IT Helpdesk (demo)</span>
          </div>
        </div>
      ) : (
        <p className="hint">This address is too long to turn into a QR code.</p>
      )}

      <p className="hint qr-hint">
        Stick it on the device. Scanning it with a phone opens this page (you need to
        be signed in as an admin).
      </p>
    </div>
  );
}