// Set local or remote path of csv file:
const stackCsvPath = "Design Team Stack Poll - Digital Design Stack.csv";

// === Begin Utility Classes  ===

// --- Begin Parser --
class Parser {
  static parse(filePath) {
    return new Promise(function(resolve, reject) {
      Papa.parse(stackCsvPath, {
        header: true,
        download: true,
        complete: resolve,
        error: reject
      });
    });
  }
}
// -- End Parser --

// --- Begin Utils --

class Utils {
  static getAverageFromArray(arr) {
    const arrAvg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arrAvg;
  }
}
// -- End Parser --

// ===  End Utility Classes  ===

// From the csv gather the data into a hash for single persons.

// -- Begin CsvToPersonHash --

class CsvDataToTeammatesHashFormatter {
  constructor(csvData) {
    this.csvData = csvData;
    this.personsCategoriesHash = {};
  }

  static format(csvData) {
    const instance = new this(csvData);
    return instance.format();
  }

  format() {
    this.csvData.forEach(row => {
      delete row["Timestamp"];

      // Assign current username, add row to hash and remove username key.
      const user = row["Username"];
      this.addUserRow(user);
      delete row["Username"];

      this.addUserCategoriesAndValues(user, row);
      this.calculateCategoriesAveragesForUser(user);
    });

    this.calculateTeamAverage();
    return this.personsCategoriesHash;
  }

  calculateTeamAverage() {
    const teamAverageKey = "Team Stack Average";
    const personsNames = Object.keys(this.personsCategoriesHash);

    this.addUserRow(teamAverageKey);

    personsNames.forEach(personName => {
      const personData = this.personsCategoriesHash[personName];

      const categoriesKeys = Object.keys(personData["categories"]);

      categoriesKeys.forEach(categoryKey => {
        if (!this.hasUserCategory(teamAverageKey, categoryKey)) {
          this.initializeCategoryToUser(teamAverageKey, categoryKey);
        }

        const subcategoriesKeys = Object.keys(
          personData["categories"][categoryKey]
        );

        subcategoriesKeys.forEach(subcategoryKey => {
          if (
            !this.personsCategoriesHash[teamAverageKey]["categories"][
              categoryKey
            ][subcategoryKey]
          ) {
            this.personsCategoriesHash[teamAverageKey]["categories"][
              categoryKey
            ][subcategoryKey] = 0;
          }
          this.personsCategoriesHash[teamAverageKey]["categories"][categoryKey][
            subcategoryKey
          ] += personData["categories"][categoryKey][subcategoryKey];
        });
      });
    });

    const teamAverageData = this.personsCategoriesHash[teamAverageKey];

    const categoriesKeys = Object.keys(teamAverageData["categories"]);

    categoriesKeys.forEach(categoryKey => {
      const subcategoriesKeys = Object.keys(
        teamAverageData["categories"][categoryKey]
      );

      subcategoriesKeys.forEach(subcategoryKey => {
        teamAverageData["categories"][categoryKey][subcategoryKey] /=
          personsNames.length;

        const average =
          teamAverageData["categories"][categoryKey][subcategoryKey];
        teamAverageData["categories"][categoryKey][subcategoryKey] = Math.round(
          average
        );
      });
    });

    this.calculateCategoriesAveragesForUser(teamAverageKey);
  }

  addUserRow(user) {
    this.personsCategoriesHash[user] = {
      categories: {},
      categoriesAverages: {}
    };
  }

  addUserCategoriesAndValues(user, categoriesWithValues) {
    const categoriesKeys = Object.keys(categoriesWithValues);

    categoriesKeys.forEach(categoryKey => {
      const categoryName = this.getCategoryFromText(categoryKey);
      const subCategoryName = this.getSubCategoryFromText(categoryKey);
      const categoryValue = this.getCategoryValue(
        categoriesWithValues,
        categoryKey
      );

      if (!this.hasUserCategory(user, categoryName)) {
        this.initializeCategoryToUser(user, categoryName);
      }

      this.personsCategoriesHash[user]["categories"][categoryName][
        subCategoryName
      ] = categoryValue;
    });
  }

  calculateCategoriesAveragesForUser(user) {
    const categoriesKeys = Object.keys(
      this.personsCategoriesHash[user]["categories"]
    );

    categoriesKeys.forEach(categoryKey => {
      const categoryValues = Object.values(
        this.personsCategoriesHash[user]["categories"][categoryKey]
      );

      const categoryAverage = Utils.getAverageFromArray(categoryValues);

      this.personsCategoriesHash[user]["categoriesAverages"][
        categoryKey
      ] = categoryAverage;
    });
  }

  hasUserCategory(user, categoryName) {
    return categoryName in this.personsCategoriesHash[user]["categories"];
  }

  initializeCategoryToUser(user, categoryName) {
    this.personsCategoriesHash[user]["categories"][categoryName] = {};
  }

  getSubCategoryFromText(categoryText) {
    return categoryText.match(/ \[(.*?)\]/i)[1];
  }

  getCategoryFromText(categoryText) {
    return categoryText.match(/(.*?)\[/i)[1];
  }

  getCategoryValue(categoriesWithValues, categoryKey) {
    const valuesTextToNumberMapper = {
      High: 3,
      Medium: 2,
      Low: 1,
      None: 0
    };

    return valuesTextToNumberMapper[categoriesWithValues[categoryKey]];
  }
}

// -- End CsvToPersonHash --

// -- Begin CategoryHtmlContent --
class CategoryHtmlContent {
  static categoryRow(categoryName, subCategories) {
    let subCategoriesHtml = "";

    const subCategoriesKeys = Object.keys(subCategories);
    subCategoriesKeys.forEach(subCategoryKey => {
      subCategoriesHtml += this.subCategory(
        subCategoryKey,
        subCategories[subCategoryKey]
      );
    });

    return `
      <div class="separation-top row align-flex vertical" id="category-${categoryName}">
        <p class="info-title col-2">${categoryName}</p>
        <div class="row info text-center col-10" id="subcategories-container">
          ${subCategoriesHtml}
        </div>
      </div>
    `;
  }

  static subCategory(subCategoryName, size) {
    const SIZES_CLASSES = {
      3: "",
      2: "porcentage-mid",
      1: "porcentage-small",
      0: "porcentage-tiny"
    };

    return `
      <div class=col-2>
        <div class="info-single align-flex is-column center">
          <div class="circle-container align-flex vertical">
            <div class="porcentage ${SIZES_CLASSES[size]}"></div>
          </div>
          <p>${subCategoryName}</p>
        </div>
      </div>
    `;
  }
}

// -- End CategoryHtmlConent --

// -- Begin SpiderWebChart --
class SpiderWebChart {
  static config(subCategories) {
    const subCategoriesKeys = Object.keys(subCategories);
    const subCategoriesValues = subCategoriesKeys.map(subCategoryKey => {
      return subCategories[subCategoryKey];
    });
    return {
      chart: {
        polar: true,
        type: "area",
        backgroundColor: "rgba(255, 255, 255, 0.0)"
      },

      title: {
        text: "",
        x: -80
      },

      pane: {
        size: "80%"
      },

      xAxis: {
        categories: subCategoriesKeys,
        tickmarkPlacement: "on",
        lineWidth: 0
      },

      yAxis: {
        gridLineInterpolation: "polygon",
        lineWidth: 0,
        min: 0,
        labels: {
          enabled: false //default is true
        }
      },

      tooltip: {
        shared: true,
        pointFormat:
          '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
      },

      legend: {
        enabled: false
      },
      labels: {
        enabled: false
      },
      series: [
        {
          name: "Designer",
          data: subCategoriesValues,
          pointPlacement: "on",
          color: "#7bd500"
        }
      ],
      credits: {
        enabled: false
      },
      navigation: {
        buttonOptions: {
          enabled: false
        }
      }
    };
  }

  static subCategory(subCategoryName, size) {
    const SIZES_CLASSES = {
      3: "",
      2: "porcentage-mid",
      1: "porcentage-small",
      0: "porcentage-tiny"
    };

    return `
      <div class=col-2>
        <div class="info-single align-flex is-column center">
          <div class="circle-container align-flex vertical">
            <div class="porcentage ${SIZES_CLASSES[size]}"></div>
          </div>
          <p>${subCategoryName}</p>
        </div>
      </div>
    `;
  }
}

// -- End CategoryHtmlConent --

// -- Begin StackRenderer --

class StackRenderer {
  static renderTeammateStack(teammateName, teammatesData) {
    // For a single teammate
    const teammateData = teammatesData[teammateName];
    StackRenderer.renderUsername(teammateName);

    const categoriesKeys = Object.keys(teammateData.categories);

    StackRenderer.clearCategories();

    categoriesKeys.forEach(categoryKey => {
      StackRenderer.renderCategory(
        categoryKey,
        teammateData.categories[categoryKey]
      );
    });

    $("#chart-container").highcharts(
      SpiderWebChart.config(teammateData.categoriesAverages)
    );
  }

  static renderUsername(teammateName) {
    $("span#username").html(teammateName);
  }

  static renderCategory(categoryName, subCategoriesValues) {
    $("div#categories-container").append(
      CategoryHtmlContent.categoryRow(categoryName, subCategoriesValues)
    );
  }

  static clearCategories() {
    $("div#categories-container").html("");
  }
}
// -- End StackRenderer --

// -- Begin TeamSelectRenderer --

class TeamSelectRenderer {
  static addTeammatesOptions(teammates) {
    teammates.forEach(teammate => {
      $("#team-select").append(
        $("<option>", {
          value: teammate,
          text: teammate
        })
      );
    });

    $("#team-select").val($("#team-select option:first").val());
  }

  static getSelectedTeammate() {
    return $("#team-select").val();
  }

  static addOnChangeCallback(teammates) {
    $("#team-select").change(() => {
      const selectedTeammate = TeamSelectRenderer.getSelectedTeammate();
      StackRenderer.renderTeammateStack(selectedTeammate, teammates);
    });
  }
}
// -- End TeamSelectRenderer --

// -- Begin Main --

Parser.parse(stackCsvPath).then(results => {
  const csvData = results.data;
  const teammatesCategoriesData = CsvDataToTeammatesHashFormatter.format(
    csvData
  );

  // Add select options and select the first one.
  const teammatesNames = Object.keys(teammatesCategoriesData);
  TeamSelectRenderer.addTeammatesOptions(teammatesNames);
  TeamSelectRenderer.addOnChangeCallback(teammatesCategoriesData);

  // Display first
  const selectedTeammate = TeamSelectRenderer.getSelectedTeammate();
  StackRenderer.renderTeammateStack(selectedTeammate, teammatesCategoriesData);
});

// -- End Main --

// From the single persons gather the average for the whole design team.

// For a Single Person
// * [x] Display a single person
// * [] Add a select to display the persons in the team
// * [] Depending on the selected person display their stack.
// * [] Display a polar spider chart with the data.

// For the whole team
// * [] Add a Team Design Stack Average option to the select box.
