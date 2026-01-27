import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCurrencySymbol, getCurrencyName, formatCurrency } from '../../utils/currency';
import { api } from '../../services/api';
import './RateCalculator.css';
import ImportantNotes from './ImportantNotes';

const COUNTRIES = [
  'UAE',
  'GERMANY',
  'UK',
  'USA',
  'INDIA',
  'CHINA',
  'SOUTH KOREA',
  'FRANCE',
  'AUSTRALIA',
  'CANADA',
  'SAUDI',
  'BAHRAIN',
  'OMAN',
  'QATAR',
  'EGYPT'
];

// Countries that use city name instead of pincode
const CITY_NAME_COUNTRIES = ['UAE', 'OMAN', 'QATAR', 'EGYPT'];

function RateCalculator() {
  const [formData, setFormData] = useState({
    pickupCountry: '',
    pickupPincode: '',
    destinationCountry: '',
    destinationPincode: '',
    shipmentValue: ''
  });

  // Boxes array - each box has weight and dimensions
  const [boxes, setBoxes] = useState([
    {
      id: 1,
      quantity: 1,
      actualWeight: '',
      length: '',
      breadth: '',
      height: ''
    }
  ]);

  const [weightUnit, setWeightUnit] = useState('kg'); // 'kg' or 'pound'
  const [dimensionUnit, setDimensionUnit] = useState('cm'); // 'cm' or 'inches'

  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
  const [requireBOE, setRequireBOE] = useState(false);
  const [requireDO, setRequireDO] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const pickupDropdownRef = useRef(null);
  const destinationDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickupDropdownRef.current && !pickupDropdownRef.current.contains(event.target)) {
        setPickupDropdownOpen(false);
      }
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(event.target)) {
        setDestinationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredCountries = (query) => {
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(country =>
      country.toLowerCase().includes(query.toLowerCase())
    );
  };

  const requiresCityName = (country) => {
    return CITY_NAME_COUNTRIES.includes(country.toUpperCase());
  };

  // Calculate volumetric weight for a single box
  const calculateBoxVolumetricWeight = (box) => {
    const length = parseFloat(box.length);
    const breadth = parseFloat(box.breadth);
    const height = parseFloat(box.height);

    if (!length || !breadth || !height) {
      return 0;
    }

    if (dimensionUnit === 'cm') {
      // Formula: L×b×h÷5000 (result in kg)
      return (length * breadth * height) / 5000;
    } else {
      // Formula: L×b×h÷306 (result in pounds)
      return (length * breadth * height) / 306;
    }
  };

  // Get applicable weight for a single box (maximum of actual and volumetric) multiplied by quantity
  const getBoxApplicableWeight = (box) => {
    const quantity = parseInt(box.quantity) || 1;
    const actual = parseFloat(box.actualWeight) || 0;
    const volumetric = calculateBoxVolumetricWeight(box);
    return Math.max(actual, volumetric) * quantity;
  };

  // Calculate total actual weight across all boxes (accounting for quantity)
  const getTotalActualWeight = () => {
    return boxes.reduce((total, box) => {
      const quantity = parseInt(box.quantity) || 1;
      const weight = parseFloat(box.actualWeight) || 0;
      return total + (weight * quantity);
    }, 0);
  };

  // Calculate total volumetric weight across all boxes (accounting for quantity)
  const getTotalVolumetricWeight = () => {
    return boxes.reduce((total, box) => {
      const quantity = parseInt(box.quantity) || 1;
      const volumetric = calculateBoxVolumetricWeight(box);
      return total + (volumetric * quantity);
    }, 0);
  };

  // Get total applicable weight (sum of max weight from each box type)
  // For each box: take max(actual per box, volumetric per box) × quantity, then sum all boxes
  const getTotalApplicableWeight = () => {
    return boxes.reduce((total, box) => {
      return total + getBoxApplicableWeight(box);
    }, 0);
  };

  // Add a new box
  const addBox = () => {
    const newId = Math.max(...boxes.map(b => b.id), 0) + 1;
    setBoxes([...boxes, {
      id: newId,
      quantity: 1,
      actualWeight: '',
      length: '',
      breadth: '',
      height: ''
    }]);
  };

  // Remove a box
  const removeBox = (boxId) => {
    if (boxes.length > 1) {
      setBoxes(boxes.filter(box => box.id !== boxId));
    } else {
      toast.warning('At least one box is required');
    }
  };

  // Update a specific box field
  const updateBox = (boxId, field, value) => {
    setBoxes(boxes.map(box => 
      box.id === boxId ? { ...box, [field]: value } : box
    ));
  };

  const getPickupFieldLabel = () => {
    return requiresCityName(formData.pickupCountry) ? 'Pickup City Name *' : 'Pickup Pin Code *';
  };

  const getPickupFieldPlaceholder = () => {
    return requiresCityName(formData.pickupCountry) ? 'Enter pickup city name' : 'Enter pickup pin code';
  };

  const getDestinationFieldLabel = () => {
    return requiresCityName(formData.destinationCountry) ? 'Destination City Name *' : 'Destination Pin Code *';
  };

  const getDestinationFieldPlaceholder = () => {
    return requiresCityName(formData.destinationCountry) ? 'Enter destination city name' : 'Enter destination pin code';
  };

  const handleCountrySelect = (country, field) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: country
      };
      // Clear the pincode/city field when country changes
      if (field === 'pickupCountry') {
        updated.pickupPincode = '';
      } else if (field === 'destinationCountry') {
        updated.destinationPincode = '';
      }
      return updated;
    });
    if (field === 'pickupCountry') {
      setPickupDropdownOpen(false);
      setPickupSearchQuery('');
    } else {
      setDestinationDropdownOpen(false);
      setDestinationSearchQuery('');
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get total applicable weight
      const totalApplicableWeight = getTotalApplicableWeight();
      
      // Convert weight to kg if needed (API expects kg)
      let weightInKg = totalApplicableWeight;
      if (weightUnit === 'pound') {
        weightInKg = totalApplicableWeight * 0.453592; // Convert pounds to kg
      }

      // Prepare boxes data for API - convert all dimensions to cm
      const boxesData = boxes.map(box => {
        let lengthInCm = box.length ? parseFloat(box.length) : null;
        let breadthInCm = box.breadth ? parseFloat(box.breadth) : null;
        let heightInCm = box.height ? parseFloat(box.height) : null;
        
        if (dimensionUnit === 'inches') {
          if (lengthInCm) lengthInCm = lengthInCm * 2.54;
          if (breadthInCm) breadthInCm = breadthInCm * 2.54;
          if (heightInCm) heightInCm = heightInCm * 2.54;
        }

        // Calculate box applicable weight (per unit)
        const quantity = parseInt(box.quantity) || 1;
        const boxActual = parseFloat(box.actualWeight) || 0;
        const boxVolumetric = calculateBoxVolumetricWeight(box);
        let boxWeightPerUnitInKg = Math.max(boxActual, boxVolumetric);
        if (weightUnit === 'pound') {
          boxWeightPerUnitInKg = boxWeightPerUnitInKg * 0.453592;
        }

        return {
          quantity: quantity,
          actualWeight: boxWeightPerUnitInKg * quantity, // Total weight for all boxes of this type
          length: lengthInCm,
          breadth: breadthInCm,
          height: heightInCm
        };
      });

      // Prepare data for API
      const rateData = {
        pickupCountry: formData.pickupCountry,
        pickupPincode: formData.pickupPincode,
        destinationCountry: formData.destinationCountry,
        destinationPincode: formData.destinationPincode,
        actualWeight: weightInKg, // Total applicable weight converted to kg
        boxes: boxesData, // Array of boxes with individual weights and dimensions
        shipmentValue: parseFloat(formData.shipmentValue),
        requireBOE: requireBOE,
        requireDO: requireDO,
      };

      const response = await api.calculateRate(rateData);
      
      if (response.success && response.data) {
        setResult(response.data);
        toast.success('Rate calculated successfully!');
        // Scroll to results section
        setTimeout(() => {
          const resultsSection = document.getElementById('results-section');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Calculate rate error:', err);
      const errorMessage = err.message || 'Failed to calculate rate. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      pickupCountry: '',
      pickupPincode: '',
      destinationCountry: '',
      destinationPincode: '',
      shipmentValue: ''
    });
    setBoxes([{
      id: 1,
      quantity: 1,
      actualWeight: '',
      length: '',
      breadth: '',
      height: ''
    }]);
    setWeightUnit('kg');
    setDimensionUnit('cm');
    setPickupSearchQuery('');
    setDestinationSearchQuery('');
    setRequireBOE(false);
    setRequireDO(false);
    setPickupDropdownOpen(false);
    setDestinationDropdownOpen(false);
    setResult(null);
    setError(null);
    setIsModalOpen(false);
  };

  const handleCreateShipment = async (quote) => {
    try {
      // TODO: Implement create shipment API call
      console.log('Creating shipment with quote:', quote);
      console.log('Order details:', result);
      toast.success(`Shipment creation initiated for ${quote.carrier}`);
      // You can add API call here when ready
      // await api.createShipment({ ...result, selectedQuote: quote });
    } catch (err) {
      console.error('Create shipment error:', err);
      toast.error('Failed to create shipment. Please try again.');
    }
  };

  return (
    <div className="rate-calculator">
      <div className="calculator-container">
        <h1>Rate Calculator</h1>
        <form onSubmit={handleCalculate} className="calculator-form">
          <div className="form-section">
            <h2>Pickup Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pickupCountry">Pickup Country *</label>
                <div className="searchable-dropdown" ref={pickupDropdownRef}>
                  <input
                    type="text"
                    id="pickupCountry"
                    name="pickupCountry"
                    value={formData.pickupCountry}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, pickupCountry: e.target.value }));
                      setPickupSearchQuery(e.target.value);
                      setPickupDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setPickupSearchQuery(formData.pickupCountry);
                      setPickupDropdownOpen(true);
                    }}
                    required
                    placeholder="Search or select country"
                    autoComplete="off"
                  />
                  {pickupDropdownOpen && (
                    <div className="dropdown-list">
                      <input
                        type="text"
                        className="dropdown-search"
                        placeholder="Search countries..."
                        value={pickupSearchQuery}
                        onChange={(e) => {
                          setPickupSearchQuery(e.target.value);
                          setFormData(prev => ({ ...prev, pickupCountry: e.target.value }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="dropdown-options">
                        {filteredCountries(pickupSearchQuery).length > 0 ? (
                          filteredCountries(pickupSearchQuery).map((country) => (
                            <div
                              key={country}
                              className={`dropdown-option ${formData.pickupCountry === country ? 'selected' : ''}`}
                              onClick={() => handleCountrySelect(country, 'pickupCountry')}
                            >
                              {country}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="pickupPincode">{getPickupFieldLabel()}</label>
                <input
                  type="text"
                  id="pickupPincode"
                  name="pickupPincode"
                  value={formData.pickupPincode}
                  onChange={handleChange}
                  required
                  placeholder={getPickupFieldPlaceholder()}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Destination Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="destinationCountry">Destination Country *</label>
                <div className="searchable-dropdown" ref={destinationDropdownRef}>
                  <input
                    type="text"
                    id="destinationCountry"
                    name="destinationCountry"
                    value={formData.destinationCountry}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, destinationCountry: e.target.value }));
                      setDestinationSearchQuery(e.target.value);
                      setDestinationDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setDestinationSearchQuery(formData.destinationCountry);
                      setDestinationDropdownOpen(true);
                    }}
                    required
                    placeholder="Search or select country"
                    autoComplete="off"
                  />
                  {destinationDropdownOpen && (
                    <div className="dropdown-list">
                      <input
                        type="text"
                        className="dropdown-search"
                        placeholder="Search countries..."
                        value={destinationSearchQuery}
                        onChange={(e) => {
                          setDestinationSearchQuery(e.target.value);
                          setFormData(prev => ({ ...prev, destinationCountry: e.target.value }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="dropdown-options">
                        {filteredCountries(destinationSearchQuery).length > 0 ? (
                          filteredCountries(destinationSearchQuery).map((country) => (
                            <div
                              key={country}
                              className={`dropdown-option ${formData.destinationCountry === country ? 'selected' : ''}`}
                              onClick={() => handleCountrySelect(country, 'destinationCountry')}
                            >
                              {country}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="destinationPincode">{getDestinationFieldLabel()}</label>
                <input
                  type="text"
                  id="destinationPincode"
                  name="destinationPincode"
                  value={formData.destinationPincode}
                  onChange={handleChange}
                  required
                  placeholder={getDestinationFieldPlaceholder()}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Shipment Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="shipmentValue">Shipment Value ({getCurrencyName()}) *</label>
                <input
                  type="number"
                  id="shipmentValue"
                  name="shipmentValue"
                  value={formData.shipmentValue}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder={`Enter shipment value in ${getCurrencyName()}`}
                />
              </div>
              <div className="form-group">
                <label>Units</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={weightUnit}
                    onChange={(e) => {
                      setWeightUnit(e.target.value);
                      // Auto-update dimension unit to match
                      setDimensionUnit(e.target.value === 'kg' ? 'cm' : 'inches');
                    }}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    <option value="kg">Weight: kg, Dimensions: cm</option>
                    <option value="pound">Weight: lb, Dimensions: inches</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Boxes</h2>
              <button
                type="button"
                onClick={addBox}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + Add Box
              </button>
            </div>

            {boxes.map((box, index) => (
              <div key={box.id} style={{
                marginBottom: '20px',
                padding: '20px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#34495e' }}>
                    Box {index + 1}
                    {parseInt(box.quantity) > 1 && (
                      <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '8px' }}>
                        (Qty: {box.quantity})
                      </span>
                    )}
                  </h3>
                  {boxes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBox(box.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-row" style={{ marginBottom: '15px' }}>
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      value={box.quantity}
                      onChange={(e) => updateBox(box.id, 'quantity', e.target.value)}
                      required
                      min="1"
                      step="1"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="form-group">
                    <label>Actual Weight per Box ({weightUnit}) *</label>
                    <input
                      type="number"
                      value={box.actualWeight}
                      onChange={(e) => updateBox(box.id, 'actualWeight', e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder={`Enter weight per box in ${weightUnit}`}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Length ({dimensionUnit})</label>
                    <input
                      type="number"
                      value={box.length}
                      onChange={(e) => updateBox(box.id, 'length', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder={`Enter length in ${dimensionUnit}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Breadth ({dimensionUnit})</label>
                    <input
                      type="number"
                      value={box.breadth}
                      onChange={(e) => updateBox(box.id, 'breadth', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder={`Enter breadth in ${dimensionUnit}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Height ({dimensionUnit})</label>
                    <input
                      type="number"
                      value={box.height}
                      onChange={(e) => updateBox(box.id, 'height', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder={`Enter height in ${dimensionUnit}`}
                    />
                  </div>
                </div>

                {/* Individual box weight calculation */}
                {(box.actualWeight || (box.length && box.breadth && box.height)) && (
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#7f8c8d', fontWeight: '500' }}>Quantity:</span>
                        <span style={{ fontWeight: '600', color: '#34495e' }}>
                          {parseInt(box.quantity) || 1} box{parseInt(box.quantity) !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#7f8c8d' }}>Actual (per box):</span>
                        <span style={{ fontWeight: '500' }}>
                          {box.actualWeight ? `${parseFloat(box.actualWeight).toFixed(2)} ${weightUnit}` : 'Not entered'}
                        </span>
                      </div>
                      {box.length && box.breadth && box.height && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#7f8c8d' }}>Volumetric (per box):</span>
                            <span style={{ fontWeight: '500' }}>
                              {calculateBoxVolumetricWeight(box).toFixed(2)} {weightUnit}
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            borderTop: '1px solid #dee2e6',
                            marginTop: '4px',
                            fontWeight: '600',
                            color: '#27ae60'
                          }}>
                            <span>Total Applicable Weight ({parseInt(box.quantity) || 1} box{parseInt(box.quantity) !== 1 ? 'es' : ''}):</span>
                            <span>{getBoxApplicableWeight(box).toFixed(2)} {weightUnit}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Total Weight Display Section */}
            {(getTotalActualWeight() > 0 || getTotalVolumetricWeight() > 0) && (
              <div className="weight-display" style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e8f5e9',
                borderRadius: '6px',
                border: '2px solid #27ae60'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#27ae60', fontWeight: '600' }}>Total Weight Calculation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#34495e', fontWeight: '500' }}>Total Actual Weight:</span>
                    <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '16px' }}>
                      {getTotalActualWeight().toFixed(2)} {weightUnit}
                    </span>
                  </div>
                  {getTotalVolumetricWeight() > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#34495e', fontWeight: '500' }}>Total Volumetric Weight:</span>
                        <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '16px' }}>
                          {getTotalVolumetricWeight().toFixed(2)} {weightUnit}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '10px',
                        borderTop: '2px solid #27ae60',
                        marginTop: '8px'
                      }}>
                        <span style={{ fontWeight: '700', color: '#27ae60', fontSize: '16px' }}>Total Applicable Weight (Sum of Max per Box):</span>
                        <span style={{ fontWeight: '700', fontSize: '20px', color: '#27ae60' }}>
                          {getTotalApplicableWeight().toFixed(2)} {weightUnit}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Additional Services</h2>
            <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="requireBOE"
                  checked={requireBOE}
                  onChange={(e) => setRequireBOE(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="requireBOE" style={{ cursor: 'pointer', fontSize: '15px' }}>
                  REQUIRE BOE (Optional - 100 AED)
                </label>
              </div>
              <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="requireDO"
                  checked={requireDO}
                  onChange={(e) => setRequireDO(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="requireDO" style={{ cursor: 'pointer', fontSize: '15px' }}>
                  REQUIRE D/O (Optional - 100 AED)
                </label>
              </div>
              {formData.pickupCountry && formData.pickupCountry.toUpperCase() === 'UAE' && (
                <div className="info-box" style={{ 
                  padding: '10px', 
                  backgroundColor: '#e3f2fd', 
                  border: '1px solid #90caf9', 
                  borderRadius: '4px',
                  color: '#0d47a1',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '18px' }}>ℹ️</span>
                  <span>
                    <strong>EXPORT DECLARATION</strong> is mandatory for all export bookings from UAE. 
                    (Additional charge: 120 AED)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleReset} className="btn btn-reset">
              Reset
            </button>
            <button type="submit" className="btn btn-calculate" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Order Details Modal */}
        {isModalOpen && result && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Order Details</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="details-card">
                  <div className="detail-item">
                    <span className="detail-label">Pickup Country:</span>
                    <span className="detail-value">{result.pickup.country}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      {requiresCityName(result.pickup.country) ? 'Pickup City:' : 'Pickup Pin Code:'}
                    </span>
                    <span className="detail-value">{result.pickup.pincode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Destination Country:</span>
                    <span className="detail-value">{result.destination.country}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      {requiresCityName(result.destination.country) ? 'Destination City:' : 'Destination Pin Code:'}
                    </span>
                    <span className="detail-value">{result.destination.pincode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Weight:</span>
                    <span className="detail-value">{result.weight.actualWeight} {result.weight.unit}</span>
                  </div>
                  {result.dimensions && (
                    <div className="detail-item">
                      <span className="detail-label">Dimensions:</span>
                      <span className="detail-value">
                        {result.dimensions.length} × {result.dimensions.breadth} × {result.dimensions.height} cm
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Shipment Value:</span>
                    <span className="detail-value">
                      {formatCurrency(result.shipmentValue.value)}
                    </span>
                  </div>
                  {result.calculatedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Calculated At:</span>
                      <span className="detail-value">
                        {new Date(result.calculatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section - Only Services Table */}
        {result && (
          <div id="results-section" className="results-section">
            <div className="results-header">
              <h2>Rate Calculation Results</h2>
              <button 
                className="btn btn-view-details" 
                onClick={() => setIsModalOpen(true)}
              >
                View Order Details
              </button>
            </div>
            <div className="results-container">
              <div className="services-table">
                <h3>Available Services</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Carrier</th>
                        <th>Cost</th>
                        <th>Delivery Time</th>
                        <th>Estimated Delivery</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.quotes && result.quotes.length > 0 ? (
                        result.quotes.map((quote, index) => (
                          <tr key={index}>
                            <td className="carrier-name">{quote.carrier}</td>
                            <td className="cost">{formatCurrency(quote.cost)}</td>
                            <td>{quote.estimatedDelivery}</td>
                            <td className="delivery-date">{quote.estimatedDeliveryReadable}</td>
                            <td>
                              <button 
                                className="btn-create-shipment"
                                onClick={() => handleCreateShipment(quote)}
                              >
                                Create Shipment
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="no-quotes">No quotes available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <ImportantNotes />
          </div>
        )}
      </div>
    </div>
  );
}

export default RateCalculator;

