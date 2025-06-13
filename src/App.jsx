import { useState } from "react";
import "./App.css";

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
    icon: "📎",
    description: "Photo Cope",
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
  
  const funPrint = (e) => {
    e.preventDefault();
    print();
  };
  
  // Handle author radio change
  const handleAuthorRadio = (e) => {
    setAuthor(e.target.value);
  };
  return (
    <>
      <div className="print:w-[210mm] print:h-[297mm] w-full min-h-screen flex flex-col items-center  py-8 rounded-2xl">
        {/* Header section */}
        <div className="w-full max-w-3xl bg-blue-600 text-white justify-between items-center px-8 py-6 rounded-tr-4xl shadow-lg hidden print:flex">
          {/* Left: Logo and Company Info */}
          <div className="flex items-center gap-6">
            <img
              className="rounded-full w-18 h-18 bg-white p-2 shadow"
              src="../src/assets/Resources/Images/logo.png"
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
        src="./src/assets/Resources/Images/paid.png"
        alt="Paid"
        className="w-32 h-32 mb-1 print:block hidden"
      />
    ) : (
      <div>
        <img
        src="./src/assets/Resources/Images/QRCode.png"
        
        alt="QR Code"
        className="w-32 h-32 mb-1 print:block hidden"
      />
      <h1 className="text-blue-400">8900981511@ybl</h1>
      </div>  
    )}
    <div className="text-green-700 font-semibold text-lg mt-2 hidden print:block ">
      {billPaid ? "Thank you for your payment!" : "Scan to pay instantly"}
    </div>

    {/* Print button */}
    
  </div>
  <button
      onClick={funPrint}
      className="print:hidden mt-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-200"
    >
      <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-transparent">
        🖨️ Print
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
              : `INR ${grandTotal.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                  style: "decimal",
                })} Only`}
          </div>
          <div className="text-gray-700 text-sm">
            <span className="font-semibold">Terms & Conditions:</span>This invoice is system-generated and does not require a signature. For any queries or support, please contact us at {" "}
            <span className="underline">+91-8900981511</span>.
          </div>
          <div className="text-blue-700 font-semibold text-center mt-2">
            {showClient && client.name
              ? `Dear ${client.name}, we appreciate your business!`
              : "Thank you for choosing Digital Seva Services."}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
