# pestroutes-export-customers

Using Pestroutes api export the customers list in csv

run :

###npm run start

open url http://localhost:8080

to get bulk customers ids open url: http://localhost:8080/?customerIDs=0
to get bulk customer details open url: http://localhost:8080/?customerCsv=out0.csv&startWith=0 (you can add next call with 1000 instead of 0 to get next 100 records)