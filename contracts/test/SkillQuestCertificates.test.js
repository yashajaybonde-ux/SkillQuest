const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillQuestCertificates", () => {
  let c, admin, issuer, student, stranger;
  const certId = ethers.id("SQ-TEST-0001-AAAA");
  const hash = ethers.id("credential-v1");

  beforeEach(async () => {
    [admin, issuer, student, stranger] = await ethers.getSigners();
    const F = await ethers.getContractFactory("SkillQuestCertificates");
    c = await F.deploy(admin.address);
    await c.waitForDeployment();
    await c.grantRole(await c.ISSUER_ROLE(), issuer.address);
  });

  it("lets an issuer issue and anyone verify", async () => {
    await expect(c.connect(issuer).issueCertificate(certId, student.address, hash)).to.emit(c, "CertificateIssued");
    const cert = await c.getCertificate(certId);
    expect(cert.recipient).to.equal(student.address);
    expect(cert.issuer).to.equal(issuer.address);
    expect(cert.credentialHash).to.equal(hash);
    expect(await c.connect(stranger).verifyCredential(certId, hash)).to.equal(true);
    expect(await c.totalIssued()).to.equal(1n);
  });

  it("rejects issuing from accounts without ISSUER_ROLE", async () => {
    await expect(c.connect(stranger).issueCertificate(certId, student.address, hash))
      .to.be.revertedWithCustomError(c, "AccessControlUnauthorizedAccount");
  });

  it("rejects duplicate certificate IDs", async () => {
    await c.connect(issuer).issueCertificate(certId, student.address, hash);
    await expect(c.connect(issuer).issueCertificate(certId, student.address, hash))
      .to.be.revertedWithCustomError(c, "AlreadyIssued");
  });

  it("detects a modified credential", async () => {
    await c.connect(issuer).issueCertificate(certId, student.address, hash);
    expect(await c.verifyCredential(certId, ethers.id("credential-TAMPERED"))).to.equal(false);
  });

  it("invalidates revoked certificates and blocks strangers from revoking", async () => {
    await c.connect(issuer).issueCertificate(certId, student.address, hash);
    await expect(c.connect(stranger).revokeCertificate(certId))
      .to.be.revertedWithCustomError(c, "AccessControlUnauthorizedAccount");
    await c.connect(issuer).revokeCertificate(certId);
    expect(await c.verifyCredential(certId, hash)).to.equal(false);
  });

  it("rejects zero-address recipients and unknown revocations", async () => {
    await expect(c.connect(issuer).issueCertificate(certId, ethers.ZeroAddress, hash))
      .to.be.revertedWithCustomError(c, "InvalidInput");
    await expect(c.connect(issuer).revokeCertificate(certId))
      .to.be.revertedWithCustomError(c, "UnknownCertificate");
  });
});
