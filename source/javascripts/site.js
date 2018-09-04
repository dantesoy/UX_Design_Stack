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

class CsvDataToPersonsHashFormatter {
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

    return this.personsCategoriesHash;
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
  static renderUsername(username) {
    $("span#username").html(username);
  }

  static renderCategory(categoryName, subCategoriesValues) {
    $("div#categories-container").append(
      CategoryHtmlContent.categoryRow(categoryName, subCategoriesValues)
    );
  }
}
// -- End StackRenderer --

// -- Begin Main --

Parser.parse(stackCsvPath).then(results => {
  const csvData = results.data;
  const personsCategoriesHash = CsvDataToPersonsHashFormatter.format(csvData);

  // For a single person
  const singleUser = personsCategoriesHash["dante@icalialabs.com"];
  StackRenderer.renderUsername("dante@icalialabs.com");

  const categoriesKeys = Object.keys(singleUser.categories);

  categoriesKeys.forEach(categoryKey => {
    StackRenderer.renderCategory(
      categoryKey,
      singleUser.categories[categoryKey]
    );
  });

  $("#chart-container").highcharts(
    SpiderWebChart.config(singleUser.categoriesAverages)
  );
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
