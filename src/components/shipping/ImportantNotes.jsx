import React from 'react';

const ImportantNotes = ({ style, className }) => {
  return (
    <div 
      className={`important-notes ${className || ''}`} 
      style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px', 
        border: '1px solid #ddd', 
        fontSize: '0.85rem', 
        color: '#555', 
        ...style 
      }}
    >
      <h4 style={{ marginBottom: '10px', color: '#333', fontSize: '1rem' }}>Important Notes:</h4>
      <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.5' }}>
        <li>IF THE SHIPMENT is considered NON STACKABLE , Additional 1250AED Will be billed Accordingly for every pieces / pallet / packages</li>
        <li>The above quotation is based on the variables provided in your request. Any change in origin, destination, etc. will result in a variance in the rate quoted.</li>
        <li>This quote is based on the committed weight provided. Chargeable weight would be based on gross weight or reweigh volumetric weight (the greater of the two).</li>
        <li>If the shipment weight varies, then the rate will be subject to change according to the final weight (without prior notification)</li>
        <li>Fuel surcharge is based on the variable Fuel index of the current month.</li>
        <li>Transit Time by Air Express depends on destination country and is excluding customs formalities.</li>
        <li>Increased transit time and additional cost might incur for any shipment with a weight exceeding 1,000kgs or 300x200x150 in dimensional weight.</li>
        <li>Value Added Surcharges, Custom Duties and other relevant taxes are excluded.</li>
        <li>This quotation applies for freight charges billed in UAE.</li>
      </ul>
    </div>
  );
};

export default ImportantNotes;
