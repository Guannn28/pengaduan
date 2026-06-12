import {
  formatPercentage,
  formatRespondentCount,
} from "./adminUtils";

const DatasetBarList = ({ items }) => {
  const safeItems = Array.isArray(items) ? items.slice(0, 6) : [];

  if (safeItems.length === 0) {
    return <div className="empty compact-empty">Data belum tersedia.</div>;
  }

  return safeItems.map((item) => (
    <div key={item.label} className="dataset-bar-row">
      <div>
        <strong>{item.label}</strong>
        <p className="muted small">{formatRespondentCount(item.count)}</p>
      </div>
      <div className="dataset-bar-track" aria-hidden="true">
        <div
          className="dataset-bar-fill"
          style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
        />
      </div>
      <span>{formatPercentage(item.percentage)}</span>
    </div>
  ));
};

const DatasetInsightSection = ({
  localizedInsight,
  datasetInsightLoading,
  datasetInsightError,
  showDatasetInsightDetail,
  setShowDatasetInsightDetail,
}) => (
  <section className="card dataset-insight-card">
    <div className="card-head">
      <div>
        <div className="dataset-insight-head">
          <h3>Insight Dataset Bullying 2018</h3>
          <span className="compose-badge dataset-reference-badge">Dataset Referensi</span>
        </div>
        <p className="muted small">Ringkasan statistik bullying dari dataset referensi.</p>
      </div>
    </div>

    {datasetInsightLoading ? (
      <div className="empty compact-empty">Memuat insight dataset...</div>
    ) : datasetInsightError ? (
      <div className="alert">{datasetInsightError}</div>
    ) : !localizedInsight ? (
      <div className="empty compact-empty">Data insight belum tersedia.</div>
    ) : (
      <>
        <div className="dataset-summary-grid">
          <div className="dataset-summary-item">
            <span>Total Responden</span>
            <strong>{localizedInsight.totalRespondents?.toLocaleString("id-ID") || 0}</strong>
            <p>Total partisipan dataset</p>
          </div>
          <div className="dataset-summary-item">
            <span>Bullying di Sekolah</span>
            <strong>{formatRespondentCount(localizedInsight.bullyingAtSchool?.count)}</strong>
            <p>{formatPercentage(localizedInsight.bullyingAtSchool?.percentage)}</p>
          </div>
          <div className="dataset-summary-item">
            <span>Bullying di Luar Sekolah</span>
            <strong>{formatRespondentCount(localizedInsight.bullyingOutsideSchool?.count)}</strong>
            <p>{formatPercentage(localizedInsight.bullyingOutsideSchool?.percentage)}</p>
          </div>
          <div className="dataset-summary-item">
            <span>Cyberbullying</span>
            <strong>{formatRespondentCount(localizedInsight.cyberBullying?.count)}</strong>
            <p>{formatPercentage(localizedInsight.cyberBullying?.percentage)}</p>
          </div>
        </div>

        <div className="dataset-insight-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setShowDatasetInsightDetail((prev) => !prev)}
            aria-expanded={showDatasetInsightDetail}
          >
            {showDatasetInsightDetail ? "Sembunyikan detail insight" : "Lihat detail insight"}
          </button>
        </div>

        <div
          className={
            showDatasetInsightDetail
              ? "dataset-insight-detail is-expanded"
              : "dataset-insight-detail"
          }
        >
          <p className="muted small dataset-insight-note">
            Data ini digunakan sebagai insight pendukung dan bukan merupakan data pengaduan siswa pada sistem.
          </p>
          <div className="dataset-chart-grid">
            <div className="dataset-chart-card">
              <h4>Distribusi Usia</h4>
              <DatasetBarList items={localizedInsight.distributions?.age} />
            </div>
            <div className="dataset-chart-card">
              <h4>Distribusi Jenis Kelamin</h4>
              <DatasetBarList items={localizedInsight.distributions?.sex} />
            </div>
            <div className="dataset-chart-card">
              <h4>Tingkat Rasa Kesepian</h4>
              <DatasetBarList items={localizedInsight.distributions?.feltLonely} />
            </div>
            <div className="dataset-chart-card">
              <h4>Jumlah Hari Bolos Sekolah</h4>
              <DatasetBarList items={localizedInsight.distributions?.missSchool} />
            </div>
          </div>
        </div>
      </>
    )}
  </section>
);

export default DatasetInsightSection;
