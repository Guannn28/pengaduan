import {
  formatPercentage,
  formatRespondentCount,
} from "./adminUtils";

const datasetChartConfigs = [
  {
    key: "age",
    title: "Distribusi Usia",
    description: "Sebaran usia responden dalam dataset.",
  },
  {
    key: "sex",
    title: "Distribusi Jenis Kelamin",
    description: "Komposisi responden berdasarkan jenis kelamin.",
  },
  {
    key: "oftenLonely",
    title: "Tingkat Rasa Kesepian",
    description: "Responden yang sering atau selalu merasa kesepian.",
  },
  {
    key: "missedClasses",
    title: "Jumlah Hari Bolos Sekolah",
    description: "Indikator responden yang pernah bolos tanpa izin.",
  },
  {
    key: "physicallyAttacked",
    title: "Serangan Fisik",
    description: "Frekuensi responden mengalami serangan fisik.",
  },
  {
    key: "physicalFighting",
    title: "Perkelahian Fisik",
    description: "Frekuensi keterlibatan responden dalam perkelahian fisik.",
  },
  {
    key: "closeFriends",
    title: "Jumlah Teman Dekat",
    description: "Jumlah teman dekat yang dilaporkan responden.",
  },
  {
    key: "otherStudentsKindHelpful",
    title: "Sikap Baik dan Membantu dari Siswa Lain",
    description: "Persepsi responden terhadap dukungan dari siswa lain.",
  },
  {
    key: "parentsUnderstandProblems",
    title: "Pemahaman Orang Tua terhadap Masalah",
    description: "Tingkat pemahaman orang tua terhadap masalah responden.",
  },
  {
    key: "underweight",
    title: "Status Berat Badan Kurang",
    description: "Status berat badan kurang berdasarkan data responden.",
  },
  {
    key: "overweight",
    title: "Status Berat Badan Berlebih",
    description: "Status berat badan berlebih berdasarkan data responden.",
  },
  {
    key: "obese",
    title: "Status Obesitas",
    description: "Status obesitas berdasarkan data responden.",
  },
];

const DatasetBarList = ({ items, emptyText = "Data belum tersedia." }) => {
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) {
    return <div className="empty compact-empty">{emptyText}</div>;
  }

  return (
    <div className="dataset-bar-list">
      {safeItems.map((item) => (
        <div
          key={item.label}
          className="dataset-bar-row"
          style={{ "--bar-scale": Math.min(item.percentage || 0, 100) / 100 }}
        >
          <div className="dataset-bar-label">
            <strong>{item.label}</strong>
            <p className="muted small">{formatRespondentCount(item.count)}</p>
          </div>
          <div className="dataset-bar-track" aria-hidden="true">
            <div className="dataset-bar-fill" />
          </div>
          <span>{formatPercentage(item.percentage)}</span>
        </div>
      ))}
    </div>
  );
};

const DatasetSummaryGrid = ({ insight }) => {
  const summaryItems = [
    {
      label: "Total Responden",
      value: insight.totalRespondents?.toLocaleString("id-ID") || 0,
      helper: "Total partisipan dataset",
    },
    {
      label: "Bullying di Sekolah",
      value: formatPercentage(insight.bullyingAtSchool?.percentage),
      helper: formatRespondentCount(insight.bullyingAtSchool?.count),
    },
    {
      label: "Cyberbullying",
      value: formatPercentage(insight.cyberBullying?.percentage),
      helper: formatRespondentCount(insight.cyberBullying?.count),
    },
    {
      label: "Bullying di Luar Sekolah",
      value: formatPercentage(insight.bullyingOutsideSchool?.percentage),
      helper: formatRespondentCount(insight.bullyingOutsideSchool?.count),
    },
  ];

  return (
    <div className="dataset-summary-grid">
      {summaryItems.map((item) => (
        <div className="dataset-summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.helper}</p>
        </div>
      ))}
    </div>
  );
};

const DatasetChartGrid = ({ distributions }) => (
  <div className="dataset-chart-grid">
    {datasetChartConfigs.map((chart) => (
      <article className="dataset-chart-card" key={chart.key}>
        <div className="dataset-chart-card-head">
          <h4>{chart.title}</h4>
          <p>{chart.description}</p>
        </div>
        <DatasetBarList
          items={distributions?.[chart.key]}
          emptyText="Distribusi belum tersedia."
        />
      </article>
    ))}
  </div>
);

const DatasetInsightContent = ({
  localizedInsight,
  showDatasetInsightDetail,
  setShowDatasetInsightDetail,
  showAllCharts,
}) => {
  const detailVisible = showAllCharts || showDatasetInsightDetail;

  return (
    <>
      <DatasetSummaryGrid insight={localizedInsight} />

      {!showAllCharts && (
        <div className="dataset-insight-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setShowDatasetInsightDetail((prev) => !prev)}
            aria-expanded={detailVisible}
          >
            {detailVisible ? "Sembunyikan detail insight" : "Lihat detail insight"}
          </button>
        </div>
      )}

      <div
        className={
          detailVisible
            ? "dataset-insight-detail is-expanded"
            : "dataset-insight-detail"
        }
      >
        <div className="dataset-insight-detail-inner">
          <p className="muted small dataset-insight-note">
            Data ini digunakan sebagai insight pendukung dan bukan merupakan data pengaduan siswa pada sistem.
          </p>
          <DatasetChartGrid distributions={localizedInsight.distributions} />
        </div>
      </div>
    </>
  );
};

const DatasetInsightSection = ({
  localizedInsight,
  datasetInsightLoading,
  datasetInsightError,
  showDatasetInsightDetail,
  setShowDatasetInsightDetail,
  showAllCharts = false,
}) => {
  return (
    <section className="card dataset-insight-card">
      <div className="card-head">
        <div>
          <div className="dataset-insight-head">
            <h3>Insight Dataset Bullying 2018</h3>
            <span className="compose-badge dataset-reference-badge">Dataset Referensi</span>
          </div>
          <p className="muted small">
            Visualisasi ini digunakan sebagai data pendukung untuk memahami pola bullying berdasarkan dataset sekunder.
          </p>
        </div>
      </div>

      {datasetInsightLoading ? (
        <div className="empty compact-empty">Memuat insight dataset...</div>
      ) : datasetInsightError ? (
        <div className="alert">{datasetInsightError}</div>
      ) : !localizedInsight ? (
        <div className="empty compact-empty">Data insight belum tersedia.</div>
      ) : (
        <DatasetInsightContent
          localizedInsight={localizedInsight}
          showDatasetInsightDetail={showDatasetInsightDetail}
          setShowDatasetInsightDetail={setShowDatasetInsightDetail}
          showAllCharts={showAllCharts}
        />
      )}
    </section>
  );
};

export default DatasetInsightSection;
