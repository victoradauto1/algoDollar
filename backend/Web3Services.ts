import dotenv from "dotenv";
dotenv.config();

import oracleArtifacts from "./WeiUsdOracle.json";

import rebaseArtifatc from "./Rebase.json";

import {ethers} from "ethers";

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");

async function getWeiRatio(): Promise<string>{
    const contract = new ethers.Contract(`${process.env.ORACLE_CONTRACT}`, oracleArtifacts.abi, provider);
    return contract.getWeiRate();
}

async function getParity(weiRatio: string = "0"): Promise<number>{
    const contract = new ethers.Contract(`${process.env.REBASE_CONTRACT}`, rebaseArtifatc.abi, provider);
    return contract.getParity(0)
}

async function setEthPrice(ethPriceInPenny: number): Promise<string>{
    try {
        console.log(`Enviando preço para o contrato: ${ethPriceInPenny} pennies`);
        
        const wallet = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, provider);
        const contract = new ethers.Contract(`${process.env.ORACLE_CONTRACT}`, oracleArtifacts.abi, wallet);

        // Certifique-se de que o preço é um número inteiro
        const priceAsBigInt = BigInt(ethPriceInPenny);
        
        console.log(`Chamando setEthPrice com valor: ${priceAsBigInt}`);
        const tx = await contract.setEthPrice(priceAsBigInt);
        
        console.log(`Transação enviada: ${tx.hash}, aguardando confirmação...`);
        const receipt = await tx.wait();
        
        console.log(`Transação confirmada: ${tx.hash}, gasUsed: ${receipt.gasUsed}`);
        return tx.hash;
    } catch (error) {
        console.error("Erro ao atualizar o preço no contrato:", error);
        throw error;
    }
}

export default {
    setEthPrice,
    getWeiRatio,
    getParity
}
