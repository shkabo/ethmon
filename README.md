# ethmon
Claymore's GPU Miner nodejs-based web monitoring utility.  
Simple web application for Claymore's GPU Miner monitoring for **ETH mining ONLY**. It provides monitoring of your ETH rigs with your wallet balance and how much is that in USD based on the current maket value.   
Claymore's GPU Miner: [https://bitcointalk.org/index.php?topic=1433925](https://bitcointalk.org/index.php?topic=1433925)  
This is a fork of [osnwt/ethmon](https://github.com/osnwt/ethmon) with my own additions



## Installation
* Install [nodejs and npm](http://nodejs.org)  for your system (tested on MacOSX, Ubuntu and Windows)
* Clone this repository or download and extract files
* Change to the top directory of the package
* Install dependencies ```npm install```
* Copy ```config.json.sample``` to ```config.json``` and edit where necessary (see **CONFIG.md** for detailed comments and optional parameters)
* Start the application ```npm start```
* Open web browser to [localhost:3000](localhost:3000) (or your IP:3000)
* Enjoy

## Known issues
* On some Ubuntu releases after ```apt-get install npm``` the node interpreter is called **nodejs** due to conflict with some other package. In that case you may need to replace ```node ./bin/www``` by ```nodejs ./bin/www``` in ```package.json``` file or better create a link from /usr/local/node to the nodejs binary 

## Donations 
If you find this utility useful and wish to thank me/us for developing it, here are donation addresses:

To buy me a :beer: or :beers: click the Paypal image below  
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/shkabo) 

If you want to donate to the initial author of ethmon [@osnwt](https://github.com/osnwt), you can do it on :
* BTC: 1H811tiLPcMwjGoWVDLQwTWpWaq5RpYSCZ
* ETH: 0xB9b7540a4B2077Ca9Cde23021e413Ec81c5b1Cae
