const TRUTHY_VALUES = new Set(['true', '1', 'yes', 'employee']);

function isTruthyFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return TRUTHY_VALUES.has(value.trim().toLowerCase());
  }
  return false;
}

export function getOrganizationId(user) {
  return (
    user?.organization_id ||
    user?.org_id ||
    user?.organizationId ||
    user?.orgId ||
    ''
  );
}

export function isEmployeeUser(user) {
  const role = String(
    user?.organization_role ||
      user?.org_role ||
      user?.member_type ||
      user?.user_type ||
      ''
  )
    .trim()
    .toLowerCase();

  return (
    role === 'employee' ||
    isTruthyFlag(user?.is_employee) ||
    isTruthyFlag(user?.isEmployee) ||
    isTruthyFlag(user?.employee_of_org) ||
    isTruthyFlag(user?.employeeOfOrg)
  );
}

export function isKycRequiredForUser(user) {
  if (!user || ['admin', 'employee'].includes(user?.role)) {
    return false;
  }

  if (
    isTruthyFlag(user?.kyc_exempt) ||
    isTruthyFlag(user?.kycExempt) ||
    String(user?.kyc_required).trim().toLowerCase() === 'false' ||
    String(user?.kycRequired).trim().toLowerCase() === 'false'
  ) {
    return false;
  }

  return !isEmployeeUser(user);
}
