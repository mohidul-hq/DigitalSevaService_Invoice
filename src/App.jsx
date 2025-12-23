import { useState, useEffect, useRef } from "react";
import { toWords } from "number-to-words";
import QRCode from "qrcode";
import "./App.css";
import logo from "./assets/Resources/Images/logo.png";
import paid from "./assets/Resources/Images/paid.png";

const suggestions = [
  { icon: "✈️", description: "Flight Booking", qty: 1, rate: 500, hsn: "" },
  { icon: "🖨️", description: "Color Print", qty: 30, rate: 20, hsn: "" },
  { icon: "📄", description: "Photo Copy", qty: 50, rate: 2, hsn: "" },
];
// Additional service suggestions (can be expanded)
const moreSuggestions = [
  { icon: "🆔", description: "PAN Card ", qty: 1, rate: 300, hsn: "" },
  { icon: "🏠", description: "Aadhaar Address Update", qty: 1, rate: 100, hsn: "" },
  { icon: "🗳️", description: "Voter ID Correction", qty: 1, rate: 200, hsn: "" },
  { icon: "🛡️", description: "Insurance Premium Payment", qty: 1, rate: 100, hsn: "" },
  { icon: "💡", description: "Electricity Bill Payment", qty: 1, rate: 40, hsn: "" },
  { icon: "🛣️", description: "Road Tax Payment", qty: 1, rate: 40, hsn: "" },
  { icon: "🚆", description: "Train Ticket Booking", qty: 1, rate: 150, hsn: "" },

  { icon: "📺", description: "DTH Recharge", qty: 1, rate: 100, hsn: "" },
  { icon: "💳", description: "Money Transfer Service", qty: 1, rate: 50, hsn: "" },
  
  { icon: "🖼️", description: "Passport Photo ", qty: 1, rate: 100, hsn: "" },
  { icon: "📑", description: "Lamination A4", qty: 1, rate: 40, hsn: "" },
  
  { icon: "🛂", description: "Passport Form Fill", qty: 1, rate: 300, hsn: "" },
];

function App() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    icon: "",
    description: "",
    qty: 1,
    rate: 1,
    hsn: "",
  });
  const [itemError, setItemError] = useState("");
  const [billPaid, setBillPaid] = useState(false);
  const [showClient, setShowClient] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authCredentials, setAuthCredentials] = useState({
    username: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [client, setClient] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [printBtnPos, setPrintBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem("printButtonPos");
      return saved ? JSON.parse(saved) : { x: 20, y: 100 };
    } catch {
      return { x: 20, y: 100 };
    }
  });
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const btnRef = useRef(null);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [author, setAuthor] = useState("Mohidul Haque");
  const [discountType, setDiscountType] = useState("amount"); // amount | percent
  const [discountValue, setDiscountValue] = useState(0);

  // Unique invoice ID generator + state
  const generateInvoiceId = () => {
    const now = new Date();
    const part1 = String(now.getFullYear()).slice(2);
    const part2 = String(now.getMonth() + 1).padStart(1, "0");
    const part3 = String(now.getHours()).padStart(1, "0");
    const part4 = String(now.getSeconds()).padStart(1, "0");
    return `${part4}${part3}${part2}${part1}`;
  };
  const [invoiceId, setInvoiceId] = useState(() => generateInvoiceId());

  // Calculate totals (ensure numeric types)
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.rate),
    0
  );
  const discountAmount = (() => {
    const val = Number(discountValue) || 0;
    if (discountType === "percent") {
      const pct = Math.min(Math.max(val, 0), 100);
      return Math.min(subtotal, (subtotal * pct) / 100);
    }
    return Math.min(Math.max(val, 0), subtotal);
  })();
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Date and invoice info
  const today = new Date();
  const date = today.toLocaleDateString();
  const currentDate = date;

  // Helper to build UPI deep link (used for QR + PDF button)
  const getUpiUrl = (amount) => {
    if (amount <= 0) return "";
    const upiId = "8900981511@nyes"; // Your UPI ID
    const payeeName = "Digital Seva Services"; // Payee name
    const note = `Invoice #${invoiceId}`; // Payment note
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

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
    const qtyNum = Number(newItem.qty);
    const rateNum = Number(newItem.rate);
    if (!newItem.description || qtyNum <= 0 || rateNum <= 0) {
      setItemError("Quantity and Rate must be greater than 0.");
      return;
    }
    setItems([
      ...items,
      { ...newItem, qty: qtyNum, rate: rateNum },
    ]);
    setNewItem({ icon: "", description: "", qty: 1, rate: 1, hsn: "" });
    setItemError("");
  };

  // Handle client info
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
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

    if (
      authCredentials.username === correctUsername &&
      authCredentials.password === correctPassword
    ) {
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthError("");
      // Store authentication in localStorage to remember the user
      localStorage.setItem("digitalInvoiceAuth", "true");
    } else {
      setAuthError("Invalid username or password. Please try again.");
      setAuthCredentials({ username: "", password: "" });
    }
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const isAuth = localStorage.getItem("digitalInvoiceAuth");
    if (isAuth === "true") {
      setIsAuthenticated(true);
      setShowAuthModal(false);
    }
    // Load invoice history
    loadInvoiceHistory();
  }, []);

  // Load invoice history from localStorage
  const loadInvoiceHistory = () => {
    try {
      const history = localStorage.getItem("digitalInvoiceHistory");
      if (history) {
        setInvoiceHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Error loading invoice history:", error);
    }
  };

  // Save invoice to history
  const saveToHistory = () => {
    const invoiceRecord = {
      id: invoiceId,
      date: currentDate,
      clientName: client.name || "Walk-in Customer",
      clientPhone: client.phone || "",
      totalAmount: grandTotal,
      discountType,
      discountValue,
      discountAmount,
      itemCount: items.length,
      items: items,
      author: author,
      createdAt: new Date().toISOString(),
      billPaid: billPaid,
    };

    try {
      const existingHistory = JSON.parse(
        localStorage.getItem("digitalInvoiceHistory") || "[]"
      );
      const updatedHistory = [invoiceRecord, ...existingHistory.slice(0, 99)]; // Keep last 100 invoices
      localStorage.setItem(
        "digitalInvoiceHistory",
        JSON.stringify(updatedHistory)
      );
      setInvoiceHistory(updatedHistory);
      return true;
    } catch (error) {
      console.error("Error saving to history:", error);
      return false;
    }
  };

  // Enhanced PDF download with history saving
  const downloadPDF = async (e) => {
    e.preventDefault();

    try {
      // Save to history before generating PDF
      if (items.length > 0) {
        saveToHistory();
      }

      // Create filename
      const fileName = `Invoice_${invoiceId}_${
        client.name || "Customer"
      }_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`;

      // Set document title for PDF
      const originalTitle = document.title;
      document.title = fileName.replace(".pdf", "");

      // Use browser's print functionality to save as PDF
      window.print();

      // Restore title
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Enhanced print function with history saving
  const funPrint = (e) => {
    e.preventDefault();

    // Save to history before printing
    if (items.length > 0) {
      saveToHistory();
    }

    // Create a filename with invoice details
    const fileName = `Invoice_${invoiceId}_${
      client.name || "Customer"
    }_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`;

    // Store original title
    const originalTitle = document.title;

    // Set document title for PDF filename
    document.title = fileName.replace(".pdf", "");

    // Trigger browser print dialog
    window.print();

    // Restore original title after a delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Filter invoice history based on search criteria
  const filteredHistory = invoiceHistory.filter((invoice) => {
    const matchesSearch =
      searchTerm === "" ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toString().includes(searchTerm) ||
      invoice.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      searchDate === "" ||
      new Date(invoice.createdAt).toLocaleDateString("en-IN").includes(searchDate) || // Ensure consistent date format
      invoice.date.includes(searchDate);

    return matchesSearch && matchesDate;
  });

  // Enhanced clear invoice history with math verification
  const clearHistory = () => {
    const randomNum1 = Math.floor(Math.random() * 10) + 1;
    const randomNum2 = Math.floor(Math.random() * 10) + 1;
    const userAnswer = prompt(
      `Are you sure you want to clear all invoice history? This action cannot be undone.\nTo confirm, solve this: ${randomNum1} + ${randomNum2} = ?`
    );

    if (userAnswer && parseInt(userAnswer) === randomNum1 + randomNum2) {
      localStorage.removeItem("digitalInvoiceHistory");
      setInvoiceHistory([]);
      alert("Invoice history cleared successfully.");
    } else {
      alert("Incorrect answer. Invoice history was not cleared.");
    }
  };

  // Enhanced load invoice from history to modify the existing invoice
  const loadInvoiceFromHistory = (invoice) => {
    setItems(invoice.items);
    setClient({
      name: invoice.clientName === "Walk-in Customer" ? "" : invoice.clientName,
      phone: invoice.clientPhone,
      address: "",
    });
    setAuthor(invoice.author);
    setBillPaid(invoice.billPaid);
    setShowClient(invoice.clientName !== "Walk-in Customer");
    setShowInvoiceHistory(false);
    setInvoiceId(invoice.id);
  };

  // Clear all data
  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      setItems([]);
      setClient({ name: "", address: "", phone: "" });
      setBillPaid(false);
      setShowClient(false);
      setNewItem({ icon: "", description: "", qty: 1, rate: 0, hsn: "" });
      setInvoiceId(generateInvoiceId());
    }
  };

  // Generate UPI payment QR code
  const generatePaymentQR = async (amount) => {
    const upiUrl = getUpiUrl(amount);
    if (!upiUrl) {
      setQrCodeUrl("");
      return;
    }
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      setQrCodeUrl("");
    }
  };

  // Update QR code when total or invoiceId changes
  useEffect(() => {
    generatePaymentQR(grandTotal);
  }, [grandTotal, invoiceId]);

  useEffect(() => {
    localStorage.setItem("printButtonPos", JSON.stringify(printBtnPos));
  }, [printBtnPos]);

  const startDrag = (e) => {
    // Only left mouse button or single touch
    if (e.type === "mousedown" && e.button !== 0) return;
    const point = e.touches ? e.touches[0] : e;
    const rect = btnRef.current?.getBoundingClientRect();
    dragOffsetRef.current = {
      x: point.clientX - (rect?.left || 0),
      y: point.clientY - (rect?.top || 0),
    };
    draggingRef.current = true;
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", endDrag);
  };

  const onDragMove = (e) => {
    if (!draggingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    const newX = point.clientX - dragOffsetRef.current.x;
    const newY = point.clientY - dragOffsetRef.current.y;
    // Constrain within viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = btnRef.current?.offsetWidth || 80;
    const height = btnRef.current?.offsetHeight || 40;
    setPrintBtnPos({
      x: Math.min(Math.max(0, newX), vw - width),
      y: Math.min(Math.max(0, newY), vh - height),
    });
  };

  const endDrag = () => {
    draggingRef.current = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", endDrag);
  };

  const handlePrintClick = (e) => {
    e.stopPropagation();
    funPrint(e);
  };

  // Add derived text for payment status (avoids JSX parse issues)
  const paymentMessage = billPaid ? "Thank you for your payment!" : "Scan or tap button to pay";

  return (
    <>
      {/* Draggable Print Button (screen only) */}
      {isAuthenticated && (
        <div
          ref={btnRef}
          className="fixed z-50 print:hidden select-none"
          style={{ left: printBtnPos.x, top: printBtnPos.y }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <button
            onClick={handlePrintClick}
            className="bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white font-semibold px-4 py-2 rounded shadow-lg shadow-orange-600/40 border border-orange-400 flex items-center gap-2"
            title="Drag to move. Click to print."
          >
            🖨️ Print
          </button>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to Digital Seva
              </h2>
              <p className="text-gray-600">
                Please login to access the invoice system
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
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
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      ></path>
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
        <div className="print:w-full print:h-auto w-full min-h-screen flex flex-col items-center py-8 print:py-2 rounded-2xl no-page-break ">
          {/* Toolbar */}
          <div className="w-full max-w-3xl bg-gray-50 px-4 py-3 print:py-1 print:px-2 flex flex-wrap justify-between items-center rounded-t-2xl shadow-sm print:shadow-none print:border-b print:border-gray-300 print:text-[11px] print:mb-1 mb-2 print:hidden">
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => setShowInvoiceHistory(true)}
                className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
              >
                📋 Invoice History
              </button>
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                🗑️ Clear All
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 print:hidden">
              <div className="text-xs text-blue-600 font-medium print:hidden">
                <a href="https://github.com/mohidul-hq/DigitalSevaService_Invoice/blob/main/README.md" target="_blank" className=" cursor-default" >
                  Invoice 
                  <span className="underline m-1 cursor-pointer">

                  #{invoiceId} 
                  </span>
                </a>
                • Items: {items.length} • Total: ₹
                  {grandTotal}
              </div>
            </div>
          </div>

          {/* Header section */}
          <div className="w-full max-w-3xl bg-blue-600 text-white justify-between items-center px-8 py-6 print:py-3 print:px-4 rounded-tr-4xl shadow-lg print:shadow-none hidden print:flex">
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
                  <span className="opacity-80">#{invoiceId}</span>
                  <span className="opacity-80">{currentDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info Toggle */}
          <div className="w-full max-w-3xl bg-cyan-400 px-4 py-3 print:py-2 print:px-3 flex flex-col gap-1 mt-1 rounded-bl-4xl rounded print:rounded-none print:mt-0">
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
              <div className="grid grid-cols-1 md:grid-cols-2  gap-1 mt-1">
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

                
              </div>
            )}
          </div>

          {/* Table section */}
          <div className="w-full max-w-3xl bg-white px-8 py-6 print:py-3 print:px-4 shadow print:shadow-none print:border print:border-gray-300 print:text-[12px]">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4 print:mb-2">
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
              <button
                type="button"
                onClick={() => setShowMoreSuggestions(v => !v)}
                className="border border-dashed rounded px-3 py-1 text-xs font-medium hover:bg-blue-50 text-blue-600 print:hidden"
              >
                {showMoreSuggestions ? "Hide More" : "More Suggestions"}
              </button>
            </div>
            {showMoreSuggestions && (
              <div className="print:hidden mb-4 max-h-40 overflow-auto border border-blue-100 rounded p-2 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-blue-50/40">
                {moreSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="bg-white hover:bg-blue-100 text-[11px] border border-blue-200 rounded px-2 py-1 flex items-center gap-1"
                  >
                    <span>{s.icon}</span>
                    <span className="truncate" title={s.description}>{s.description}</span>
                    <span className="ml-auto font-semibold">₹{s.rate}</span>
                  </button>
                ))}
              </div>
            )}
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
                min="1"
                step="any"
                value={newItem.rate}
                onChange={handleChange}
                required
              />
              {itemError && (
                <div className="w-full text-red-600 text-sm">{itemError}</div>
              )}
              <input
                className="border px-2 py-1 rounded w-24"
                name="hsn"
                placeholder="HSN/SAC"
                value={newItem.hsn}
                onChange={handleChange}
              />
              <button
                type="submit"
                disabled={!newItem.description || Number(newItem.qty) <= 0 || Number(newItem.rate) <= 0}
                className="bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-1 rounded hover:bg-green-700 hover:cursor-grab "
              >
                Add
              </button>
            </form>
            {/* Discount controls (screen only) */}
            <div className="flex items-center gap-2 mb-4 print:hidden">
              <label className="text-sm font-medium">Discount:</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="amount">Amount (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
              <input
                type="number"
                min="0"
                max={discountType === "percent" ? 100 : undefined}
                step="any"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="border px-2 py-1 rounded w-24"
              />
              <span className="text-xs text-gray-600">
                Applied: ₹{discountAmount}
              </span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="py-2 px-3 text-center font-semibold">Qty</th>
                  <th className="py-2 px-3 text-right font-semibold">Rate</th>
                  <th className="py-2 px-3 text-center font-semibold">
                    HSN/SAC
                  </th>
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
                  <td
                    colSpan={4}
                    className="py-2 px-3 text-right font-semibold"
                  >
                    Subtotal
                  </td>
                  <td className="py-2 px-3 text-right">₹{subtotal}</td>
                </tr>

                {/* Discount (printed) */}
                {discountAmount > 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right font-semibold">
                      Discount {discountType === "percent" ? `(${discountValue}%)` : ""}
                    </td>
                    <td className="py-2 px-3 text-right">-₹{discountAmount}</td>
                  </tr>
                )}

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
          <div className="w-full max-w-3xl bg-white px-8 py-6 print:py-3 print:px-4 flex flex-wrap justify-between items-center border-t shadow print:shadow-none print:border print:border-gray-300 print:mt-1">
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
                  {qrCodeUrl && (
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-32 h-32 mb-1 print:block hidden"
                    />
                  )}
                  {!qrCodeUrl && (
                    <div className="text-xs text-gray-500 hidden print:block text-center">
                      Generating QR...
                    </div>
                  )}
                  <h1 className="text-blue-400 hidden print:block text-center">
                    8900981511@nyes
                  </h1>
                  {grandTotal > 0 && (
                    <h2 className="text-green-600 hidden print:block text-center font-semibold">
                      Amount: ₹{grandTotal}
                    </h2>
                  )}
                </div>
              )}
              <div className="text-green-700 font-semibold text-lg mt-0 hidden print:block ">
                {paymentMessage}
              </div>
              {/* PDF-only Pay Now button (clickable in exported PDF) */}
              {!billPaid && grandTotal > 0 && (
                <a
                  href={getUpiUrl(grandTotal)}
                  className="hidden print:inline-block text-center bg-indigo-600 text-white text-xs px-5 py-2 rounded font-semibold mt-3 no-underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  ⚡ PAY NOW VIA UPI (₹{grandTotal})
                </a>
              )}
              {/* Screen Save as PDF button */}
            </div>
            {/* Signature / Authority */}
            <div className="flex-col items-center px-6 py-4 rounded mr-4 hidden print:flex">
              <h1 className="text-md mb-1 mr-40 ">For,</h1>
              <p className="uppercase font-bold">{author}</p>
              <p className="text-sm mt-20">Authorised Signatory</p>
            </div>
          </div>

          {/* Footer section */}
          <div className="w-full max-w-3xl bg-white px-8 py-4 print:py-2 print:px-4 rounded-b-2xl shadow flex-col gap-2 border-t mt-2 print:mt-1 hidden print:block print:shadow-none print:border print:border-gray-300">
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

      {/* Invoice History Modal */}
      {showInvoiceHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                Invoice History
              </h3>
              <button
                onClick={() => setShowInvoiceHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search Controls */}
            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Name/ID/Author
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Date
                </label>
                <input
                  type="text"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  placeholder="DD/MM/YYYY or partial date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSearchDate("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={clearHistory}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {invoiceHistory.length === 0 ? (
                    <div>
                      <p className="text-lg mb-2">No invoices found</p>
                      <p className="text-sm">
                        Create and download your first invoice to see it here
                      </p>
                    </div>
                  ) : (
                    <p>No invoices match your search criteria</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg text-blue-600">
                              Invoice #{invoice.id}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                invoice.billPaid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {invoice.billPaid ? "Paid" : "Pending"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Client:</span>{" "}
                              {invoice.clientName}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>{" "}
                              {invoice.date}
                            </div>
                            <div>
                              <span className="font-medium">Author:</span>{" "}
                              {invoice.author}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> ₹
                              {invoice.totalAmount}
                            </div>
                            {invoice.discountAmount > 0 && (
                              <div>
                                <span className="font-medium">Discount:</span> ₹
                                {invoice.discountAmount} {invoice.discountType === "percent" ? `(${invoice.discountValue}%)` : ""}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Items:</span>{" "}
                              {invoice.itemCount}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span>{" "}
                              {invoice.clientPhone || "N/A"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => loadInvoiceFromHistory(invoice)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Load Invoice
                        </button>
                      </div>

                      {/* Items preview */}
                      {invoice.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Items ({invoice.items.length})
                            </summary>
                            <div className="mt-2 space-y-1">
                              {invoice.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-xs text-gray-600 pl-4"
                                >
                                  <span>
                                    {item.icon} {item.description}
                                  </span>
                                  <span>
                                    {item.qty} × ₹{item.rate} = ₹
                                    {item.qty * item.rate}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
              <p>
                Total Records: {invoiceHistory.length} | Filtered:{" "}
                {filteredHistory.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
