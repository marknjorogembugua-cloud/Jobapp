import { useEffect, useState } from "react";
import { fetchKycUrls, fetchPendingWorkers, reviewWorker, type KycUrls, type PendingWorker } from "../api/workers";

type Props = {
  onLogout: () => void;
};

export function PendingWorkersScreen({ onLogout }: Props) {
  const [workers, setWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    return fetchPendingWorkers()
      .then(setWorkers)
      .catch(() => setError("Could not load pending workers"));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setError(null);
    try {
      await reviewWorker(userId, decision);
      setWorkers((prev) => prev.filter((w) => w.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this worker");
    }
  }

  return (
    <div className="app-shell">
      <div className="header">
        <h1>Pending workers</h1>
        <button className="link-button" onClick={onLogout}>Log out</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!loading && workers.length === 0 && <p className="empty-text">No profiles waiting for review.</p>}

      {workers.map((worker) => (
        <WorkerCard key={worker.userId} worker={worker} onDecision={handleDecision} />
      ))}
    </div>
  );
}

function WorkerCard({
  worker,
  onDecision,
}: {
  worker: PendingWorker;
  onDecision: (userId: string, decision: "approved" | "rejected") => void;
}) {
  const [kyc, setKyc] = useState<KycUrls | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);

  function loadDocuments() {
    setLoadingKyc(true);
    fetchKycUrls(worker.userId)
      .then(setKyc)
      .finally(() => setLoadingKyc(false));
  }

  return (
    <div className="worker-card">
      <h3>{worker.businessName || worker.user.name}</h3>
      <p className="meta">
        {worker.user.name} · {worker.user.email ?? worker.user.phone ?? "no contact on file"}
      </p>
      <p className="meta">
        {worker.category.name} · {worker.town}, {worker.county} · {worker.yearsExperience} yrs experience
      </p>
      <p className="meta">Starting price: KES {worker.startingPrice}</p>

      {worker.bio && <p className="bio">{worker.bio}</p>}

      {worker.skills.length > 0 && (
        <div className="skills-row">
          {worker.skills.map((skill) => (
            <span key={skill} className="skill-chip">{skill}</span>
          ))}
        </div>
      )}

      {!kyc ? (
        <button className="secondary-button" onClick={loadDocuments} disabled={loadingKyc}>
          {loadingKyc ? "Loading documents…" : "Load ID + selfie"}
        </button>
      ) : (
        <div className="kyc-row">
          <div className="kyc-tile">
            {kyc.idPhotoUrl ? <img src={kyc.idPhotoUrl} alt="ID document" /> : "No ID uploaded"}
          </div>
          <div className="kyc-tile">
            {kyc.selfieUrl ? <img src={kyc.selfieUrl} alt="Selfie" /> : "No selfie uploaded"}
          </div>
        </div>
      )}

      <div className="actions-row">
        <button className="approve-button" onClick={() => onDecision(worker.userId, "approved")}>
          Approve
        </button>
        <button className="reject-button" onClick={() => onDecision(worker.userId, "rejected")}>
          Reject
        </button>
      </div>
    </div>
  );
}
