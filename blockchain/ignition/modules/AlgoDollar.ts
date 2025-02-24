const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
import { ethers } from "hardhat";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

module.exports = buildModule("AlgoDollarSystem", (m:any) => {
  // Variáveis configuráveis para o deploy
  const INITIAL_ETH_PRICE = 38; // $0.38 em centavos de dólar
  const INITIAL_ETH_DEPOSIT = ethers.parseEther("1"); // 1 ETH para inicialização
  
  // Calculando weisPerPenny com base no preço do ETH
  // Convertendo de dólares para centavos e calculando quantos weis equivalem a um centavo
  const weisPerPenny = ethers.parseEther("1")/ BigInt(INITIAL_ETH_PRICE);
  
  // Deploy WeiUsdOracle com preço inicial do ETH em centavos
  const oracle = m.contract("WeiUsdOracle", [INITIAL_ETH_PRICE]);

  // Deploy AlgoDollar
  const algoDollar = m.contract("AlgoDollar", []);

  // Deploy Rebase com referência ao Oracle e AlgoDollar
  const rebase = m.contract("Rebase", [
    m.getContractAddress(oracle),
    m.getContractAddress(algoDollar)
  ]);

  // Configurar AlgoDollar para apontar para o Rebase
  const setRebase = m.call(algoDollar, "setRebase", [m.getContractAddress(rebase)]);

  // Configurar Oracle para incluir Rebase como subscriber
  const subscribeRebase = m.call(oracle, "subscribe", [m.getContractAddress(rebase)]);

  // Inicializar Rebase com valor inicial e enviando ETH conforme configurado
  const initializeRebase = m.call(
    rebase, 
    "initialize", 
    [weisPerPenny], 
    { value: INITIAL_ETH_DEPOSIT }
  );

  // Definir dependências
  m.setDependencies(setRebase, [rebase]);
  m.setDependencies(subscribeRebase, [rebase]);
  m.setDependencies(initializeRebase, [setRebase, subscribeRebase]);

  return {
    oracle,
    algoDollar,
    rebase,
    setRebase,
    subscribeRebase,
    initializeRebase,
    config: {
      ethPrice: INITIAL_ETH_PRICE,
      ethDeposit: INITIAL_ETH_DEPOSIT.toString(),
      weisPerPenny: weisPerPenny.toString()
    }
  };
});