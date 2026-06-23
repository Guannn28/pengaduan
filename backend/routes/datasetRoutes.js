const fs = require("fs");
const path = require("path");
const express = require("express");
const csv = require("csv-parser");
const { auth } = require("../middleware/auth");
const { repoRoot } = require("../paths");

const router = express.Router();

const datasetPath = path.join(repoRoot, "data", "Bullying_2018.csv");
const distributionConfigs = [
  {
    key: "age",
    columns: ["Age", "Custom_Age"],
    order: [
      "11 years old or younger",
      "12 years old",
      "13 years old",
      "14 years old",
      "15 years old",
      "16 years old",
      "17 years old",
      "18 years old or older",
    ],
  },
  { key: "sex", columns: ["Sex"], order: ["Female", "Male"] },
  {
    key: "oftenLonely",
    columns: [
      "Most_of_the_time_or_always_felt_lonely",
      "Most of the time or always felt lonely",
      "Felt_lonely",
      "Felt lonely",
    ],
    order: ["No", "Yes", "Never", "Rarely", "Sometimes", "Most of the time", "Always"],
  },
  {
    key: "missedClasses",
    columns: [
      "Missed_classes_or_school_without_permission",
      "Missed classes or school without permission",
      "Miss_school_no_permission",
      "Miss school no permission",
    ],
    order: ["No", "Yes", "0 days", "1 or 2 days", "3 to 5 days", "6 to 9 days", "10 or more days"],
  },
  {
    key: "physicallyAttacked",
    columns: ["Physically_attacked"],
    order: [
      "0 times",
      "1 time",
      "2 or 3 times",
      "4 or 5 times",
      "6 or 7 times",
      "8 or 9 times",
      "10 or 11 times",
      "12 or more times",
    ],
  },
  {
    key: "physicalFighting",
    columns: ["Physical_fighting"],
    order: [
      "0 times",
      "1 time",
      "2 or 3 times",
      "4 or 5 times",
      "6 or 7 times",
      "8 or 9 times",
      "10 or 11 times",
      "12 or more times",
    ],
  },
  {
    key: "closeFriends",
    columns: ["Close_friends", "Close friends", "Close_Friends"],
    order: ["0", "1", "2", "3 or more"],
  },
  {
    key: "otherStudentsKindHelpful",
    columns: ["Other_students_kind_and_helpful", "Other students kind and helpful"],
    order: ["Never", "Rarely", "Sometimes", "Most of the time", "Always"],
  },
  {
    key: "parentsUnderstandProblems",
    columns: ["Parents_understand_problems", "Parents understand problems"],
    order: ["Never", "Rarely", "Sometimes", "Most of the time", "Always"],
  },
  { key: "underweight", columns: ["Were_underweight", "Were underweight"], order: ["No", "Yes"] },
  { key: "overweight", columns: ["Were_overweight", "Were overweight"], order: ["No", "Yes"] },
  { key: "obese", columns: ["Were_obese", "Were obese"], order: ["No", "Yes"] },
];

const cleanHeaderName = (value) => String(value || "").replace(/^\uFEFF/, "").trim();

const normalizeColumnName = (value) =>
  cleanHeaderName(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const createHeaderLookup = (headers) =>
  headers.reduce((lookup, header) => {
    const cleanHeader = cleanHeaderName(header);
    const normalized = normalizeColumnName(cleanHeader);

    if (normalized && !lookup.has(normalized)) {
      lookup.set(normalized, cleanHeader);
    }

    return lookup;
  }, new Map());

const findMatchingColumn = (headers, aliases) => {
  const headerLookup = createHeaderLookup(headers);

  return aliases.reduce((found, alias) => {
    if (found) {
      return found;
    }

    return headerLookup.get(normalizeColumnName(alias)) || "";
  }, "");
};

const isMeaningfulValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  return !["na", "n/a", "unknown", "null", "undefined"].includes(lowered);
};

const normalizeValue = (value) => String(value).trim();

const percentage = (count, total) => {
  if (!total) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
};

const buildDistribution = (counter, total, order = []) => {
  const orderMap = new Map(order.map((label, index) => [label, index]));

  return Object.entries(counter)
    .sort((a, b) => {
      const aOrder = orderMap.has(a[0]) ? orderMap.get(a[0]) : Number.MAX_SAFE_INTEGER;
      const bOrder = orderMap.has(b[0]) ? orderMap.get(b[0]) : Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return b[1] - a[1] || a[0].localeCompare(b[0]);
    })
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, total),
    }));
};

const detectSeparator = (filePath) => {
  const fileHead = fs.readFileSync(filePath, "utf8").slice(0, 2048);
  const firstLine = fileHead.split(/\r?\n/, 1)[0] || "";
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
};

const getHeaders = (filePath, separator) => {
  const fileHead = fs.readFileSync(filePath, "utf8").split(/\r?\n/, 1)[0] || "";
  return fileHead.split(separator).map(cleanHeaderName);
};

const resolveDistributionColumns = (headers) =>
  distributionConfigs.map((config) => ({
    ...config,
    column: findMatchingColumn(headers, config.columns),
  }));

const countYes = (value) =>
  isMeaningfulValue(value) && normalizeValue(value).toLowerCase() === "yes";

const getBullyingSummary = async (_req, res) => {
  try {
    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({
        success: false,
        message: "Dataset bullying tidak ditemukan",
      });
    }

    const separator = detectSeparator(datasetPath);
    const headers = getHeaders(datasetPath, separator);
    const activeDistributions = resolveDistributionColumns(headers);

    const summary = await new Promise((resolve, reject) => {
      const distributions = Object.fromEntries(
        distributionConfigs.map((config) => [config.key, Object.create(null)])
      );

      let totalRespondents = 0;
      let bullyingAtSchoolCount = 0;
      let bullyingOutsideSchoolCount = 0;
      let cyberBullyingCount = 0;

      fs.createReadStream(datasetPath)
        .on("error", (error) => reject(error))
        .pipe(csv({ separator, mapHeaders: ({ header }) => cleanHeaderName(header) }))
        .on("data", (row) => {
          totalRespondents += 1;

          const bulliedAtSchool = row.Bullied_on_school_property_in_past_12_months;
          const bulliedOutsideSchool = row.Bullied_not_on_school_property_in_past_12_months;
          const cyberBullied = row.Cyber_bullied_in_past_12_months;

          if (countYes(bulliedAtSchool)) {
            bullyingAtSchoolCount += 1;
          }

          if (countYes(bulliedOutsideSchool)) {
            bullyingOutsideSchoolCount += 1;
          }

          if (countYes(cyberBullied)) {
            cyberBullyingCount += 1;
          }

          activeDistributions.forEach(({ column, key }) => {
            if (!column) {
              return;
            }

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
            distributions: Object.fromEntries(
              distributionConfigs.map((config) => [
                config.key,
                buildDistribution(distributions[config.key], totalRespondents, config.order),
              ])
            ),
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
