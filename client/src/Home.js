import React from "react";
import { useHistory } from "react-router-dom";

// Thêm Google Fonts Poppins cho toàn trang
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

function Home() {
  const history = useHistory();
  const redirect_to_roles = () => {
    history.push("/roles");
  };
  const redirect_to_addmed = () => {
    history.push("/addmed");
  };
  const redirect_to_supply = () => {
    history.push("/supply");
  };
  const redirect_to_track = () => {
    history.push("/track");
  };
  const redirect_to_qr_scanner = () => {
    history.push("/qr-scanner");
  };
  const redirect_to_owner_setup = () => {
    history.push("/owner-setup");
  };

  return (
    <div className="container mt-5" style={{fontFamily: 'Poppins, sans-serif'}}>
      {/* Style nội bộ cho hiệu ứng glass, gradient, icon động, số thứ tự, ... */}
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.7);
          box-shadow: 0 8px 32px 0 rgba(31,38,135,0.10);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          border: 1.5px solid rgba(255,255,255,0.18);
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .glass-card:hover {
          box-shadow: 0 16px 48px 0 rgba(31,38,135,0.18);
          transform: translateY(-4px) scale(1.03);
        }
        .step-circle {
          width: 54px; height: 54px;
          background: linear-gradient(135deg, #1a7f37 0%, #28a745 100%);
          color: #fff; font-size: 2rem; font-weight: 700;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px auto; box-shadow: 0 2px 8px rgba(40,167,69,0.15);
          border: 3px solid #fff;
        }
        .icon-animate {
          transition: transform 0.3s, color 0.3s;
        }
        .glass-card:hover .icon-animate {
          transform: scale(1.18) rotate(-8deg);
          color: #1a7f37 !important;
        }
        .feature-card {
          background: rgba(255,255,255,0.85);
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(40,167,69,0.08);
          border: 1.5px solid #e3ffe8;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .feature-card:hover {
          box-shadow: 0 8px 32px rgba(40,167,69,0.18);
          transform: translateY(-3px) scale(1.03);
        }
        .gradient-border {
          border: 2px solid;
          border-image: linear-gradient(135deg, #1a7f37, #28a745, #ffc107) 1;
        }
        .btn-lg {
          font-size: 1.15rem;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }
        .btn-lg:hover {
          filter: brightness(1.08);
          box-shadow: 0 2px 12px rgba(40,167,69,0.12);
        }
        @media (max-width: 767px) {
          .step-circle { width: 40px; height: 40px; font-size: 1.2rem; }
        }
      `}</style>
      <div className="row">
        <div className="col-12">
          {/* Header với logo và subheading */}
          <div className="text-center mb-5 p-4" style={{
            background: 'linear-gradient(90deg, #e3ffe8 0%, #f9f9ff 100%)',
            borderRadius: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            position: 'relative',
          }}>
            <img src="https://img.icons8.com/color/96/000000/blockchain-new-logo.png" alt="logo" style={{width:72, marginBottom:12}}/>
            <h1 className="display-4 font-weight-bold mb-2" style={{color:'#1a7f37', letterSpacing:1}}>Blockchain Supply Chain</h1>
            <div className="mb-2" style={{fontSize:20, color:'#28a745', fontWeight:600}}>Smart, Secure & Transparent</div>
            <p className="lead" style={{fontSize:22}}>Empowering trust and traceability for every product journey</p>
          </div>

          {/* Steps section */}
          <div className="row text-center mb-5">
            {[
              {step:1, icon:'fas fa-users', color:'#007bff', title:'Register Participants', desc:'Register Raw Material Suppliers, Manufacturers, Distributors, and Retailers', btn:'Register Participants', onClick:redirect_to_roles, btnClass:'btn-primary'},
              {step:2, icon:'fas fa-plus-square', color:'#28a745', title:'Add Products', desc:'Add new products with QR codes and tracking information', btn:'Add Products', onClick:redirect_to_addmed, btnClass:'btn-success'},
              {step:3, icon:'fas fa-cogs', color:'#17a2b8', title:'Manage Supply Chain', desc:'Control the flow of products through the supply chain', btn:'Manage Supply Chain', onClick:redirect_to_supply, btnClass:'btn-info'},
              {step:4, icon:'fas fa-search-location', color:'#ffc107', title:'Track Products', desc:'Track the current status and location of products', btn:'Track Products', onClick:redirect_to_track, btnClass:'btn-warning'},
            ].map((item, idx) => (
              <div className="col-md-3 mb-4" key={item.step}>
                <div className="glass-card h-100 p-4 d-flex flex-column align-items-center justify-content-between">
                  <div className="step-circle mb-2" style={{background: `linear-gradient(135deg, ${item.color} 0%, #fff 100%)`, color:'#fff', border:`3px solid ${item.color}`}}>{item.step}</div>
                  <div className="icon-animate mb-2" style={{fontSize:38, color:item.color}}><i className={item.icon}></i></div>
                  <h6 className="mt-2 font-weight-bold" style={{fontSize:18}}>{item.title}</h6>
                  <p className="card-text mt-2" style={{minHeight:56}}>{item.desc}</p>
                  <button
                    onClick={item.onClick}
                    className={`btn ${item.btnClass} btn-lg mt-2 w-100`}
                  >
                    {item.btn}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* QR Scanner & Owner Management */}
          <div className="row mb-5">
            <div className="col-md-6 mb-4">
              <div className="glass-card p-4 h-100 d-flex flex-column align-items-center gradient-border">
                <div className="icon-animate mb-2" style={{fontSize:44, color:'#343a40'}}><i className="fas fa-qrcode"></i></div>
                <h5 className="font-weight-bold mb-2">QR Code Scanner & Verification</h5>
                <p className="mb-3 text-center">Scan QR codes to verify product authenticity and view detailed tracking information</p>
                <button
                  onClick={redirect_to_qr_scanner}
                  className="btn btn-dark btn-lg w-100"
                >
                  QR Scanner & Verification
                </button>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="glass-card p-4 h-100 d-flex flex-column align-items-center gradient-border">
                <div className="icon-animate mb-2" style={{fontSize:44, color:'#6c757d'}}><i className="fas fa-user-shield"></i></div>
                <h5 className="font-weight-bold mb-2">Owner Management</h5>
                <p className="mb-3 text-center">Manage contract ownership and transfer ownership to other addresses</p>
                <button
                  onClick={redirect_to_owner_setup}
                  className="btn btn-secondary btn-lg w-100"
                >
                  Owner Setup & Management
                </button>
              </div>
            </div>
          </div>

          {/* Features section */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="glass-card p-4 border-0 shadow-lg" style={{borderRadius:24}}>
                <div className="mb-4 text-center">
                  <h4 className="mb-0 font-weight-bold" style={{color:'#1a7f37'}}>Features</h4>
                </div>
                <div className="row text-center">
                  {[
                    {icon:'🔒', title:'Blockchain Security', desc:'Immutable records on the blockchain ensure data integrity and prevent tampering'},
                    {icon:'📱', title:'QR Code Integration', desc:'Scan QR codes to instantly verify product authenticity and view complete tracking history'},
                    {icon:'📊', title:'Detailed Tracking', desc:'Track products from raw materials to final sale with location and timestamp data'},
                    {icon:'👥', title:'Role-based Access', desc:'Different participants have specific permissions based on their role in the supply chain'},
                    {icon:'✅', title:'Verification System', desc:'Verify participant licenses and product authenticity to prevent counterfeiting'},
                    {icon:'📈', title:'Real-time Updates', desc:'Get real-time updates on product status and supply chain progress'},
                  ].map((item, idx) => (
                    <div className="col-md-4 mb-4" key={item.title}>
                      <div className="feature-card h-100 p-4 d-flex flex-column align-items-center gradient-border">
                        <div style={{fontSize:44}}>{item.icon}</div>
                        <h6 className="mt-3 font-weight-bold">{item.title}</h6>
                        <p className="mb-0">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
