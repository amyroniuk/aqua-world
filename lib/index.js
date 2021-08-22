"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _parse = require("@fast-csv/parse");

var _xml2js = require("xml2js");

var _js2xmlparser = require("js2xmlparser");

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _yargs = _interopRequireDefault(require("yargs/yargs"));

var _helpers = require("yargs/helpers");

var argv = (0, _yargs["default"])((0, _helpers.hideBin)(process.argv)).option('csv', {
  demandOption: true,
  describe: 'input CSV separated by ";"',
  type: 'string'
}).option('xml', {
  demandOption: true,
  describe: 'input XML',
  type: 'string'
}).option('out', {
  "default": 'output.xml',
  describe: 'output xml',
  type: 'string'
}).epilogue('For more information contact https://aqua-world.com.ua/').hide('help').hide('version').argv;
var cwd = process.cwd();

var csvPath = _path["default"].resolve(cwd, argv.csv);

var xmlInPath = _path["default"].resolve(cwd, argv.xml);

var xmlOutPath = _path["default"].resolve(cwd, argv.out || "output.xml");

var readCSV = function readCSV(path) {
  return new Promise(function (resolve, reject) {
    var csv_input = _fs["default"].readFileSync(path);

    var rows = [];
    var stream = (0, _parse.parse)({
      headers: true,
      delimiter: ";"
    }).on("error", function (error) {
      return reject(error);
    }).on("data", function (row) {
      rows.push(row);
    }).on("end", function (rowCount) {
      // console.log(`Parsed ${rowCount} rows`);
      resolve(rows);
    });
    stream.write(csv_input.toString());
    stream.end();
  });
};

var updateXML = function updateXML(path, prices) {
  return new Promise(function (resolve, reject) {
    var xml_input = _fs["default"].readFileSync(path);

    (0, _xml2js.parseString)(xml_input, function (err, result) {
      if (err) {
        reject(err);
        return;
      }

      var new_xml = {
        offer: []
      };
      result.offers.offer.forEach(function (offer) {
        var next_offer = {};
        Object.keys(offer).forEach(function (key) {
          if (key === "$") {
            next_offer["@"] = offer["$"];
          } else if (key === "param") {
            next_offer["param"] = offer.param.map(function (value) {
              var param = {};

              if (value.$) {
                param["@"] = value.$;
              }

              if (value._) {
                param["#"] = value._;
              }

              return param;
            });
          } else {
            next_offer[key] = offer[key].map(function (value) {
              return {
                "#": value
              };
            });
          }
        });
        next_offer.price[0]["#"] = prices[offer.$.id] || "";
        new_xml.offer.push(next_offer);
      });
      var xmlText = (0, _js2xmlparser.parse)("offers", new_xml, {
        declaration: {
          include: true,
          encoding: "UTF-8"
        }
      });
      resolve(xmlText);
    });
  });
};

readCSV(csvPath).then(function (rows) {
  return rows.reduce(function (acc, item) {
    acc[item.offer_id] = item.price;
    return acc;
  }, {});
}).then(function (prices) {
  return updateXML(xmlInPath, prices);
}).then(function (xml) {
  _fs["default"].writeFileSync(xmlOutPath, xml);
}).then(function () {
  console.log("Saved output to ".concat(xmlOutPath));
});