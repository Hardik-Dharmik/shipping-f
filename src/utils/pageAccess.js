export const PAGE_ROUTES = [
 ['customers','Customers','/customers'], ['rate_calculator','Rate calculator','/calculate-rate'],
 ['create_order','Create order','/orders/create'], ['users','Users','/admin/users'],
 ['home','Home','/home'], ['user_orders','User Orders','/admin/users/orders'],
 ['kyc_requests','KYC Requests','/admin/kyc/requests'], ['billing','Billing','/billing'], ['tickets','Tickets','/tickets'],
];
export const canAccessPage = (user, key) => user?.role === 'admin' || (user?.role === 'employee' && Array.isArray(user.page_permissions) && user.page_permissions.includes(key));
export function landingPage(user) {
 if (user?.role === 'admin') return '/home';
 if (user?.role !== 'employee') return '/calculate-rate';
 return PAGE_ROUTES.find(([key]) => canAccessPage(user,key))?.[2] || '/access-not-assigned';
}
export function routePermission(path) {
 if (/^\/admin\/(users\/[^/]+\/orders|orders\/[^/]+)$/.test(path)) return 'user_orders';
 if (path.startsWith('/admin/kyc/requests/')) return 'kyc_requests';
 if (['/orders/manual','/orders/confirmed'].includes(path)) return 'create_order';
 return PAGE_ROUTES.find(([, , route]) => route === path)?.[0];
}
