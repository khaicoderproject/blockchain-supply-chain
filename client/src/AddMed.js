import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";
import QRCode from "qrcode.react";

function AddMed() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [userParticipant, setUserParticipant] = useState(null);
  const [isRMS, setIsRMS] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    productType: "",
    batchNumber: "",
    expiryDate: "",
    location: "",
    note: ""
  });
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");

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
      try {
        const p = await supplychain.methods.getParticipant(account).call();
        setUserParticipant(p);
        setIsRMS(parseInt(p.role) === 1);
      } catch (error) {
        setUserParticipant(null);
        setIsRMS(false);
      }
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateQRCode = () => {
    // Tạo chuỗi duy nhất: productType-batchNumber-timestamp
    const uniqueString = `${form.productType}-${form.batchNumber}-${Date.now()}`;
    setQrCode(uniqueString);
  };

  const createProduct = async (e) => {
    e.preventDefault();
    if (!isRMS) {
      setError("Only Raw Material Supplier can create products. Hãy đăng ký vai trò với owner!");
      return;
    }
    if (!form.name || !form.description || !qrCode || !form.productType || !form.batchNumber || !form.expiryDate || !form.location) {
      setError("Please fill all fields and generate QR code.");
      return;
    }
    try {
      await SupplyChain.methods.createProduct(
        form.name,
        form.description,
        qrCode, // must be string
        form.productType,
        form.batchNumber,
        form.expiryDate,
        form.location,
        form.note || ""
      ).send({ from: currentaccount });
      alert("Product created successfully!");
      window.location.reload();
    } catch (err) {
      setError("Product creation failed: " + (err && err.message ? err.message : JSON.stringify(err)));
      console.error("Product creation error:", err);
    }
  };

  const productTypes = ["Medicine", "Electronics", "Food", "Clothing", "Cosmetics", "Other"];

  if (loader) {
    return <div><h1 className="wait">Loading...</h1></div>;
  }

  const redirect_to_home = () => { history.push("/"); };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Add Product (Raw Material Supplier Only)</h3>
            <button onClick={redirect_to_home} className="btn btn-outline-danger btn-sm">HOME</button>
          </div>
          <div className="mb-3"><b>Current Account Address:</b> <span>{currentaccount}</span></div>
          {!isRMS ? (
            <div className="alert alert-warning">Only Raw Material Supplier can create products.</div>
          ) : (
            <div className="card">
              <div className="card-header"><h5>Create New Product</h5></div>
              <div className="card-body">
                <form onSubmit={createProduct}>
                  <div className="form-group">
                    <label>Product Name:</label>
                    <input
                      className="form-control"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Enter product description"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Product Type:</label>
                        <select
                          className="form-control"
                          name="productType"
                          value={form.productType}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Type</option>
                          {productTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Location:</label>
                        <input
                          className="form-control"
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder="Enter your location"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Note (optional):</label>
                        <input
                          className="form-control"
                          type="text"
                          name="note"
                          value={form.note}
                          onChange={handleChange}
                          placeholder="Any note"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Batch Number:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.batchNumber}
                      onChange={(e) => setForm({...form, batchNumber: e.target.value})}
                      placeholder="Enter batch number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.expiryDate}
                      onChange={(e) => setForm({...form, expiryDate: e.target.value})}
                      placeholder="Enter expiry date"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>QR Code:</label>
                    <div className="d-flex align-items-center">
                      <button type="button" className="btn btn-primary btn-sm mr-2" onClick={generateQRCode}>
                        Generate QR Code
                      </button>
                      {qrCode && (
                        <>
                          <QRCode value={qrCode} size={128} />
                          <div className="ml-3"><code>{qrCode}</code></div>
                        </>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-success btn-block" type="submit">
                    Create Product
                  </button>
                </form>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddMed;
