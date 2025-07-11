// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract SupplyChain {
    address public owner;
    constructor() public { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }

    enum Role { None, RawMaterialSupplier, Manufacturer, Distributor, Retailer, Consumer }
    enum Stage { Init, RawMaterialSupplied, Manufactured, Distributed, AtRetailer, Sold }

    struct Participant {
        address addr;
        string name;
        string location;
        Role role;
        bool active;
        uint256 roleId; // Add roleId for frontend mapping
    }
    mapping(address => Participant) public participants;
    address[] public participantAddresses;

    event ProductTracked(
        uint256 indexed productId,
        address indexed sender,
        address indexed recipient,
        Role senderRole,
        Role recipientRole,
        uint256 timestamp,
        string location,
        string note,
        Stage stage
    );

    struct Product {
        uint256 id;
        string name;
        string description;
        string qrCode;
        address creator;
        address currentOwner;
        Stage stage;
        uint256 createdAt;
        string productType;
        string batchNumber;
        string expiryDate;
        bool isAuthentic;
        // Tracking[] history; // Remove this to save code size
    }
    mapping(uint256 => Product) public products;
    mapping(string => uint256) public qrToProductId;
    uint256 public nextProductId = 1;

    // --- OWNER MANAGEMENT ---
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }

    // --- PARTICIPANT MANAGEMENT ---
    function registerParticipant(address _addr, string memory _name, string memory _location, Role _role) public onlyOwner {
        require(_addr != address(0), "Invalid address");
        require(participants[_addr].addr == address(0), "Already registered");
        uint256 roleId = uint(_role);
        participants[_addr] = Participant(_addr, _name, _location, _role, true, roleId);
        participantAddresses.push(_addr);
    }

    function getParticipant(address _addr) public view returns (Participant memory) {
        return participants[_addr];
    }

    function getParticipantAddresses() public view returns (address[] memory) {
        return participantAddresses;
    }

    function getAllParticipants() public view returns (Participant[] memory) {
        Participant[] memory list = new Participant[](participantAddresses.length);
        for (uint i = 0; i < participantAddresses.length; i++) {
            list[i] = participants[participantAddresses[i]];
        }
        return list;
    }

    // --- PRODUCT CREATION ---
    function createProduct(
        string memory _name, 
        string memory _description, 
        string memory _qrCode, 
        string memory _productType,
        string memory _batchNumber,
        string memory _expiryDate,
        string memory _location, 
        string memory _note
    ) public {
        require(participants[msg.sender].active, "Not a registered participant");
        require(participants[msg.sender].role == Role.RawMaterialSupplier, "Only RMS can create");
        require(qrToProductId[_qrCode] == 0, "QR already used");
        
        uint256 pid = nextProductId++;
        Product storage p = products[pid];
        p.id = pid;
        p.name = _name;
        p.description = _description;
        p.qrCode = _qrCode;
        p.creator = msg.sender;
        p.currentOwner = msg.sender;
        p.stage = Stage.Init;
        p.createdAt = block.timestamp;
        p.productType = _productType;
        p.batchNumber = _batchNumber;
        p.expiryDate = _expiryDate;
        p.isAuthentic = true;
        qrToProductId[_qrCode] = pid;
        // Initial tracking as event
        emit ProductTracked(pid, msg.sender, msg.sender, Role.RawMaterialSupplier, Role.RawMaterialSupplier, block.timestamp, _location, _note, Stage.Init);
    }

    function transferToNextRole(
        uint256 _productId,
        address _recipient,
        string memory _location,
        string memory _note
    ) public {
        Product storage p = products[_productId];
        require(p.id != 0, "Product not found");
        Stage current = p.stage;
        Role senderRole = participants[msg.sender].role;
        Role expectedSenderRole = getExpectedRoleForStage(current);
        Role expectedRecipientRole = getExpectedRoleForStage(Stage(uint(current) + 1));
        require(senderRole == expectedSenderRole, "Not allowed for this stage");
        require(participants[_recipient].active, "Recipient not registered");
        require(participants[_recipient].role == expectedRecipientRole, "Recipient must have correct role");
        require(current != Stage.Sold, "Already sold");
        // Progress stage
        Stage nextStage = Stage(uint(current) + 1);
        p.stage = nextStage;
        p.currentOwner = _recipient;
        emit ProductTracked(_productId, msg.sender, _recipient, senderRole, expectedRecipientRole, block.timestamp, _location, _note, nextStage);
    }

    // --- SUPPLY CHAIN PROGRESSION ---
    function approveStep(uint256 _productId, string memory _location, string memory _note) public {
        Product storage p = products[_productId];
        require(p.id != 0, "Product not found");
        Stage current = p.stage;
        Role expectedRole = getExpectedRoleForStage(current);
        require(participants[msg.sender].active, "Not a registered participant");
        require(participants[msg.sender].role == expectedRole, "Not allowed for this stage");
        require(current != Stage.Sold, "Already sold");
        
        // Progress stage
        Stage nextStage = Stage(uint(current) + 1);
        p.stage = nextStage;
        emit ProductTracked(_productId, msg.sender, msg.sender, participants[msg.sender].role, participants[msg.sender].role, block.timestamp, _location, _note, nextStage);
    }

    function approveNextStage(uint256 _productId, string memory _location, string memory _note) public {
        approveStep(_productId, _location, _note);
    }

    function getExpectedRoleForStage(Stage s) public pure returns (Role) {
        if (s == Stage.Init) return Role.RawMaterialSupplier;
        if (s == Stage.RawMaterialSupplied) return Role.Manufacturer;
        if (s == Stage.Manufactured) return Role.Distributor;
        if (s == Stage.Distributed) return Role.Retailer;
        if (s == Stage.AtRetailer) return Role.Consumer;
        return Role.None;
    }

    // --- QR & TRACKING ---
    function getProductByQR(string memory _qrCode) public view returns (uint256) {
        return qrToProductId[_qrCode];
    }

    function getProduct(uint256 _productId) public view returns (Product memory) {
        return products[_productId];
    }

    function getProductIds() public view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](nextProductId - 1);
        for (uint i = 1; i < nextProductId; i++) {
            ids[i-1] = i;
        }
        return ids;
    }

    // getProductHistory now reverts to indicate history is off-chain
    function getProductHistory(uint256 _productId) public pure returns (uint256) {
        revert("Tracking history is now off-chain via events");
    }

    function verifyQRCode(uint256 _productId, string memory _qrCode) public view returns (bool) {
        Product memory p = products[_productId];
        return (keccak256(abi.encodePacked(p.qrCode)) == keccak256(abi.encodePacked(_qrCode)));
    }

    // SỬA HÀM NÀY: chỉ trả về Product, KHÔNG trả về history
    function getSupplyChainHistory(uint256 _productId) public view returns (Product memory productInfo) {
        Product memory p = products[_productId];
        require(p.id != 0, "Product not found");
        return p;
    }

    // Helper function to get role name from enum
    function getRoleNameFromEnum(Role role) public pure returns (string memory) {
        if (role == Role.RawMaterialSupplier) return "Raw Material Supplier";
        if (role == Role.Manufacturer) return "Manufacturer";
        if (role == Role.Distributor) return "Distributor";
        if (role == Role.Retailer) return "Retailer";
        if (role == Role.Consumer) return "Consumer";
        return "None";
    }

    function getStageName(Stage s) public pure returns (string memory) {
        if (s == Stage.Init) return "Init";
        if (s == Stage.RawMaterialSupplied) return "Raw Material Supplied";
        if (s == Stage.Manufactured) return "Manufactured";
        if (s == Stage.Distributed) return "Distributed";
        if (s == Stage.AtRetailer) return "At Retailer";
        if (s == Stage.Sold) return "Sold";
        return "Unknown";
    }

    function getRoleName(Role r) public pure returns (string memory) {
        if (r == Role.RawMaterialSupplier) return "Raw Material Supplier";
        if (r == Role.Manufacturer) return "Manufacturer";
        if (r == Role.Distributor) return "Distributor";
        if (r == Role.Retailer) return "Retailer";
        if (r == Role.Consumer) return "Consumer";
        return "None";
    }
}
