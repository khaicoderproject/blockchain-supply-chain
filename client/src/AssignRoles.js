import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";

function AssignRoles() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [participants, setParticipants] = useState([]);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [currentOwner, setCurrentOwner] = useState("");
  const [form, setForm] = useState({ address: "", name: "", location: "", role: "" });
  const [error, setError] = useState("");

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
      const supplychain = new web3.eth.Contract(
        SupplyChainABI.abi,
        networkData.address
      );
      setSupplyChain(supplychain);
      
      try {
        // Check if current user is owner
        const owner = await supplychain.methods.owner().call();
        setCurrentOwner(owner);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
        
        // Load participants
        const participantAddresses = await supplychain.methods.getParticipantAddresses().call();
        const participantList = [];
        for (let i = 0; i < participantAddresses.length; i++) {
          const participant = await supplychain.methods.getParticipant(participantAddresses[i]).call();
          participantList.push(participant);
        }
        setParticipants(participantList);
      } catch (error) {
        console.error("Error loading data:", error);
      }
      
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.address || !form.name || !form.location || !form.role) {
      setError("Please fill all fields");
      return;
    }
    try {
      await SupplyChain.methods.registerParticipant(
        form.address,
        form.name,
        form.location,
        parseInt(form.role)
      ).send({ from: currentaccount });
      setForm({ address: "", name: "", location: "", role: "" });
      loadBlockchaindata();
    } catch (err) {
      setError("Registration failed: " + (err.message || err));
    }
  };

  const transferOwnership = async () => {
    if (!newOwnerAddress) {
      alert("Please enter the new owner address");
      return;
    }
    
    if (!window.web3.utils.isAddress(newOwnerAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    
    try {
      await SupplyChain.methods.transferOwnership(newOwnerAddress).send({ from: currentaccount });
      alert("Ownership transferred successfully!");
      setNewOwnerAddress("");
      loadBlockchaindata();
    } catch (err) {
      alert("An error occurred: " + err.message);
    }
  };

  const roleOptions = [
    { value: 1, label: "Raw Material Supplier" },
    { value: 2, label: "Manufacturer" },
    { value: 3, label: "Distributor" },
    { value: 4, label: "Retailer" },
    { value: 5, label: "Consumer" }
  ];

  if (loader) {
    return <div><h1 className="wait">Loading...</h1></div>;
  }

  const redirect_to_home = () => { history.push("/"); };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Participant Management (Owner Only)</h3>
            <button onClick={redirect_to_home} className="btn btn-outline-danger btn-sm">HOME</button>
          </div>
          <div className="mb-3"><b>Current Account Address:</b> <span>{currentaccount}</span></div>
          {isOwner && (
            <div className="card mt-3">
              <div className="card-header">
                <h5>Owner Management</h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <strong>Current Owner:</strong> {currentOwner}
                </div>
                <div className="form-group">
                  <label>New Owner Address:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="Enter new owner address"
                  />
                </div>
                <button
                  className="btn btn-warning btn-block"
                  onClick={transferOwnership}
                  disabled={!newOwnerAddress}
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="mb-4">
              <h5>Register New Participant</h5>
              <form className="form-inline" onSubmit={handleRegister}>
                <input
                  type="text"
                  className="form-control mr-2 mb-2"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ethereum Address"
                  style={{ width: 220 }}
                />
                <input
                  type="text"
                  className="form-control mr-2 mb-2"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Name"
                  style={{ width: 180 }}
                />
                <input
                  type="text"
                  className="form-control mr-2 mb-2"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Location"
                  style={{ width: 140 }}
                />
                <select
                  className="form-control mr-2 mb-2"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{ width: 180 }}
                >
                  <option value="">Select Role</option>
                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button className="btn btn-success mb-2" type="submit">Register</button>
              </form>
              {error && <div className="alert alert-danger mt-2">{error}</div>}
            </div>
          ) : (
            <div className="alert alert-warning">
              <h5>Access Denied</h5>
              <p>Only the contract owner can register participants and manage ownership.</p>
              <p><strong>Current Owner:</strong> {currentOwner}</p>
            </div>
          )}

          <h5>All Participants</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="thead-dark">
                <tr>
                  <th>Address</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No participants registered.</td></tr>
                ) : (
                  participants.map((p, idx) => (
                    <tr key={idx}>
                      <td><code>{p.addr}</code></td>
                      <td>{p.name}</td>
                      <td>{p.location}</td>
                      <td>{roleOptions.find(r => r.value === parseInt(p.role)).label}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignRoles;
