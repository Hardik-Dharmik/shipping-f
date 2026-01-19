import { useSidebar } from '../contexts/SidebarContext';
import './Orders.css';

function Orders() {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={`orders ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="orders-container">
        <h1>Orders</h1>
        <p>Orders page will be implemented here.</p>
      </div>
    </div>
  );
}

export default Orders;

