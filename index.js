import { parse } from '@fast-csv/parse';
import { parseString } from 'xml2js';
import {parse as parseJsToXML} from "js2xmlparser";
import path from 'path';
import fs from 'fs';


const readCSV = (path) => {
    return new Promise((resolve, reject) => {
        const csv_input = fs.readFileSync(path);
        const rows = [];
        const stream = parse({ headers: true })
            .on('error', error => reject(error))
            .on('data', row => {
                rows.push(row);
            })
            .on('end', (rowCount) => {
                console.log(`Parsed ${rowCount} rows`);
                resolve(rows);
            });

        stream.write(csv_input.toString());
        stream.end();
    });
}

const updateXML = (path, prices) => {
    return new Promise((resolve, reject) => {

        const xml_input = fs.readFileSync(path);
parseString(xml_input, function (err, result) {
    if (err) {
        reject(err);
        return;
    }
    console.dir(result.root.offer[0]);
    // result.root.offer.forEach(element => {
    //     console.log(element.price)
    // });
    const new_xml_2 = {
        offer: [
            {
                "@": {
                    id: '5492', available: 'true'
                },
                url: [
                    {
                        "#": "https://aqua-world.com.ua/catalog/dushevye_kabiny_poddony/dushevye_kabiny/seriya_walk_in/peregorodka_dusha_walk_in/",
                    }
                ],
                picture: [
                    {
                        "#": "https://aqua-world.com.ua/pictures/5492.jpg",
                    },
                    {
                        "#": "https://aqua-world.com.ua/catalog/dushevye_kabiny_poddony/dushevye_kabiny/seriya_walk_in/peregorodka_dusha_walk_in/",
                    },
                ],
                param: [
                    {
                        "@": { name: "Производитель"},
                        "#": 'Aqua-World',
                    }
                ],
            },
        ]
    };
    const new_xml = {
        offer: []
    }
    result.root.offer.forEach((offer) => {
        const next_offer = {};
        Object.keys(offer).forEach((key) => {
            if (key === '$') {
                next_offer['@'] = offer[key];
            } else if (key === 'param') {
                next_offer[key] = offer[key].map((value) => {
                    let param = {};
                    if (value.$) {
                        param['@'] = value.$;
                    }
                    if (value._) {
                        param['#'] = value._;
                    }
                    return param;
                });
            } else {
                next_offer[key] = offer[key].map((value) => {
                    return {
                        '#': value,
                    }
                });
            }
        });
        next_offer.price[0]['#'] = prices[offer.$.id];
        new_xml.offer.push(next_offer);
    });
    const xmlText = parseJsToXML('root', new_xml, { declaration: {
        include: true,
        encoding: "UTF-8"
    } });
    resolve(xmlText);
});

    });
};





const csvPath = path.join(__dirname, 'doc', 'test.csv');
const xmlPath = path.join(__dirname, 'doc', 'test.xml');
const xmlNewPath = path.join(__dirname, 'doc', 'test-new.xml');

readCSV(csvPath)
.then((rows) => {
    return rows.reduce((acc, item) => {
        acc[item.offer_id] = item.price;
        return acc;
    }, {});
})
.then((prices) => {
    return updateXML(xmlPath, prices);
    
})
.then((xml) => {
    console.log(xml);
    fs.writeFileSync(xmlNewPath, xml);
});