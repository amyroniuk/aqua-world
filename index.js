import { parse } from "@fast-csv/parse";
import { parseString } from "xml2js";
import { parse as parseJsToXML } from "js2xmlparser";
import path from "path";
import fs from "fs";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

console.log('test');

const argv = yargs(hideBin(process.argv))
  .option('csv', {
    demandOption: true,
    describe: 'input CSV separated by ";"',
    type: 'string',
  })
  .option('xml', {
    demandOption: true,
    describe: 'input XML',
    type: 'string',
  })
  .option('out', {
    default: 'output.xml',
    describe: 'output xml',
    type: 'string',
  })
  .epilogue('For more information contact https://aqua-world.com.ua/')
  .hide('help')
  .hide('version')
  .argv;

const cwd = process.cwd();
const csvPath = path.resolve(cwd, argv.csv);
const xmlInPath = path.resolve(cwd, argv.xml);
const xmlOutPath = path.resolve(cwd, argv.out || "output.xml");

const readCSV = (path) => {
  return new Promise((resolve, reject) => {
    const csv_input = fs.readFileSync(path);
    const rows = [];
    const stream = parse({ headers: true, delimiter: ";" })
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", (rowCount) => {
        // console.log(`Parsed ${rowCount} rows`);
        resolve(rows);
      });

    stream.write(csv_input.toString());
    stream.end();
  });
};

const updateXML = (path, prices) => {
  return new Promise((resolve, reject) => {
    const xml_input = fs.readFileSync(path);
    parseString(xml_input, function (err, result) {
      if (err) {
        reject(err);
        return;
      }
      const new_xml = {
        offer: [],
      };
      console.info(`Total offers count: ${result.offers.offer.length}`);
      let updatedOffersCount = 0;

      result.offers.offer.forEach((offer) => {
        const next_offer = {};
        const offerId = offer.$.id;
        const price = prices[offerId];

        if (price === undefined) {
          console.warn(`Price for offer #${offerId} was not found in CSV`);
        } else {
          updatedOffersCount++;
        }

        Object.keys(offer).forEach((key) => {
          if (key === "$") {
            next_offer["@"] = offer["$"];
          } else if (key === "param") {
            next_offer["param"] = offer.param.map((value) => {
              let param = {};
              if (value.$) {
                param["@"] = value.$;
              }
              if (value._) {
                param["#"] = value._;
              }
              return param;
            });
          } else {
            next_offer[key] = offer[key].map((value) => {
              return {
                "#": value,
              };
            });
          }
        });

        next_offer.price[0]["#"] = price || "";
        new_xml.offer.push(next_offer);
      });
      console.info(`Updated offers count: ${updatedOffersCount}`);
      const xmlText = parseJsToXML("offers", new_xml, {
        cdataInvalidChars: true,
        declaration: {
          include: true,
          encoding: "UTF-8",
        },
        format: {
          doubleQuotes: true,
        },
      });
      resolve(xmlText);
    });
  });
};

readCSV(csvPath)
  .then((rows) => {
    return rows.reduce((acc, item) => {
      acc[item.offer_id] = item.price;
      return acc;
    }, {});
  })
  .then((prices) => {
    return updateXML(xmlInPath, prices);
  })
  .then((xml) => {
    fs.writeFileSync(xmlOutPath, xml);
  })
  .then(() => {
    console.info(`Saved output to ${xmlOutPath}`);
  });
