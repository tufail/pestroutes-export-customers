var http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const url = require('url');
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const fastcsv = require('fast-csv');
const csv = require('csv-parser');
const fs = require('fs');

var http = require('http');

http
  .createServer(function (req, res) {
    //reading api and logic
    const queryObject = url.parse(req.url, true).query;
    let baseUrl = process.env.PEST_ROUTES_API_URL;
    const options = {
      headers: {
        Authentication: `${process.env.PEST_ROUTES_KEY}`,
        Authority: `${process.env.PEST_AUTORITY_DOMAIN}`,
      },
    };

    //if custopmer id is greater than this query id from url "queryObject.customerIDs"
    if (queryObject && queryObject.customerIDs) {
      var queryReq = `customerIDs={"operator":">","value":"${queryObject.customerIDs}"}`;
      const ws = fs.createWriteStream(`csv/out${queryObject.customerIDs}.csv`);

      axios
        .get(
          `${baseUrl}/customer/search?authenticationKey=${process.env.PEST_ROUTES_KEY}&authenticationToken=${process.env.PEST_ROUTES_TOKEN}&${queryReq}`,
          options
        )
        .then((response) => {
          console.log('success', response.data.customerIDs.length);

          let filterd = [];
          response.data.customerIDs.map((item, i) => {
            filterd.push({ id: i, customerID: `${item}` });
          });
          fastcsv.write(filterd, { headers: true }).pipe(ws);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('completed');
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    } else if (queryObject && queryObject.customerCsv) {
      //if customers csv in url and the number start With ... then request api for next 1000 items
      var customerArr = [];
      fs.createReadStream(`csv/${queryObject.customerCsv}`)
        .pipe(csv())
        .on('data', (row) => {
          if (queryObject.startWith) {
            if (
              row.id >= Number(queryObject.startWith) &&
              row.id <= Number(Number(queryObject.startWith) + 1000)
            ) {
              console.log(row.id);
              customerArr.push(row.customerID);
            }
          }
        })
        .on('end', () => {
          console.log('CSV file successfully processed', customerArr.length);
          const ws = fs.createWriteStream(
            `csv/customers${queryObject.startWith}.csv`,
            { flag: 'a' }
          );
          axios
            .get(
              `${baseUrl}/customer/get?customerIDs=[${customerArr}]&authenticationKey=${process.env.PEST_ROUTES_KEY}&authenticationToken=${process.env.PEST_ROUTES_TOKEN}`,
              options
            )
            .then((response) => {
              let customers = [];
              response.data.customers.map((customer) => {
                if (customer.email)
                  customers.push({
                    customerID: customer.customerID,
                    email: customer.email,
                    first_name: customer.fname,
                    last_name: customer.lname,
                  });
              });
              fastcsv.write(customers, { headers: true }).pipe(ws);
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('completed');
            })
            .catch(function (error) {
              // handle error
              console.log(error);
            });
        });
    }
  })
  .listen(8080);
