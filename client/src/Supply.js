import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FaIndustry, FaTruck, FaStore, FaUser, FaLeaf } from 'react-icons/fa';

function Supply() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [products, setProducts] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [userParticipant, setUserParticipant] = useState(null);
  const [approvalLocation, setApprovalLocation] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState({});
  const [locations, setLocations] = useState({});
  const [notes, setNotes] = useState({});
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingProduct, setTrackingProduct] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    loadWeb3();
    loadBlockchaindata();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  const loadBlockchaindata = async () => {
    setloader(true);
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    setCurrentaccount(account);
    const networkId = await web3.eth.net.getId();
    const networkData = SupplyChainABI.networks[networkId];
    if (networkData) {
      const supplychain = new web3.eth.Contract(
        SupplyChainABI.abi,
        networkData.address
      );
      setSupplyChain(supplychain);
      
      try {
        // Load products
        const productIds = await supplychain.methods.getProductIds().call();
        const productList = [];
        for (let i = 0; i < productIds.length; i++) {
          const product = await supplychain.methods.getProduct(productIds[i]).call();
          productList.push(product);
        }
        setProducts(productList);
        
        // Load participants
        const participantAddresses = await supplychain.methods.getParticipantAddresses().call();
        const participantList = [];
        for (let i = 0; i < participantAddresses.length; i++) {
          const participant = await supplychain.methods.getParticipant(participantAddresses[i]).call();
          participantList.push(participant);
        }
        setParticipants(participantList);
        
        // Check if user is a participant
        const userParticipantData = await supplychain.methods.getParticipant(account).call();
        if (userParticipantData.addr !== "0x0000000000000000000000000000000000000000") {
          setUserParticipant(userParticipantData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
      
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
    }
  };

  // Remove selectedProduct, selectedParticipant, handleProductChange, handleParticipantChange, transferProduct, and Transfer Product card

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStageName = (stage) => {
    const stages = {
      0: "Init",
      1: "Raw Material Supply",
      2: "Manufacture",
      3: "Distribution",
      4: "Retail",
      5: "Sold"
    };
    return stages[stage] || "Unknown";
  };

  const getStageColor = (stage) => {
    const colors = {
      0: "secondary",
      1: "info",
      2: "primary",
      3: "warning",
      4: "success",
      5: "dark"
    };
    return colors[stage] || "secondary";
  };

  const canTransferProduct = (product) => {
    // Chỉ owner hiện tại mới được chuyển tiếp
    const owner = product.currentOwner || product.creator;
    if (!owner || !currentaccount) return false;
    return owner.toLowerCase() === currentaccount.toLowerCase();
  };

  const canApproveStep = (product) => {
    if (!userParticipant) return false;
    // Only the correct role can approve their step
    const expectedRole = getExpectedRoleForStage(product.stage);
    return userParticipant.role === expectedRole;
  };

  const getExpectedRoleForStage = (stage) => {
    // Map stage (number) sang role (number) đúng với smart contract
    const mapping = {
      0: 2, // Init -> Manufacturer
      1: 3, // RawMaterialSupplied -> Distributor
      2: 4, // Manufactured -> Retailer
      3: 5, // Distributed -> Consumer
      // 4: null, // AtRetailer -> End
    };
    return mapping[stage] || null;
  };

  const getRoleNameById = (roleId) => {
    const roles = {
      0: "None",
      1: "Raw Material Supplier",
      2: "Manufacturer",
      3: "Distributor",
      4: "Retailer",
      5: "Consumer"
    };
    return roles[roleId] || "Unknown";
  };

  const approveStep = async (productId) => {
    if (!approvalLocation || !approvalNote) {
      alert("Please enter location and note for tracking.");
      return;
    }
    setApprovalLoading(true);
    try {
      await SupplyChain.methods.approveStep(
        productId,
        approvalLocation,
        approvalNote
      ).send({ from: currentaccount });
      alert("Step approved and tracked successfully!");
      setApprovalLocation("");
      setApprovalNote("");
      loadBlockchaindata();
    } catch (err) {
      alert("An error occurred: " + err.message);
    }
    setApprovalLoading(false);
  };

  if (loader) {
    return (
      <div>
        <h1 className="wait">Loading...</h1>
      </div>
    );
  }

  const redirect_to_home = () => {
    history.push("/");
  };

  // Lọc sản phẩm user đang sở hữu
  const ownedProducts = products.filter(product => product.currentOwner && product.currentOwner.toLowerCase() === currentaccount.toLowerCase());

  const getNextRole = (stage) => {
    const roles = {
      0: "Manufacturer",
      1: "Distributor",
      2: "Retailer",
      3: "Consumer"
    };
    return roles[stage] || null;
  };

  const handleRecipientChange = (e, productId) => {
    setSelectedRecipients({ ...selectedRecipients, [productId]: e.target.value });
  };

  const handleLocationChange = (e, productId) => {
    setLocations({ ...locations, [productId]: e.target.value });
  };

  const handleNoteChange = (e, productId) => {
    setNotes({ ...notes, [productId]: e.target.value });
  };

  const handleTransferToNextRole = async (productId) => {
    const recipient = selectedRecipients[productId];
    const location = locations[productId];
    const note = notes[productId];
    if (!recipient || !location) {
      alert("Vui lòng chọn người nhận và nhập địa điểm.");
      return;
    }
    setApprovalLoading(true);
    try {
      await SupplyChain.methods.transferToNextRole(
        productId,
        recipient,
        location,
        note || ""
      ).send({ from: currentaccount });
      alert("Chuyển tiếp thành công!");
      setSelectedRecipients({ ...selectedRecipients, [productId]: "" });
      setLocations({ ...locations, [productId]: "" });
      setNotes({ ...notes, [productId]: "" });
      await loadBlockchaindata(); // cập nhật lại inventory
    } catch (err) {
      alert("Có lỗi xảy ra: " + err.message);
    }
    setApprovalLoading(false);
  };

  // Hàm lấy tracking history từ event cho sản phẩm cụ thể
  const handleShowTracking = async (product) => {
    setTrackingProduct(product);
    setShowTrackingModal(true);
    setTrackingLoading(true);
    setTrackingHistory([]);
    try {
      const events = await SupplyChain.getPastEvents('ProductTracked', {
        filter: { productId: product.id },
        fromBlock: 0,
        toBlock: 'latest'
      });
      events.sort((a, b) => Number(a.returnValues.timestamp) - Number(b.returnValues.timestamp));
      setTrackingHistory(events.map((e, idx) => ({
        step: idx + 1,
        sender: e.returnValues.sender,
        recipient: e.returnValues.recipient,
        senderRole: getRoleNameById(e.returnValues.senderRole),
        recipientRole: getRoleNameById(e.returnValues.recipientRole),
        location: e.returnValues.location,
        note: e.returnValues.note,
        timestamp: e.returnValues.timestamp,
        stage: getStageName(e.returnValues.stage)
      })));
    } catch (err) {
      setTrackingHistory([]);
    }
    setTrackingLoading(false);
  };
  const handleCloseTracking = () => {
    setShowTrackingModal(false);
    setTrackingProduct(null);
    setTrackingHistory([]);
  };
  const getRoleName = (role) => {
    const roles = {
      0: "None",
      1: "Raw Material Supplier",
      2: "Manufacturer",
      3: "Distributor",
      4: "Retailer",
      5: "Consumer"
    };
    return roles[role] || "Unknown";
  };

  const roleInfo = {
    1: { label: 'Raw Material Supplier', color: 'success', icon: <FaLeaf /> },
    2: { label: 'Manufacturer', color: 'primary', icon: <FaIndustry /> },
    3: { label: 'Distributor', color: 'warning', icon: <FaTruck /> },
    4: { label: 'Retailer', color: 'info', icon: <FaStore /> },
    5: { label: 'Consumer', color: 'secondary', icon: <FaUser /> },
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Supply Chain Management</h3>
            <button
              onClick={redirect_to_home}
              className="btn btn-outline-danger btn-sm"
            >
              HOME
            </button>
          </div>

          {!userParticipant ? (
            <div className="alert alert-warning">
              <h5>Access Denied</h5>
              <p>You must be a registered participant to manage supply chain.</p>
              <p>Please go to "Assign Roles" to register as a participant first.</p>
            </div>
          ) : (
            <div className="row">
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <h5>Your Account</h5>
                  </div>
                  <div className="card-body">
                    <div className="text-center">
                      <h6 className="text-primary">{userParticipant.role}</h6>
                      <p><strong>Name:</strong> {userParticipant.name}</p>
                      <p><strong>Location:</strong> {userParticipant.location}</p>
                      <span className={`badge ${userParticipant.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {userParticipant.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove the entire <div className="card mt-3">...</div> for Transfer Product */}
              </div>

              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">
                    <h5>Product Inventory</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="thead-dark">
                          <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Stage</th>
                            <th>Creator</th>
                            <th>Batch</th>
                            <th>Expiry</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ownedProducts.length === 0 ? (
                            <tr><td colSpan="9" className="text-center">Bạn không sở hữu sản phẩm nào để chuyển tiếp.</td></tr>
                          ) : (
                            ownedProducts.map((product, index) => {
                              if (!canTransferProduct(product)) return null;
                              const nextRoleId = getExpectedRoleForStage(Number(product.stage));
                              // Sửa filter: luôn ép kiểu role về number
                              const nextRoleParticipants = participants.filter(p => Number(p.role) === nextRoleId);
                              return (
                                <tr key={index}>
                                  <td>{product.id}</td>
                                  <td>{product.name}</td>
                                  <td><span className="badge badge-info">{product.productType}</span></td>
                                  <td>{product.description}</td>
                                  <td><span className={`badge badge-${getStageColor(product.stage)}`}>{getStageName(product.stage)}</span></td>
                                  <td><code>{product.creator.substring(0, 10)}...</code></td>
                                  <td>{product.batchNumber}</td>
                                  <td>{product.expiryDate}</td>
                                  <td>
                                    {nextRoleParticipants.length > 0 ? (
                                      <>
                                        <div className="mb-2">
                                          <span className={`badge badge-${roleInfo[nextRoleId]?.color || 'dark'}`}
                                                style={{ fontSize: '1em', marginRight: 6 }}>
                                            {roleInfo[nextRoleId]?.icon} {roleInfo[nextRoleId]?.label}
                                          </span>
                                        </div>
                                        <select
                                          className="form-control mb-1"
                                          value={selectedRecipients[product.id] || ""}
                                          onChange={e => handleRecipientChange(e, product.id)}
                                        >
                                          <option value="">Chọn người nhận ({roleInfo[nextRoleId]?.label})</option>
                                          {nextRoleParticipants.map((p, idx) => (
                                            <option key={idx} value={p.addr}>
                                              {p.name} - {p.location} [{roleInfo[Number(p.role)]?.label}]
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          type="text"
                                          className="form-control mb-1"
                                          placeholder="Location"
                                          value={locations[product.id] || ""}
                                          onChange={e => handleLocationChange(e, product.id)}
                                        />
                                        <input
                                          type="text"
                                          className="form-control mb-1"
                                          placeholder="Note"
                                          value={notes[product.id] || ""}
                                          onChange={e => handleNoteChange(e, product.id)}
                                        />
                                        <button
                                          className="btn btn-success btn-sm btn-block mb-1"
                                          onClick={() => handleTransferToNextRole(product.id)}
                                          disabled={approvalLoading}
                                        >
                                          {approvalLoading ? 'Đang chuyển...' : 'Chuyển tiếp'}
                                        </button>
                                        <button
                                          className="btn btn-info btn-sm btn-block"
                                          onClick={() => handleShowTracking(product)}
                                        >
                                          Xem tracking
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="badge badge-secondary">Không có role tiếp theo</span>
                                        <button
                                          className="btn btn-info btn-sm btn-block mt-1"
                                          onClick={() => handleShowTracking(product)}
                                        >
                                          Xem tracking
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal hiển thị tracking */}
      <Modal show={showTrackingModal} onHide={handleCloseTracking} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử di chuyển sản phẩm {trackingProduct && trackingProduct.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {trackingLoading ? (
            <div>Đang tải lịch sử...</div>
          ) : trackingHistory.length === 0 ? (
            <div>Không có lịch sử di chuyển.</div>
          ) :
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead style={{background:'#f8f9fa'}}>
                  <tr>
                    <th className="text-center" style={{width:'40px'}}>#</th>
                    <th>Giai đoạn</th>
                    <th>Người gửi</th>
                    <th>Người nhận</th>
                    <th>Địa điểm</th>
                    <th>Ghi chú</th>
                    <th className="text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.map((step, idx) => (
                    <tr key={idx} style={{cursor:'pointer', transition:'background 0.2s'}}
                      onMouseOver={e => e.currentTarget.style.background='#f1f3f4'}
                      onMouseOut={e => e.currentTarget.style.background=''}>
                      <td className="text-center align-middle">{step.step ?? 'N/A'}</td>
                      <td className="align-middle">
                        <span className={`badge badge-${getStageColor(step.stage)}`}
                          style={{fontSize:'1em', minWidth:70, display:'inline-block'}}>
                          {step.stage}
                          {step.stage === 'Sold' || step.stage === 5 ? ' 🏁' : step.stage === 'Distributed' || step.stage === 3 ? ' 🚚' : ''}
                        </span>
                      </td>
                      <td className="align-middle">
                        <b>{step.senderRole ?? 'N/A'}</b><br/>
                        <span>{step.senderName ?? 'N/A'}</span><br/>
                        <small className="text-muted"><code>{step.sender ? step.sender.substring(0, 10) + '...' : 'N/A'}</code></small>
                      </td>
                      <td className="align-middle">
                        <b>{step.recipientRole ?? 'N/A'}</b><br/>
                        <span>{step.recipientName ?? 'N/A'}</span><br/>
                        <small className="text-muted"><code>{step.recipient ? step.recipient.substring(0, 10) + '...' : 'N/A'}</code></small>
                      </td>
                      <td className="align-middle">{step.location ?? 'N/A'}</td>
                      <td className="align-middle">{step.note ?? 'N/A'}</td>
                      <td className="align-middle text-right">{step.timestamp ? formatTimestamp(step.timestamp) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseTracking}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Supply;
