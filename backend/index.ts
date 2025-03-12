import dotenv from "dotenv";
dotenv.config();

const Module = require("module");
Module.prototype.require = new Proxy(Module.prototype.require, {
  apply(target, thisArg, argumentsList) {
    const name = argumentsList[0];
    if (/patch-core/g.test(name)) return {};

    return Reflect.apply(target, thisArg, argumentsList);
  },
});

import Web3Services from "./Web3Services";

const MAX_INTERVAL = parseInt(`${process.env.MAX_INTERVAL}`);

const MIN_INTERVAL = parseInt(`${process.env.MIN_INTERVAL}`);

const PRICE_TRIGGER = parseFloat(`${process.env.PRICE_TRIGGER}`);

import Binance from "node-binance-api";

const binance = new Binance({ family: 0, test: false });

let lastReceivedPrice = 0;
let lastRegistredPrice = 0;
let lastRegistredTimestamp = 0;

console.log("Iniciando conexão com o WebSocket da Binance...");

type TickerData = {
  close: number;
};
async function registerPrice() {
    if (!lastReceivedPrice) {
        console.log("Preço não recebido ainda da Binance.");
        return;
    }

    try {
        // Garantir que o preço é um número inteiro de centavos
        const priceInPennies = Math.round(lastReceivedPrice * 100);
        
        console.log(`Registrando novo preço: ${lastReceivedPrice} MATIC/USDT (${priceInPennies} pennies)`);
        
        // Atualizar o preço no contrato
        const txHash = await Web3Services.setEthPrice(priceInPennies);
        
        // Atualizar as variáveis de controle após confirmação da transação
        lastRegistredPrice = lastReceivedPrice;
        lastRegistredTimestamp = Date.now();
        
        console.log(`Preço atualizado com sucesso! Hash: ${txHash}`);
        return txHash;
    } catch (error) {
        console.error("Falha ao registrar o preço:", error);
        throw error;
    }
}

const streamUrl = binance.websockets.prevDay(
  "MATICUSDT",
  async (data: any, converted: TickerData) => {
    lastReceivedPrice = converted.close;
    if (!lastRegistredPrice) lastRegistredPrice = lastReceivedPrice;

    const aMinuteAgo = Date.now() - MIN_INTERVAL;
    const priceChange = (lastReceivedPrice * 100) / lastRegistredPrice - 100;

    console.log(lastReceivedPrice);
    console.log(priceChange.toFixed(2) + "");

    if (
      Math.abs(priceChange) >= PRICE_TRIGGER &&
      lastRegistredTimestamp < aMinuteAgo
    ) {
      await registerPrice();
    }
  },
  true
);
console.log(`Stream connected at ${streamUrl}`);

async function updateCycle() {
  console.log("Executing the update cicle...");
  const anHourAgo = Date.now() - MAX_INTERVAL;
  if (lastRegistredTimestamp < anHourAgo) {
    await registerPrice();
  }
  console.log("Finishsing the update cicle...");
}

setTimeout(updateCycle, 5000);

setInterval(updateCycle, MAX_INTERVAL);

setInterval(async ()=>{
    const weiRatio = await Web3Services.getWeiRatio();
    const parity = await Web3Services.getParity(weiRatio);
   
    console.log(`Parity: ${parity}`);
    console.log(`Wei Ratio: ${weiRatio}`);
}, 10*1000)