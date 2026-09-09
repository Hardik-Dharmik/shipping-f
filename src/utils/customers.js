export function customerList(response) {
  const data = response?.data ?? response;
  const rows = Array.isArray(data) ? data : data?.customers ?? data?.suggestions ?? data?.items ?? data?.results ?? [];
  return Array.isArray(rows) ? rows.map(normalizeCustomer) : [];
}

export function normalizeCustomer(customer) {
  return { ...customer, id: String(customer.id), company_name: customer.company_name ?? customer.companyName ?? '', phone_number: customer.phone_number ?? customer.phoneNumber ?? '' };
}
