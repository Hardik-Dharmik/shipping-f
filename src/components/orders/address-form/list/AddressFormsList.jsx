import { Link } from 'react-router-dom';
import { api } from '../../../../services/api';
import './AddressFormsList.css';
import '../../order-list/Orders.css';
import AddressFormsTable from './AddressFormsTable';

function AddressFormsList() {
  return (
    <div className="address-forms-page">
      <div className="address-forms-container">
        <div className="address-forms-header">
          <div>
            <h1>Address Forms</h1>
            <p>Submitted pickup and destination data from shared links.</p>
          </div>
          <Link to="/orders/create" className="address-forms-create-link">Create Link</Link>
        </div>

        <AddressFormsTable fetchForms={api.getAddressForms} />
      </div>
    </div>
  );
}

export default AddressFormsList;
