// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SkillQuestCertificates
 * @notice Anchors SkillQuest credentials on-chain. Only a keccak256 hash of the
 *         credential is stored, never names or other personal data. Anyone can
 *         verify; only accounts holding ISSUER_ROLE can issue or revoke.
 */
contract SkillQuestCertificates is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Certificate {
        bytes32 credentialHash; // keccak256 of the canonical off-chain credential JSON
        address issuer;
        address recipient;
        uint64 issuedAt;        // 0 means "does not exist"
        bool revoked;
    }

    mapping(bytes32 => Certificate) private certificates; // key = keccak256(publicCertificateId)
    uint256 public totalIssued;

    event CertificateIssued(
        bytes32 indexed certId,
        address indexed recipient,
        address indexed issuer,
        bytes32 credentialHash,
        uint64 issuedAt
    );
    event CertificateRevoked(bytes32 indexed certId, address indexed revokedBy);

    error AlreadyIssued(bytes32 certId);
    error UnknownCertificate(bytes32 certId);
    error InvalidInput();

    constructor(address admin) {
        if (admin == address(0)) revert InvalidInput();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
    }

    function issueCertificate(bytes32 certId, address recipient, bytes32 credentialHash)
        external
        onlyRole(ISSUER_ROLE)
    {
        if (recipient == address(0) || credentialHash == bytes32(0) || certId == bytes32(0)) revert InvalidInput();
        if (certificates[certId].issuedAt != 0) revert AlreadyIssued(certId);

        certificates[certId] = Certificate({
            credentialHash: credentialHash,
            issuer: msg.sender,
            recipient: recipient,
            issuedAt: uint64(block.timestamp),
            revoked: false
        });
        totalIssued += 1;
        emit CertificateIssued(certId, recipient, msg.sender, credentialHash, uint64(block.timestamp));
    }

    function revokeCertificate(bytes32 certId) external onlyRole(ISSUER_ROLE) {
        if (certificates[certId].issuedAt == 0) revert UnknownCertificate(certId);
        certificates[certId].revoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    function getCertificate(bytes32 certId) external view returns (Certificate memory) {
        return certificates[certId];
    }

    /// @return valid true only if the certificate exists, is not revoked, and the hash matches.
    function verifyCredential(bytes32 certId, bytes32 credentialHash) external view returns (bool valid) {
        Certificate storage c = certificates[certId];
        return c.issuedAt != 0 && !c.revoked && c.credentialHash == credentialHash;
    }
}
