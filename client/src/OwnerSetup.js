import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Web3 from "web3";
import SupplyChainABI from "./artifacts/SupplyChain.json";

function OwnerSetup() {
  const history = useHistory();
  const [currentaccount, setCurrentaccount] = useState("");
  const [loader, setloader] = useState(true);
  const [SupplyChain, setSupplyChain] = useState();
  const [isOwner, setIsOwner] = useState(false);
  const [currentOwner, setCurrentOwner] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

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
        // Check if current user is owner
        const owner = await supplychain.methods.owner().call();
        setCurrentOwner(owner);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error("Error loading data:", error);
      }
      
      setloader(false);
    } else {
      window.alert("The smart contract is not deployed to current network");
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
    
    setTransferLoading(true);
    try {
      await SupplyChain.methods.transferOwnership(newOwnerAddress).send({ from: currentaccount });
      alert("Ownership transferred successfully!");
      setNewOwnerAddress("");
      loadBlockchaindata();
    } catch (err) {
      alert("An error occurred: " + err.message);
    }
    setTransferLoading(false);
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

  const redirect_to_home = () => {
    history.push("/");
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Owner Management</h3>
            <button
              onClick={redirect_to_home}
              className="btn btn-outline-danger btn-sm"
            >
              HOME
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>Contract Ownership</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <strong>Current Owner:</strong> {currentOwner}
                <br />
                <strong>Your Address:</strong> {currentaccount}
                <br />
                <strong>Status:</strong> 
                <span className={`badge ${isOwner ? 'badge-success' : 'badge-warning'} ml-2`}>
                  {isOwner ? 'You are the owner' : 'You are not the owner'}
                </span>
              </div>

              {isOwner ? (
                <div className="mt-3">
                  <h6>Transfer Ownership</h6>
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
                    className="btn btn-warning"
                    onClick={transferOwnership}
                    disabled={!newOwnerAddress || transferLoading}
                  >
                    {transferLoading ? 'Transferring...' : 'Transfer Ownership'}
                  </button>
                  <div className="alert alert-warning mt-3">
                    <strong>Warning:</strong> Transferring ownership is irreversible. 
                    The new owner will have full control over the contract.
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <h5>Access Denied</h5>
                  <p>Only the current contract owner can transfer ownership.</p>
                  <p>If you need to become the owner, contact the current owner to transfer ownership to your address.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5>Owner Responsibilities</h5>
            </div>
            <div className="card-body">
              <ul>
                <li>Register participants (Raw Material Suppliers, Manufacturers, Distributors, Retailers)</li>
                <li>Manage contract ownership</li>
                <li>Monitor supply chain activities</li>
                <li>Ensure system security and integrity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerSetup; 