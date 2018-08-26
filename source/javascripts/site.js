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

// -- Begin StackRenderer --

class StackRenderer {
  static renderUsername(username) {
    $("span#username").html(username);
  }

  static renderCategory(categoryName, subCategoriesValues) {
    //$("span#username").html(username);
  }
}
// -- End StackRenderer --

Parser.parse(stackCsvPath).then(results => {
  const csvData = results.data;
  const personsCategoriesHash = CsvDataToPersonsHashFormatter.format(csvData);

  // For a single person
  const singleUser = personsCategoriesHash["ramiro@icalialabs.com"];
  StackRenderer.renderUsername("ramiro@icalialabs.com");

  const categoriesKeys = Object.keys(singleUser.categories);
  categoriesKeys.forEach(categoryKey => {
    StackRenderer.renderCategory(
      categoryKey,
      singleUser.categories[categoryKey]
    );
  });
});

// From the single persons gather the average for the whole design team.

// For a Single Person
// * [] Display a single person
// * [] Add a select to display the persons in the team
// * [] Depending on the selected person display their stack.
// * [] Display a polar spider chart with the data.

// For the whole team
// * [] Add a Team Design Stack Average option to the select box.
