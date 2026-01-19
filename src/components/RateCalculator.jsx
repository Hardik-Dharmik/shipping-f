import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCurrencySymbol, getCurrencyName, formatCurrency } from '../utils/currency';
import { api } from '../services/api';
import './RateCalculator.css';

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
    actualWeight: '',
    length: '',
    breadth: '',
    height: '',
    shipmentValue: ''
  });

  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');
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
      // Prepare data for API
      const rateData = {
        pickupCountry: formData.pickupCountry,
        pickupPincode: formData.pickupPincode,
        destinationCountry: formData.destinationCountry,
        destinationPincode: formData.destinationPincode,
        actualWeight: parseFloat(formData.actualWeight),
        length: formData.length ? parseFloat(formData.length) : null,
        breadth: formData.breadth ? parseFloat(formData.breadth) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        shipmentValue: parseFloat(formData.shipmentValue)
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
      actualWeight: '',
      length: '',
      breadth: '',
      height: '',
      shipmentValue: ''
    });
    setPickupSearchQuery('');
    setDestinationSearchQuery('');
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
          </div>
        )}
      </div>
    </div>
  );
}

export default RateCalculator;

