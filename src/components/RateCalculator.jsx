import { useState } from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import './RateCalculator.css';

function RateCalculator() {
  const { isCollapsed } = useSidebar();
  const [formData, setFormData] = useState({
    pickupCountry: '',
    pickupPincode: '',
    destinationCountry: '',
    destinationPincode: '',
    actualWeight: '',
    length: '',
    breadth: '',
    height: '',
    shipmentValue: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    // TODO: Implement rate calculation logic
    console.log('Calculating rate with data:', formData);
    alert('Rate calculation functionality will be implemented here');
  };

  const handleReset = () => {
    setFormData({
      pickupCountry: '',
      pickupPincode: '',
      destinationCountry: '',
      destinationPincode: '',
      actualWeight: '',
      length: '',
      breadth: '',
      height: '',
      shipmentValue: ''
    });
  };

  return (
    <div className={`rate-calculator ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="calculator-container">
        <h1>Rate Calculator</h1>
        <form onSubmit={handleCalculate} className="calculator-form">
          <div className="form-section">
            <h2>Pickup Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupCountry">Pickup Country *</label>
                <input
                  type="text"
                  id="pickupCountry"
                  name="pickupCountry"
                  value={formData.pickupCountry}
                  onChange={handleChange}
                  required
                  placeholder="Enter pickup country"
                />
              </div>
              <div className="form-group">
                <label htmlFor="pickupPincode">Pickup Pin Code *</label>
                <input
                  type="text"
                  id="pickupPincode"
                  name="pickupPincode"
                  value={formData.pickupPincode}
                  onChange={handleChange}
                  required
                  placeholder="Enter pickup pin code"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Destination Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="destinationCountry">Destination Country *</label>
                <input
                  type="text"
                  id="destinationCountry"
                  name="destinationCountry"
                  value={formData.destinationCountry}
                  onChange={handleChange}
                  required
                  placeholder="Enter destination country"
                />
              </div>
              <div className="form-group">
                <label htmlFor="destinationPincode">Destination Pin Code *</label>
                <input
                  type="text"
                  id="destinationPincode"
                  name="destinationPincode"
                  value={formData.destinationPincode}
                  onChange={handleChange}
                  required
                  placeholder="Enter destination pin code"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Shipment Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="actualWeight">Actual Weight (kg) *</label>
                <input
                  type="number"
                  id="actualWeight"
                  name="actualWeight"
                  value={formData.actualWeight}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter weight in kg"
                />
              </div>
              <div className="form-group">
                <label htmlFor="shipmentValue">Shipment Value *</label>
                <input
                  type="number"
                  id="shipmentValue"
                  name="shipmentValue"
                  value={formData.shipmentValue}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter shipment value"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Dimensions (cm)</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="length">Length</label>
                <input
                  type="number"
                  id="length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter length"
                />
              </div>
              <div className="form-group">
                <label htmlFor="breadth">Breadth</label>
                <input
                  type="number"
                  id="breadth"
                  name="breadth"
                  value={formData.breadth}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter breadth"
                />
              </div>
              <div className="form-group">
                <label htmlFor="height">Height</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter height"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleReset} className="btn btn-reset">
              Reset
            </button>
            <button type="submit" className="btn btn-calculate">
              Calculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RateCalculator;

