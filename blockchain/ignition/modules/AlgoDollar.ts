import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

export default buildModule("AlgoDollarSystem", (m) => {
  // Variáveis configuráveis para o deploy
  const INITIAL_ETH_PRICE = 38; // $0.38 em centavos de dólar
  const INITIAL_ETH_DEPOSIT = ethers.parseEther("1"); // 1 ETH para inicialização
  
  // Calculando weisPerPenny com base no preço do ETH
  const weisPerPenny = ethers.parseEther("1") / BigInt(INITIAL_ETH_PRICE);
  
  // Deploy WeiUsdOracle com preço inicial do ETH em centavos
  const oracle = m.contract("WeiUsdOracle", [INITIAL_ETH_PRICE]);

  // Deploy AlgoDollar
  const algoDollar = m.contract("AlgoDollar", []);

  // Deploy Rebase com referência ao Oracle e AlgoDollar
  const rebase = m.contract("Rebase", [
    oracle, // O Ignition resolve isso automaticamente 
    algoDollar
  ]);

  // Configurar AlgoDollar para apontar para o Rebase
  // Esperar pelo deploy do rebase antes de chamar setRebase
  const setRebase = m.call(algoDollar, "setRebase", [rebase], {
    after: [rebase]
  });

  // Configurar Oracle para incluir Rebase como subscriber
  // Esperar pelo deploy do rebase antes de chamar subscribe
  const subscribeRebase = m.call(oracle, "subscribe", [rebase], {
    after: [rebase]
  });

  // Inicializar Rebase com valor inicial e enviando ETH
  // Esperar pelas chamadas anteriores antes de inicializar
  const initializeRebase = m.call(
    rebase, 
    "initialize", 
    [weisPerPenny], 
    { 
      value: INITIAL_ETH_DEPOSIT,
      after: [setRebase, subscribeRebase]
    }
  );

  // Retornando apenas os contratos, não as chamadas
  return {
    oracle,
    algoDollar,
    rebase
  };
});