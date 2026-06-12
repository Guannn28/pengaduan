const fs = require("fs");
const path = require("path");
const express = require("express");
const csv = require("csv-parser");
const { auth } = require("../middleware/auth");
const { repoRoot } = require("../paths");

const router = express.Router();

const datasetPath = path.join(repoRoot, "data", "Bullying_2018.csv");

const isMeaningfulValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  return lowered !== "null" && lowered !== "undefined";
};

const normalizeValue = (value) => String(value).trim();

const percentage = (count, total) => {
  if (!total) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
};

const buildDistribution = (counter, total) =>
  Object.entries(counter)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, total),
    }));

const detectSeparator = (filePath) => {
  const fileHead = fs.readFileSync(filePath, "utf8").slice(0, 2048);
  const firstLine = fileHead.split(/\r?\n/, 1)[0] || "";
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
};

const getBullyingSummary = async (_req, res) => {
  try {
    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({
        success: false,
        message: "Dataset bullying tidak ditemukan",
      });
    }

    const separator = detectSeparator(datasetPath);

    const summary = await new Promise((resolve, reject) => {
      const distributions = {
        age: Object.create(null),
        sex: Object.create(null),
        feltLonely: Object.create(null),
        missSchool: Object.create(null),
        physicallyAttacked: Object.create(null),
        physicalFighting: Object.create(null),
      };

      let totalRespondents = 0;
      let bullyingAtSchoolCount = 0;
      let bullyingOutsideSchoolCount = 0;
      let cyberBullyingCount = 0;

      fs.createReadStream(datasetPath)
        .on("error", (error) => reject(error))
        .pipe(csv({ separator }))
        .on("data", (row) => {
          totalRespondents += 1;

          const bulliedAtSchool = row.Bullied_on_school_property_in_past_12_months;
          const bulliedOutsideSchool = row.Bullied_not_on_school_property_in_past_12_months;
          const cyberBullied = row.Cyber_bullied_in_past_12_months;

          if (
            isMeaningfulValue(bulliedAtSchool) &&
            normalizeValue(bulliedAtSchool).toLowerCase() === "yes"
          ) {
            bullyingAtSchoolCount += 1;
          }

          if (
            isMeaningfulValue(bulliedOutsideSchool) &&
            normalizeValue(bulliedOutsideSchool).toLowerCase() === "yes"
          ) {
            bullyingOutsideSchoolCount += 1;
          }

          if (
            isMeaningfulValue(cyberBullied) &&
            normalizeValue(cyberBullied).toLowerCase() === "yes"
          ) {
            cyberBullyingCount += 1;
          }

          const mappings = [
            ["Custom_Age", "age"],
            ["Sex", "sex"],
            ["Felt_lonely", "feltLonely"],
            ["Miss_school_no_permission", "missSchool"],
            ["Physically_attacked", "physicallyAttacked"],
            ["Physical_fighting", "physicalFighting"],
          ];

          mappings.forEach(([column, key]) => {
            const rawValue = row[column];
            if (!isMeaningfulValue(rawValue)) {
              return;
            }

            const label = normalizeValue(rawValue);
            distributions[key][label] = (distributions[key][label] || 0) + 1;
          });
        })
        .on("end", () => {
          resolve({
            totalRespondents,
            bullyingAtSchool: {
              count: bullyingAtSchoolCount,
              percentage: percentage(bullyingAtSchoolCount, totalRespondents),
            },
            bullyingOutsideSchool: {
              count: bullyingOutsideSchoolCount,
              percentage: percentage(bullyingOutsideSchoolCount, totalRespondents),
            },
            cyberBullying: {
              count: cyberBullyingCount,
              percentage: percentage(cyberBullyingCount, totalRespondents),
            },
            distributions: {
              age: buildDistribution(distributions.age, totalRespondents),
              sex: buildDistribution(distributions.sex, totalRespondents),
              feltLonely: buildDistribution(distributions.feltLonely, totalRespondents),
              missSchool: buildDistribution(distributions.missSchool, totalRespondents),
              physicallyAttacked: buildDistribution(
                distributions.physicallyAttacked,
                totalRespondents
              ),
              physicalFighting: buildDistribution(
                distributions.physicalFighting,
                totalRespondents
              ),
            },
          });
        })
        .on("error", (error) => reject(error));
    });

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Bullying dataset summary error", error);
    return res.status(500).json({
      success: false,
      message: `Gagal membaca dataset bullying: ${error.message}`,
    });
  }
};

router.get("/insight", auth(["admin"]), getBullyingSummary);
router.get("/bullying-summary", auth(["admin"]), getBullyingSummary);

module.exports = router;
