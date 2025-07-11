import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";
import QRCode from "qrcode.react";
import { QrReader } from 'react-qr-reader';

function QRScanner() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [scannedQR, setScannedQR] = useState("");
  const [productDetails, setProductDetails] = useState(null);
  const [supplyChainHistory, setSupplyChainHistory] = useState(null);
  const [isAuthentic, setIsAuthentic] = useState(true);
  const [qrData, setQrData] = useState("");
  const [participantsMap, setParticipantsMap] = useState({});
  const [qrResult, setQrResult] = useState("");
  const [productInfo, setProductInfo] = useState(null);
  const [isAuthenticResult, setIsAuthenticResult] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrScanResult, setQrScanResult] = useState("");

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
      const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
      setSupplyChain(supplychain);
      // Lấy tất cả participants và build map
      const participantAddresses = await supplychain.methods.getParticipantAddresses().call();
      const map = {};
      for (let i = 0; i < participantAddresses.length; i++) {
        const p = await supplychain.methods.getParticipant(participantAddresses[i]).call();
        map[p.addr.toLowerCase()] = p;
      }
      setParticipantsMap(map);
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
      setloader(false);
    }
  };

  const generateQRCode = () => {
    const qrData = {
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    };
    setQrData(JSON.stringify(qrData));
  };

  const verifyQRCode = async (qrCode) => {
    try {
      if (!SupplyChain) {
        alert("Smart contract chưa được load. Vui lòng thử lại sau!");
        console.error("SupplyChain contract chưa được khởi tạo!");
        return;
      }
      console.log("Bắt đầu kiểm tra QR:", qrCode);
      const productId = await SupplyChain.methods.getProductByQR(qrCode).call();
      console.log("Product ID:", productId);
      if (productId > 0) {
        const events = await SupplyChain.getPastEvents('ProductTracked', {
          filter: { productId: productId },
          fromBlock: 0,
          toBlock: 'latest'
        });
        console.log("Events:", events);
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
        const productInfo = await SupplyChain.methods.getProduct(productId).call();
        console.log("Product Info:", productInfo);
        // Map lại productInfo nếu là mảng
        let productInfoObj = productInfo;
        if (Array.isArray(productInfo)) {
          productInfoObj = {
            id: productInfo[0],
            name: productInfo[1],
            description: productInfo[2],
            qrCode: productInfo[3],
            creator: productInfo[4],
            owner: productInfo[5],
            stage: productInfo[6],
            createdAt: productInfo[7],
            productType: productInfo[8],
            batchNumber: productInfo[9],
            expiryDate: productInfo[10],
            isAuthentic: productInfo[11]
          };
        }
        const isAuthenticResult = await SupplyChain.methods.verifyQRCode(productId, qrCode).call();
        console.log("Kết quả xác thực:", isAuthenticResult);
        setProductDetails({
          id: productInfoObj.id,
          name: productInfoObj.name,
          description: productInfoObj.description,
          qrCode: productInfoObj.qrCode,
          stage: productInfoObj.stage,
          createdAt: productInfoObj.createdAt,
          isAuthentic: productInfoObj.isAuthentic,
          batchNumber: productInfoObj.batchNumber,
          expiryDate: productInfoObj.expiryDate,
          productType: productInfoObj.productType
        });
        setSupplyChainHistory({
          productInfo: productInfoObj,
          trackingSteps: trackingSteps
        });
        setIsAuthentic(isAuthenticResult);
      } else {
        alert("QR Code không tồn tại trong hệ thống!");
        console.warn("QR Code không tồn tại trong hệ thống!", qrCode);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra QR code:", error);
      alert("Lỗi khi kiểm tra QR code! " + (error && error.message ? error.message : JSON.stringify(error)));
    }
  };

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

  // Sau khi quét QR code
  const handleScan = async (data) => {
    if (data) {
      setQrResult(data);
      setLoading(true);
      try {
        // Kết nối web3
        if (!window.web3) {
          window.web3 = new Web3(window.ethereum || window.web3.currentProvider);
        }
        const web3 = window.web3;
        const networkId = await web3.eth.net.getId();
        const networkData = SupplyChainABI.networks[networkId];
        if (!networkData) {
          alert("Smart contract chưa được deploy trên mạng này");
          setLoading(false);
          return;
        }
        const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
        // Lấy productId từ QR
        const productId = await supplychain.methods.getProductByQR(data).call();
        if (!productId || productId === "0") {
          setProductInfo(null);
          setIsAuthenticResult(false);
          setTrackingHistory([]);
          setLoading(false);
          return;
        }
        // Lấy thông tin sản phẩm
        const product = await supplychain.methods.getProduct(productId).call();
        setProductInfo(product);
        setIsAuthenticResult(product.isAuthentic);
        // Lấy tracking history từ event
        const events = await supplychain.getPastEvents('ProductTracked', {
          filter: { productId: productId },
          fromBlock: 0,
          toBlock: 'latest'
        });
        events.sort((a, b) => Number(a.returnValues.timestamp) - Number(b.returnValues.timestamp));
        setTrackingHistory(events.map((e, idx) => ({
          step: idx + 1,
          sender: e.returnValues.sender,
          recipient: e.returnValues.recipient,
          senderRole: getRoleName(e.returnValues.senderRole),
          recipientRole: getRoleName(e.returnValues.recipientRole),
          location: e.returnValues.location,
          note: e.returnValues.note,
          timestamp: e.returnValues.timestamp,
          stage: getStageName(e.returnValues.stage)
        })));
      } catch (err) {
        setProductInfo(null);
        setIsAuthenticResult(false);
        setTrackingHistory([]);
      }
      setLoading(false);
    }
  };

  const handleQRScan = (data) => {
    if (data) {
      setQrScanResult(data);
      setScannedQR(data); // Tự động điền vào ô input
      verifyQRCode(data); // Gọi xác thực luôn
    }
  };

  const handleQRError = (err) => {
    console.error('QR Scan Error:', err);
  };

  if (loader) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <h2 className="text-center mb-4">QR Code Scanner & Supply Chain Tracking</h2>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Manual QR Code Verification</h5>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label>Enter QR Code Data:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={scannedQR}
                      onChange={(e) => setScannedQR(e.target.value)}
                      placeholder="Enter QR code data"
                    />
                    <button 
                      className="btn btn-primary mt-2"
                      onClick={() => verifyQRCode(scannedQR)}
                    >
                      Verify QR Code
                    </button>
                  </div>
                  <div className="mt-4">
                    <h6>Hoặc quét mã QR trực tiếp:</h6>
                    <QrReader
                      constraints={{ facingMode: 'environment' }}
                      onResult={(result, error) => {
                        if (!!result) {
                          setQrScanResult(result?.text);
                          setScannedQR(result?.text);
                          verifyQRCode(result?.text);
                        }
                        // error có thể log nếu muốn
                      }}
                      style={{ width: '100%' }}
                    />
                    {qrScanResult && (
                      <div className="mt-2">
                        <strong>Kết quả quét:</strong> {qrScanResult}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Generate QR Code</h5>
                </div>
                <div className="card-body">
                  <button 
                    className="btn btn-success btn-block mb-3"
                    onClick={generateQRCode}
                  >
                    Generate New QR Code
                  </button>
                  
                  {qrData && (
                    <div className="text-center">
                      <QRCode value={qrData} size={200} />
                      <p className="mt-2 text-muted">{qrData}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {productDetails && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5>Product Details</h5>
                    <span className={`badge ${isAuthentic ? 'badge-success' : 'badge-danger'} float-right`}>
                      {isAuthentic ? 'AUTHENTIC' : 'COUNTERFEIT'}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>Basic Information</h6>
                        <p><strong>ID:</strong> {productDetails.id ?? 'N/A'}</p>
                        <p><strong>Name:</strong> {productDetails.name ?? 'N/A'}</p>
                        <p><strong>Type:</strong> <span className="badge badge-info">{productDetails.productType ?? 'N/A'}</span></p>
                        <p><strong>Description:</strong> {productDetails.description ?? 'N/A'}</p>
                        <p><strong>Batch Number:</strong> {productDetails.batchNumber ?? 'N/A'}</p>
                        <p><strong>Expiry Date:</strong> {productDetails.expiryDate ?? 'N/A'}</p>
                        <p><strong>Created:</strong> {productDetails.createdAt ? formatTimestamp(productDetails.createdAt) : 'N/A'}</p>
                        <p><strong>Current Stage:</strong> 
                          <span className={`badge badge-${getStageColor(productDetails.stage)} ml-2`}>
                            {getStageName(productDetails.stage)}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6>Supply Chain Tracking Summary</h6>
                        {supplyChainHistory?.trackingSteps && supplyChainHistory.trackingSteps.length > 0 && (
                          <div className="mb-3">
                            <strong>Total Steps:</strong> {supplyChainHistory.trackingSteps.length}
                            <br />
                            <strong>Latest Step:</strong> {getStageName(supplyChainHistory.trackingSteps[supplyChainHistory.trackingSteps.length - 1]?.stage)}
                            <br />
                            <strong>Latest Actor:</strong> {supplyChainHistory.trackingSteps[supplyChainHistory.trackingSteps.length - 1]?.senderName ?
                              supplyChainHistory.trackingSteps[supplyChainHistory.trackingSteps.length - 1].senderName.substring(0, 10) + '...'
                              : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {productDetails && supplyChainHistory && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-light border-bottom">
                    <h5 className="mb-0">Lịch sử di chuyển sản phẩm</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle mb-0">
                        <thead className="thead-dark">
                          <tr style={{background:'#f8f9fa'}}>
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
                          {supplyChainHistory && supplyChainHistory.trackingSteps && supplyChainHistory.trackingSteps.length > 0 ? (
                            supplyChainHistory.trackingSteps.map((step, idx) => (
                              <tr key={idx} style={{cursor:'pointer', transition:'background 0.2s'}}
                                onMouseOver={e => e.currentTarget.style.background='#f1f3f4'}
                                onMouseOut={e => e.currentTarget.style.background=''}>
                                <td className="text-center align-middle">{step.step ?? 'N/A'}</td>
                                <td className="align-middle">
                                  <span className={`badge badge-${getStageColor(step.stage)}`}
                                    style={{fontSize:'1em', minWidth:70, display:'inline-block'}}>
                                    {getStageName(step.stage)}
                                    {step.stage === 5 ? ' 🏁' : step.stage === 3 ? ' 🚚' : ''}
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
                            ))
                          ) : (
                            <tr><td colSpan="7" className="text-center">Không có lịch sử di chuyển.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row mt-4">
            <div className="col-12 text-center">
              <button 
                className="btn btn-secondary"
                onClick={() => history.push('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
      {loading && <div>Đang kiểm tra sản phẩm...</div>}
      {qrResult && !loading && (
        <div className="mt-4">
          <h5>Kết quả quét QR:</h5>
          <div><strong>QR Code:</strong> {qrResult}</div>
          {productInfo ? (
            <>
              <div className="mt-2">
                <strong>Trạng thái xác thực:</strong> {isAuthenticResult ? <span className="text-success">Authentic</span> : <span className="text-danger">Fake</span>}
              </div>
              <div className="mt-2">
                <strong>Tên sản phẩm:</strong> {productInfo.name}<br/>
                <strong>Loại:</strong> {productInfo.productType}<br/>
                <strong>Mô tả:</strong> {productInfo.description}<br/>
                <strong>Batch:</strong> {productInfo.batchNumber}<br/>
                <strong>Hạn dùng:</strong> {productInfo.expiryDate}<br/>
              </div>
              <div className="mt-4">
                <h6>Lịch sử di chuyển sản phẩm:</h6>
                {trackingHistory.length === 0 ? (
                  <div>Không có lịch sử di chuyển.</div>
                ) : (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Sender</th>
                        <th>Sender Role</th>
                        <th>Recipient</th>
                        <th>Recipient Role</th>
                        <th>Stage</th>
                        <th>Location</th>
                        <th>Note</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingHistory.map((step, idx) => (
                        <tr key={idx}>
                          <td>{step.step}</td>
                          <td><code>{step.sender.substring(0, 10)}...</code></td>
                          <td>{step.senderRole}</td>
                          <td><code>{step.recipient.substring(0, 10)}...</code></td>
                          <td>{step.recipientRole}</td>
                          <td>{step.stage}</td>
                          <td>{step.location}</td>
                          <td>{step.note}</td>
                          <td>{formatTimestamp(step.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="text-danger mt-2">Không tìm thấy sản phẩm hoặc sản phẩm không hợp lệ.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default QRScanner; 