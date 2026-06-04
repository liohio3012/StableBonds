import hre from "hardhat";
console.log("Provider keys:", Object.keys(hre.network.provider));
console.log("Provider methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(hre.network.provider)));
