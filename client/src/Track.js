import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";

function Track() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setLoader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [participantsMap, setParticipantsMap] = useState({});

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
      window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
  };

  const loadBlockchaindata = async () => {
    setLoader(true);
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    setCurrentaccount(account);
    const networkId = await web3.eth.net.getId();
    const networkData = SupplyChainABI.networks[networkId];
    if (networkData) {
      const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
      setSupplyChain(supplychain);
      try {
        const ids = await supplychain.methods.getProductIds().call();
        const productList = [];
        for (let i = 0; i < ids.length; i++) {
          const product = await supplychain.methods.getProduct(ids[i]).call();
          productList.push(product);
        }
        setProducts(productList);
        // Lấy tất cả participants và build map
        const participantAddresses = await supplychain.methods.getParticipantAddresses().call();
        const map = {};
        for (let i = 0; i < participantAddresses.length; i++) {
          const p = await supplychain.methods.getParticipant(participantAddresses[i]).call();
          map[p.addr.toLowerCase()] = p;
        }
        setParticipantsMap(map);
      } catch (error) {
        window.alert("Error loading products: " + error.message);
      }
      setLoader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
      setLoader(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setProductDetails(product);
    setTracking([]);
    setLoader(true);
    try {
      // Lấy tracking từ event logs
      const events = await SupplyChain.getPastEvents('ProductTracked', {
        filter: { productId: product.id },
        fromBlock: 0,
        toBlock: 'latest'
      });
      // Sắp xếp theo thời gian tăng dần
      events.sort((a, b) => Number(a.returnValues.timestamp) - Number(b.returnValues.timestamp));
      const trackingSteps = events.map((e, idx) => {
        const sender = e.returnValues.sender.toLowerCase();
        const recipient = e.returnValues.recipient.toLowerCase();
        const senderInfo = participantsMap[sender] || {};
        const recipientInfo = participantsMap[recipient] || {};
        return {
          step: idx + 1,
          stage: e.returnValues.stage,
          stageName: getStageName(e.returnValues.stage),
          sender,
          senderName: senderInfo.name || sender,
          senderRole: getRoleName(e.returnValues.senderRole),
          recipient,
          recipientName: recipientInfo.name || recipient,
          recipientRole: getRoleName(e.returnValues.recipientRole),
          location: e.returnValues.location,
          note: e.returnValues.note,
          timestamp: e.returnValues.timestamp
        };
      });
      setTracking(trackingSteps);
    } catch (error) {
      window.alert("Error loading tracking: " + error.message);
    }
    setLoader(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getStageName = (stage) => {
    const stages = {
      0: "Init",
      1: "Raw Material Supplied",
      2: "Manufactured",
      3: "Distributed",
      4: "At Retailer",
      5: "Sold"
    };
    return stages[stage] || "Unknown";
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

  const getStageColor = (stage) => {
    switch (stage) {
      case 0: return "secondary";
      case 1: return "info";
      case 2: return "warning";
      case 3: return "success";
      case 4: return "primary";
      case 5: return "danger";
      default: return "secondary";
    }
  };

  if (loader) {
    return (
      <div className="container mt-5 text-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Track Products</h3>
        <button onClick={() => history.push("/")} className="btn btn-outline-danger btn-sm">HOME</button>
      </div>
      <div className="row">
        <div className="col-md-6">
          <h5>Product List</h5>
          <table className="table table-bordered table-hover">
            <thead className="thead-dark">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Stage</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="5" className="text-center">Chưa có sản phẩm nào</td></tr>
              ) : (
                products.map((product, idx) => (
                  <tr key={idx}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.productType}</td>
                    <td>{getStageName(product.stage)}</td>
                    <td>
                      <button className="btn btn-info btn-sm" onClick={() => handleSelectProduct(product)}>
                        View Tracking
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="col-md-6">
          {selectedProduct && productDetails && (
            <div>
              <h5>Product Details</h5>
              <ul className="list-group mb-3">
                <li className="list-group-item"><b>ID:</b> {productDetails.id}</li>
                <li className="list-group-item"><b>Name:</b> {productDetails.name}</li>
                <li className="list-group-item"><b>Type:</b> {productDetails.productType}</li>
                <li className="list-group-item"><b>Description:</b> {productDetails.description}</li>
                <li className="list-group-item"><b>Batch Number:</b> {productDetails.batchNumber}</li>
                <li className="list-group-item"><b>Expiry Date:</b> {productDetails.expiryDate}</li>
                <li className="list-group-item"><b>Stage:</b> {getStageName(productDetails.stage)}</li>
                <li className="list-group-item"><b>Created:</b> {formatTimestamp(productDetails.createdAt)}</li>
              </ul>
              <h6>Tracking History</h6>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Stage</th>
                    <th>From (Role/Name)</th>
                    <th>To (Role/Name)</th>
                    <th>Location</th>
                    <th>Note</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {tracking.length > 0 ? tracking.map((step, idx) => (
                    <tr key={idx}>
                      <td>{step.step}</td>
                      <td><span className={`badge badge-${getStageColor(step.stage)}`}>{step.stageName}</span></td>
                      <td><span title={step.sender}>{step.senderRole} <br/> {step.senderName} <br/> <code>{step.sender.substring(0, 10)}...</code></span></td>
                      <td><span title={step.recipient}>{step.recipientRole} <br/> {step.recipientName} <br/> <code>{step.recipient.substring(0, 10)}...</code></span></td>
                      <td>{step.location}</td>
                      <td>{step.note}</td>
                      <td>{formatTimestamp(step.timestamp)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="text-center">No tracking history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Track;
