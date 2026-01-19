import './CreateOrder.css';

function CreateOrder() {
  return (
    <div className="create-order">
      <div className="create-order-container">
        <div className="coming-soon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <h1>Create Order</h1>
          <p className="coming-soon-text">Coming Soon</p>
          <p className="coming-soon-description">
            This feature is currently under development. Please check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;

