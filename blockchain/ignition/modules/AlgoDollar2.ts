import {
  buildModule,
  IgnitionModuleBuilder,
  IgnitionModuleResult,
  NamedArtifactContractDeploymentFuture,
  ContractCallFuture,
} from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const AlgoDollarDeployModule = buildModule("AlgoDollar", (m)=>{
  const algoDollar = m.contract("AlgoDollar", ["AlgoDollar", "USDA"]);

  return {algoDollar};
  }
})


export default AlgoDollarDeployModule;