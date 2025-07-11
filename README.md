# Blockchain Supply Chain Management

A modern, transparent, and secure supply chain management system using Blockchain, QR code, and Web3 technology.

## 🚀 Features
- **Role-based Supply Chain:** Register as Raw Material Supplier, Manufacturer, Distributor, Retailer, or Consumer.
- **Product Tracking:** Add products, generate QR codes, and track every movement in the supply chain.
- **QR Code Verification:** Instantly verify product authenticity and view full tracking history by scanning QR codes.
- **Blockchain Security:** All data is stored immutably on the blockchain (Ethereum-compatible).
- **Modern UI:** Responsive, professional interface built with React and Bootstrap.

## 🛠️ Tech Stack
- **Frontend:** React, Bootstrap, Web3.js
- **Smart Contract:** Solidity (SupplyChain.sol)
- **Blockchain:** Local (Ganache/Hardhat) or public Ethereum testnet
- **QR Code:** qrcode.react, react-qr-reader
- **Icons:** Font Awesome, Icons8

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone <repo-url>
cd lv3/Blockchain-Based-Supply-Chain
```

### 2. Install dependencies for frontend
```bash
cd client
npm install
```

### 3. Install Font Awesome (for icons)
```bash
npm install @fortawesome/fontawesome-free
```
Add to `src/index.js` or `src/App.js`:
```js
import '@fortawesome/fontawesome-free/css/all.min.css';
```

### 4. Compile & deploy smart contract
- Open a new terminal:
```bash
cd ../contracts
npm install
npx hardhat compile
npx hardhat node # or use Ganache
npx hardhat run scripts/deploy.js --network localhost
```
- Copy deployed contract address and ABI to `client/src/artifacts/SupplyChain.json` if needed.

### 5. Start the frontend
```bash
cd ../client
npm start
```
- App runs at [http://localhost:3000](http://localhost:3000)

## 📝 Usage Guide

### 1. Register Participants
- Go to **Register Participants** (Step 1)
- Register as Raw Material Supplier, Manufacturer, Distributor, Retailer, or Consumer

### 2. Add Products
- Go to **Add Products** (Step 2)
- Add new products, generate QR codes for each

### 3. Manage Supply Chain
- Go to **Manage Supply Chain** (Step 3)
- Transfer products to next role, approve steps, add tracking info
- View and manage your owned products

### 4. Track Products
- Go to **Track Products** (Step 4)
- View product status, full tracking history

### 5. QR Code Scanner & Verification
- Go to **QR Scanner & Verification**
- Scan QR code with your camera or enter code manually
- Instantly verify authenticity and view product journey

### 6. Owner Management
- Go to **Owner Setup & Management**
- View and transfer contract ownership

## 💡 Notes
- Use MetaMask or a Web3 wallet to interact with the dApp.
- Make sure your wallet is connected to the same network as the deployed contract.
- For best UI, use Chrome or Firefox.

## 👨‍💻 Development Team
- Project for educational/demo purposes.
- Contributors: [Your Name/Team]

## 📷 Screenshots
_Add screenshots of the main UI screens here if needed._

---

Feel free to contribute or open issues for improvements!
