import { useState, useEffect } from "react";
import { toWords } from "number-to-words";
import QRCode from "qrcode";
import "./App.css";
import logo from "./assets/Resources/Images/logo.png";
import paid from "./assets/Resources/Images/paid.png";
import qr from "./assets/Resources/Images/QRCode.png";

const suggestions = [
  {
    icon: "✈️",
    description: "Flight Booking",
    qty: 1,
    rate: 500,
    hsn: "",
  },
  {
    icon: "🖨️",
    description: "Color Print",
    qty: 30,
    rate: 20,
    hsn: "",
  },
  {
    icon: "📄",
    description: "Photo Copy",
    qty: 50,
    rate: 2,
    hsn: "",
  },
];

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    icon: "",
    description: "",
    qty: 1,
    rate: 0,
    hsn: "",
  });
  const [billPaid, setBillPaid] = useState(false);
  const [showClient, setShowClient] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authCredentials, setAuthCredentials] = useState({
    username: "",
    password: ""
  });
  const [authError, setAuthError] = useState("");
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [invoiceName, setInvoiceName] = useState("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [client, setClient] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);

  const grandTotal = subtotal;

  // Date and invoice info

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const date = today.toLocaleDateString();
  const second = today.getSeconds();
  const hours = today.getHours();
  const currentDate = date;

  const invoiceCountLogic = () => {
    let part1 = `${year}`.slice(2);
    let part2 = month.toString().padStart(1, "0");
    let part3 = hours.toString().padStart(1, "0");
    let part4 = second.toString().padStart(1, "0");
    let count = part4 + part3 + part2 + part1;

    console.log(count);

    return count;
  };
  const invoiceCount = invoiceCountLogic();

  invoiceCountLogic();
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  // Handle suggestion select
  const handleSuggestion = (suggestion) => {
    setNewItem({ ...suggestion });
  };

  // Add new item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.qty || !newItem.rate) return;
    setItems([
      ...items,
      { ...newItem, qty: Number(newItem.qty), rate: Number(newItem.rate) },
    ]);
    setNewItem({ icon: "", description: "", qty: 1, rate: 0, hsn: "" });
  };

  // Add this at the top with your other useState hooks:
  const [author, setAuthor] = useState("Mohidul Haque");

  // Handle client info
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  // Generate PDF download function
  const downloadPDF = async (e) => {
    e.preventDefault();
    
    try {
      // Create filename
      const fileName = `Invoice_${invoiceCount}_${client.name || 'Customer'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      
      // Set document title for PDF
      const originalTitle = document.title;
      document.title = fileName.replace('.pdf', '');
      
      // Use browser's print functionality to save as PDF
      // This will open the print dialog where user can choose "Save as PDF"
      window.print();
      
      // Restore title
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const funPrint = (e) => {
    e.preventDefault();
    
    // Create a filename with invoice details
    const fileName = `Invoice_${invoiceCount}_${client.name || 'Customer'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
    
    // Store original title
    const originalTitle = document.title;
    
    // Set document title for PDF filename
    document.title = fileName.replace('.pdf', '');
    
    // Print options for better PDF output
    const printOptions = {
      margin: '0.5in',
      format: 'A4',
      orientation: 'portrait',
      border: '0',
      footer: null,
      header: null
    };
    
    // Trigger browser print dialog which allows saving as PDF
    window.print();
    
    // Restore original title after a delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Handle author radio change
  const handleAuthorRadio = (e) => {
    setAuthor(e.target.value);
  };

  // Handle authentication
  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthCredentials({ ...authCredentials, [name]: value });
    setAuthError(""); // Clear error when user types
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const correctUsername = "Admin_digital";
    const correctPassword = "Mohidul";
    
    if (authCredentials.username === correctUsername && authCredentials.password === correctPassword) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthError("");
      // Store authentication in localStorage to remember the user
      localStorage.setItem('digitalInvoiceAuth', 'true');
    } else {
      setAuthError("Invalid username or password. Please try again.");
      setAuthCredentials({ username: "", password: "" });
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const isAuth = localStorage.getItem('digitalInvoiceAuth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      setShowAuthModal(false);
    }
    // Load saved invoices
    loadSavedInvoices();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && isAuthenticated && (items.length > 0 || client.name)) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveInvoice();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [items, client, autoSaveEnabled, isAuthenticated]);

  // Load saved invoices from localStorage
  const loadSavedInvoices = () => {
    try {
      const saved = localStorage.getItem('digitalInvoiceSaved');
      if (saved) {
        setSavedInvoices(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved invoices:', error);
    }
  };

  // Save current invoice - now downloads as file
  const saveInvoice = (name = null) => {
    const invoiceData = {
      id: Date.now(),
      name: name || `Invoice_${invoiceCount}_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
      items,
      client,
      author,
      billPaid,
      showClient,
      grandTotal,
      createdAt: new Date().toISOString(),
      invoiceNumber: invoiceCount,
      companyInfo: {
        name: "DIGITAL SEVA SERVICES",
        address: "Near HDFC Bank, Bathu Basti",
        location: "Garacharma, Sri Vijaya Puram, South Andaman",
        state: "Andaman & Nicobar Islands, India - 744105",
        phone: "+91-8900981511",
        upi: "8900981511@ybl"
      }
    };

    try {
      // Create downloadable file
      const dataStr = JSON.stringify(invoiceData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const fileName = `${name || `Invoice_${invoiceCount}_${new Date().toLocaleDateString().replace(/\//g, '-')}`}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();

      // Also save to localStorage for backup
      const existingInvoices = JSON.parse(localStorage.getItem('digitalInvoiceSaved') || '[]');
      const updatedInvoices = [invoiceData, ...existingInvoices.slice(0, 19)]; // Keep last 20 invoices
      localStorage.setItem('digitalInvoiceSaved', JSON.stringify(updatedInvoices));
      setSavedInvoices(updatedInvoices);
      setLastSaved(new Date());
      
      return true;
    } catch (error) {
      console.error('Error saving invoice:', error);
      return false;
    }
  };

  // Auto-save invoice
  const autoSaveInvoice = () => {
    if (items.length > 0 || client.name) {
      const autoSaveName = `AutoSave_${new Date().getTime()}`;
      saveInvoice(autoSaveName);
    }
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setItems([]);
      setClient({ name: "", address: "", phone: "", email: "" });
      setBillPaid(false);
      setShowClient(false);
      setNewItem({ icon: "", description: "", qty: 1, rate: 0, hsn: "" });
    }
  };

  // Handle save modal
  const handleSaveInvoice = () => {
    if (invoiceName.trim()) {
      const success = saveInvoice(invoiceName.trim());
      if (success) {
        setShowSaveModal(false);
        setInvoiceName("");
        alert('Invoice downloaded successfully! Check your Downloads folder.');
      } else {
        alert('Error downloading invoice. Please try again.');
      }
    }
  };

  // Generate UPI payment QR code
  const generatePaymentQR = async (amount) => {
    if (amount <= 0) {
      setQrCodeUrl("");
      return;
    }

    // UPI payment URL format
    const upiId = "8900981511@ybl";
    const payeeName = "Digital Seva Services";
    const transactionNote = `Invoice #${invoiceCount}`;
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeUrl("");
    }
  };

  // Update QR code when total changes
  useEffect(() => {
    generatePaymentQR(grandTotal);
  }, [grandTotal, invoiceCount]);
  return (
    <>
      {/* Authentication Modal */}
      {showAuthModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Digital Seva</h2>
              <p className="text-gray-600">Please login to access the invoice system</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={authCredentials.username}
                  onChange={handleAuthInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={authCredentials.password}
                  onChange={handleAuthInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {authError}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transform transition-all duration-200 hover:scale-[1.02] focus:scale-[1.02]"
              >
                Login to Continue
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Secure access to Digital Seva Services
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Application Content */}
      {isAuthenticated && (
        <div className="print:w-[210mm] print:h-[297mm] w-full min-h-screen flex flex-col items-center  py-8 rounded-2xl">
        
        {/* Toolbar */}
        <div className="w-full max-w-3xl bg-gray-50 px-4 py-3 flex flex-wrap justify-between items-center rounded-t-2xl shadow-sm print:hidden mb-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              💾 Download JSON
            </button>
            <button
              onClick={downloadPDF}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              📄 Download PDF
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              🗑️ Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="accent-blue-600"
              />
              Auto-save
            </label>
            {lastSaved && (
              <span className="text-xs text-green-600">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <div className="text-xs text-blue-600 font-medium">
              Invoice #{invoiceCount} • Items: {items.length} • Total: ₹{grandTotal}
            </div>
          </div>
        </div>

        {/* Header section */}
        <div className="w-full max-w-3xl bg-blue-600 text-white justify-between items-center px-8 py-6 rounded-tr-4xl shadow-lg hidden print:flex">
          {/* Left: Logo and Company Info */}
          <div className="flex items-center gap-6">
            <img
              className="rounded-full w-18 h-18 bg-white p-2 shadow"
              src={logo}
              alt="Logo"
            />
            <div>
              <div className="font-bold text-2xl md:text-xl leading-tight tracking-wide">
                DIGITAL SEVA
                <br />
                SERVICES
              </div>
              <div className="text-sm opacity-80">
                Near HDFC Bank, Bathu Basti{" "}
              </div>
              <div className="text-sm opacity-80">
                Garacharma, Sri Vijaya Puram, South Andaman{" "}
              </div>
              <div className="text-sm opacity-80">
                Andaman & Nicobar Islands, India - 744105{" "}
              </div>
            </div>
          </div>
          {/* Right: Invoice Info */}
          <div className="flex flex-col items-end gap-2">
            <div className="font-bold text-4xl md:text-xl tracking-wider">
              INVOICE
            </div>
            <div className="flex gap-8 text-xs md:text-base">
              <div className="flex flex-col items-end">
                <span className="opacity-80">#{invoiceCount}</span>
                <span className="opacity-80">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info Toggle */}
        <div className="w-full max-w-3xl bg-cyan-400 px-4 py-3 flex flex-col gap-1  mt-1 rounded-bl-4xl rounded">
          <label className="flex items-center gap-2 font-medium print:hidden text-xl text--400">
            <input
              type="checkbox"
              checked={showClient}
              onChange={() => setShowClient(!showClient)}
              className="accent-blue-600 print:hidden"
            />
            Invoice to client
          </label>
          <label className="flex items-center gap-2 font-medium print:hidden text-xl text--400">
            <input
              type="radio"
              name="Person"
              value="Mohidul Haque"
              checked={author === "Mohidul Haque"}
              onChange={handleAuthorRadio}
              className="accent-blue-600 print:hidden"
            />
            Mohidul
          </label>
          <label className="flex items-center gap-2 font-medium print:hidden text-xl text--400">
            <input
              type="radio"
              name="Person"
              value="Abdul Hanif"
              checked={author === "Abdul Hanif"}
              onChange={handleAuthorRadio}
              className="accent-blue-600 print:hidden"
            />
            Abdul
          </label>

          {showClient && (
            <div className="grid grid-cols-1 md:grid-cols-2  gap-2 mt-2">
              <h1 className="hidden print:flex text-2xl ">Client Details </h1>

              <input
                className="border font-semibold px-2 py-1 rounded  "
                name="name"
                placeholder="Client Name"
                value={client.name}
                onChange={handleClientChange}
                required
              />

              <input
                type="number"
                className="border px-2 py-1 rounded"
                name="phone"
                placeholder="Client Phone"
                value={client.phone}
                onChange={handleClientChange}
              />
              <input
                className="border px-2 py-1 rounded md:col-span-2"
                name="address"
                placeholder="Client Address"
                value={client.address}
                onChange={handleClientChange}
              />

              <input
                className="border px-2 py-1 rounded md:col-span-2 "
                name="email"
                placeholder="Client Email"
                value={client.email}
                onChange={handleClientChange}
              />
            </div>
          )}
        </div>

        {/* Table section */}
        <div className="w-full max-w-3xl bg-white px-8 py-6 shadow">
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4 ">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="border rounded px-3 py-1 flex items-center gap-2 hover:bg-blue-100 transition print:hidden"
                onClick={() => handleSuggestion(s)}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs">{s.description}</span>
              </button>
            ))}
          </div>
          <form
            className="flex flex-wrap gap-2 mb-6 print:hidden"
            onSubmit={handleAddItem}
          >
            <input
              className="border px-2 py-1 rounded w-16"
              name="icon"
              placeholder="Icon"
              value={newItem.icon}
              onChange={handleChange}
              list="icon-suggestions"
            />
            <input
              className="border px-2 py-1 rounded flex-1"
              name="description"
              placeholder="Description"
              value={newItem.description}
              onChange={handleChange}
              required
            />
            <input
              className="border px-2 py-1 rounded w-16"
              name="qty"
              type="number"
              min="1"
              value={newItem.qty}
              onChange={handleChange}
              required
            />
            <input
              className="border px-2 py-1 rounded w-24"
              name="rate"
              type="number"
              min="0"
              value={newItem.rate}
              onChange={handleChange}
              required
            />
            <input
              className="border px-2 py-1 rounded w-24"
              name="hsn"
              placeholder="HSN/SAC"
              value={newItem.hsn}
              onChange={handleChange}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-green-700 hover:cursor-grab "
            >
              Add
            </button>
          </form>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="py-2 px-3 text-left font-semibold">
                  Description
                </th>
                <th className="py-2 px-3 text-center font-semibold">Qty</th>
                <th className="py-2 px-3 text-right font-semibold">Rate</th>
                <th className="py-2 px-3 text-center font-semibold">HSN/SAC</th>
                <th className="py-2 px-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white text-black">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No items added yet. Use suggestions or add your own.
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr className="border-b" key={idx}>
                  <td className="py-2 px-3 flex items-center gap-2">
                    <span className="text-blue-600">{item.icon}</span>
                    {item.description}
                  </td>
                  <td className="py-2 px-3 text-center">{item.qty}</td>
                  <td className="py-2 px-3 text-right">₹{item.rate}</td>
                  <td className="py-2 px-3 text-center">{item.hsn}</td>
                  <td className="py-2 px-3 text-right">
                    ₹{item.qty * item.rate}
                  </td>
                </tr>
              ))}
              {/* Subtotal */}
              <tr>
                <td colSpan={4} className="py-2 px-3 text-right font-semibold">
                  Subtotal
                </td>
                <td className="py-2 px-3 text-right">₹{subtotal}</td>
              </tr>

              {/* Grand Total */}
              <tr>
                <td
                  colSpan={4}
                  className="py-2 px-3 text-right font-bold text-lg bg-orange-500 text-white"
                >
                  {" "}
                  Total Amount
                </td>
                <td className="py-2 px-3 text-right font-bold text-lg bg-orange-500 text-white">
                  ₹{grandTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR code / Paid section */}
        <div className="w-full max-w-3xl bg-white px-8 py-6 flex flex-wrap justify-between items-center border-t shadow">
          {/* Payment Section */}
          <div className=" flex flex-col items-center px-6 py-4 rounded">
            <label className="flex items-center gap-2 mb-2 font-medium print:hidden">
              <input
                type="checkbox"
                checked={billPaid}
                onChange={() => setBillPaid(!billPaid)}
                className="accent-green-600 print:hidden "
              />
              Bill Paid
            </label>

            {billPaid ? (
              <img
                src={paid}
                alt="Paid"
                className="w-32 h-32 mb-1 print:block hidden"
              />
            ) : (
              <div>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="w-32 h-32 mb-1 print:block hidden"
                  />
                ) : grandTotal > 0 ? (
                  <div className="w-32 h-32 mb-1 print:flex hidden items-center justify-center border-2 border-gray-300 text-gray-500 text-xs">
                    Generating QR...
                  </div>
                ) : (
                  <img
                    src={qr}
                    alt="QR Code"
                    className="w-32 h-32 mb-1 print:block hidden"
                  />
                )}
                <h1 className="text-blue-400 hidden print:block text-center">
                  8900981511@ybl
                </h1>
                {grandTotal > 0 && (
                  <h2 className="text-green-600 hidden print:block text-center font-semibold">
                    Amount: ₹{grandTotal}
                  </h2>
                )}
              </div>
            )}
            <div className="text-green-700 font-semibold text-lg mt-2 hidden print:block ">
              {billPaid
                ? "Thank you for your payment!"
                : "Scan to pay instantly"}
            </div>

            {/* Print button */}
          </div>
          <button
            onClick={funPrint}
            className="print:hidden mt-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-200"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
              📄 Save as PDF
            </span>
          </button>
          {/* Signature / Authority */}
          <div className="flex-col items-center px-6 py-4 rounded mr-4 hidden print:flex">
            <div className="flex-col items-center px-6 py-4 rounded mr-4 hidden print:flex">
              <h1 className="text-md mb-1 mr-40 ">For,</h1>
              <p className="uppercase font-bold">{author}</p>
              <p className="text-sm mt-20">Authorised Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer section */}
        <div className="w-full max-w-3xl bg-white px-8 py-4 rounded-b-2xl shadow  flex-col gap-2 border-t mt-2 hidden print:block">
          <div className="text-gray-700 text-sm ">
            <span className="font-semibold">INR (in words):</span>{" "}
            {grandTotal === 0
              ? "Zero"
              : `${toWords(grandTotal).replace(/\b\w/g, (l) =>
                  l.toUpperCase()
                )} Rupees Only`}
          </div>
          <div className="text-gray-700 text-sm">
            <span className="font-semibold">Terms & Conditions:</span>This
            invoice is system-generated and does not require a signature. For
            any queries or support, please contact us at{" "}
            <span className="underline">+91-8900981511</span>.
          </div>
          <div className="text-blue-700 font-semibold text-center mt-2">
            {showClient && client.name
              ? `Dear ${client.name}, we appreciate your business!`
              : "Thank you for choosing Digital Seva Services."}
          </div>
        </div>
        </div>
      )}

      {/* Save Invoice Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Download Invoice Data</h3>
            <input
              type="text"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              placeholder="Enter invoice name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveInvoice}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download JSON
              </button>
              <button
                onClick={() => {setShowSaveModal(false); setInvoiceName("");}}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
