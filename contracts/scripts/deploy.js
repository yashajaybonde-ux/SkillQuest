const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const issuer = process.env.ISSUER_ADDRESS || deployer.address;

  console.log(`Deploying with ${deployer.address} on ${hre.network.name}...`);
  const Factory = await hre.ethers.getContractFactory("SkillQuestCertificates");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  if (issuer.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await contract.grantRole(await contract.ISSUER_ROLE(), issuer)).wait();
  }

  const address = await contract.getAddress();
  const net = await hre.ethers.provider.getNetwork();
  const out = {
    network: hre.network.name,
    chainId: Number(net.chainId),
    address,
    admin: deployer.address,
    issuer,
    deployedAt: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${hre.network.name}.json`), JSON.stringify(out, null, 2));

  console.log(`\nSkillQuestCertificates deployed to: ${address}`);
  console.log(`Saved to contracts/deployments/${hre.network.name}.json`);
  console.log(`Set CONTRACT_ADDRESS=${address} in server/.env if the server runs on a different machine.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
